from __future__ import annotations
import base64, io, json, math, os, re, shutil, subprocess, threading, time, uuid
from functools import lru_cache
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, unquote
from PIL import Image, ImageDraw, ImageFont, ImageOps, features

ROOT=Path(__file__).resolve().parent; STATIC=ROOT/'static'
# A Vercel function's deployed files are read-only.  Keep generated files in
# its writable scratch directory, while preserving the existing local/Docker
# runtime directory everywhere else.
WORK=Path(os.getenv('TEMPLE_WORK_DIR','/tmp/temple-studio' if os.getenv('VERCEL') else ROOT/'runtime')).resolve(); UPLOAD=WORK/'uploads'; EXPORT=WORK/'exports'
for p in [UPLOAD,EXPORT]:p.mkdir(parents=True,exist_ok=True)
DATA=json.loads((ROOT/'data/temples.json').read_text(encoding='utf-8')); BYDAY={x['day']:x for x in DATA}
W,H,HEADER=1080,1920,550; FPS=15; CREAM=(255,239,220)
TEMPLATE=Image.open(STATIC/'assets/content-template.png').convert('RGB'); OPEN_TEMPLATE=Image.open(STATIC/'assets/opening-template.png').convert('RGB'); CREAM=OPEN_TEMPLATE.getpixel((20,20))
JOBS={}; LOCK=threading.Lock(); RENDER_SLOTS=threading.BoundedSemaphore(1)

def font_path(lang):
    env=os.getenv('TEMPLE_FONT_TE' if lang=='te' else 'TEMPLE_FONT_EN')
    if env and Path(env).is_file():return env
    names=['NotoSerifTelugu-Bold.ttf','NotoSansTelugu-Bold.ttf'] if lang=='te' else ['NotoSerif-Bold.ttf','LiberationSerif-Bold.ttf','DejaVuSerif-Bold.ttf']
    dirs=[Path('/usr/share/fonts/truetype/noto'),Path('/usr/share/fonts/truetype/liberation2'),Path('/usr/share/fonts/truetype/dejavu'),Path('/usr/share/fonts/opentype/noto')]
    for d in dirs:
        for n in names:
            if (d/n).is_file():return str(d/n)
    win=Path(os.environ.get('WINDIR','C:/Windows'))/'Fonts'
    for n in (['NirmalaB.ttf','Nirmala.ttf','gautami.ttf'] if lang=='te' else ['georgiab.ttf','timesbd.ttf']):
        if (win/n).is_file():return str(win/n)
    if shutil.which('fc-match'):
        result=subprocess.run(['fc-match','-f','%{file}','Noto Serif Telugu:style=Bold' if lang=='te' else 'Noto Serif:style=Bold'],capture_output=True,text=True).stdout.strip()
        if Path(result).is_file():return result
    raise RuntimeError('Install Noto Serif and Noto Serif Telugu fonts (see README).')
@lru_cache(maxsize=128)
def font(lang,size):
    if lang=='te' and not features.check('raqm'):raise RuntimeError('Pillow RAQM text shaping is required for Telugu. Use Docker or install a current Pillow wheel.')
    return ImageFont.truetype(font_path(lang),size,layout_engine=ImageFont.Layout.RAQM if features.check('raqm') else ImageFont.Layout.BASIC)

def wrap_text(text,f,maxw):
    lines=[]
    for para in text.split('\n'):
        words=para.split(); line=''
        for word in words:
            trial=(line+' '+word).strip()
            if line and f.getlength(trial)>maxw:lines.append(line);line=word
            else:line=trial
        if line:lines.append(line)
        elif para=='':lines.append('')
    return lines or ['']

def line_layout(text,lang,kind,duration):
    ishook=kind=='hook'; maxw=890 if ishook else 890; maxh=420 if ishook else 1350; size=60 if ishook else 49
    while size>=22:
        f=font(lang,size); lines=wrap_text(text,f,maxw); step=round(size*(1.34 if lang=='te' else 1.30)); boxes=[f.getbbox(x or ' ') for x in lines];
        if max([f.getlength(x) for x in lines],default=0)<=maxw and step*len(lines)<=maxh:break
        size-=2
    if max([f.getlength(x) for x in lines],default=0)>maxw or step*len(lines)>maxh:raise ValueError('Text is too long for the selected card. Shorten the text.')
    total=step*len(lines); y=(HEADER-total)//2 if ishook else (H-total)//2; groups=1 if ishook else min(len(lines),max(1,duration-1)); out=[]
    for i,(line,box) in enumerate(zip(lines,boxes)):
        l,t,r,b=box; ww=max(1,r-l+8); hh=max(1,b-t+8); layer=Image.new('RGBA',(ww,hh)); draw=ImageDraw.Draw(layer);draw.text((4-l,4-t),line,font=f,fill=(17,14,12,255))
        x=round((W-ww)/2) if ishook else 94; yy=round(y+i*step+(step-hh)/2)
        out.append({'x':x,'y':yy,'start':0 if ishook else i*groups//len(lines),'im':layer})
    return out

def safe_image(path):
    if not isinstance(path,str):raise ValueError('Invalid image')
    if path.startswith('/assets/'):
        p=(STATIC/path.lstrip('/')).resolve(); base=(STATIC/'assets').resolve()
    elif path.startswith('/uploads/'):
        p=(UPLOAD/path.removeprefix('/uploads/')).resolve();base=UPLOAD.resolve()
    else:raise ValueError('Invalid image path')
    if not p.is_relative_to(base) or not p.is_file():raise ValueError('Image not found')
    return p

def validate(payload):
    day=int(payload.get('day',1)); record=BYDAY.get(day)
    if not record:raise ValueError('Unknown temple')
    lang=payload.get('lang','en');
    if lang not in ('en','te'):raise ValueError('Unsupported language')
    length=int(payload.get('sectionSeconds',5));
    if length not in (5,7,10,12,15):raise ValueError('Unsupported duration')
    content=record[lang]; hook=str(payload.get('hook',content['hook'])).strip(); sections=payload.get('sections',content['sections'])
    if not isinstance(sections,list) or len(sections)!=3:raise ValueError('Three sections required')
    sections=[str(x).strip() for x in sections]
    if not hook or len(hook)>350 or any(not x or len(x)>1600 for x in sections):raise ValueError('Enter the opening hook and all three sections.')
    image=payload.get('image',record['image']);safe_image(image)
    focus=max(0,min(1,float(payload.get('focus',.5)))); typ='illustration' if image.startswith('/assets/representations/') else ('custom' if image.startswith('/uploads/') else 'photo')
    return {'day':day,'lang':lang,'hook':hook,'sections':sections,'image':image,'imageType':typ,'focus':focus,'sectionSeconds':length,'name':content['name']}

def opening_background(state):
    im=ImageOps.exif_transpose(Image.open(safe_image(state['image']))).convert('RGB')
    cover=ImageOps.fit(im,(W,H-HEADER),Image.Resampling.LANCZOS,centering=(.5,state['focus']))
    base=Image.new('RGB',(W,H),CREAM);base.paste(cover,(0,HEADER))
    if state['imageType']=='illustration':
        d=ImageDraw.Draw(base); f=font('en',25); msg='Representative illustration • Not a temple photograph'; tw=math.ceil(f.getlength(msg));d.rounded_rectangle((32,H-78,tw+70,H-23),radius=12,fill='#243632');d.text((51,H-65),msg,font=f,fill='#fff6e8')
    return base

def make_scenes(state):
    return [(opening_background(state),line_layout(state['hook'],state['lang'],'hook',3),3)]+[(TEMPLATE,line_layout(s,state['lang'],'body',state['sectionSeconds']),state['sectionSeconds']) for s in state['sections']]

def uri(im,fmt='PNG'):
    b=io.BytesIO();im.save(b,format=fmt,**({'quality':90} if fmt=='JPEG' else {}));return 'data:image/'+('jpeg' if fmt=='JPEG' else 'png')+';base64,'+base64.b64encode(b.getvalue()).decode('ascii')

def layout_payload(state):
    scenes=make_scenes(state); out=[]
    for i,(bg,layers,duration) in enumerate(scenes):
        out.append({'duration':duration,'background':uri(bg,'JPEG') if i==0 else '/assets/content-template.png','layers':[{'x':a['x'],'y':a['y'],'start':a['start'],'src':uri(a['im']),'w':a['im'].width,'h':a['im'].height} for a in layers]})
    return {'scenes':out,'duration':3+3*state['sectionSeconds']}

def progress_at(t,start):return max(0.,min(1.,(t-start+.06)/.32))
def frame_for(bg,layers,t):
    im=bg.copy()
    for a in layers:
        p=progress_at(t,a['start'])
        if p<=0:continue
        layer=a['im']; y=a['y']+round(30*(1-p)**2)
        mask=layer.getchannel('A');
        if p<1:mask=mask.point(lambda v:round(v*p))
        im.paste(layer,(a['x'],y),mask)
    return im

def job_update(jid,**kwargs):
    with LOCK:JOBS[jid].update(kwargs)

def encode(jid,state):
    target=EXPORT/(jid+'.mp4'); proc=None
    try:
        with RENDER_SLOTS:
            if JOBS[jid].get('cancel'):job_update(jid,status='cancelled');return
            job_update(jid,status='rendering',progress=1); scenes=make_scenes(state);total=sum(x[2] for x in scenes)*FPS; done=0
            ffmpeg=os.getenv('FFMPEG','ffmpeg'); proc=subprocess.Popen([ffmpeg,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-r','30','-threads','3','-movflags','+faststart',str(target)],stdin=subprocess.PIPE,stderr=subprocess.PIPE)
            for bg,layers,dur in scenes:
                lastkey=None; raw=None
                for i in range(dur*FPS):
                    if JOBS[jid].get('cancel'):raise InterruptedError('Export cancelled')
                    t=i/FPS; key=tuple(round(progress_at(t,a['start']),3) for a in layers)
                    if key!=lastkey:raw=frame_for(bg,layers,t).tobytes();lastkey=key
                    proc.stdin.write(raw);done+=1
                    if done%FPS==0:job_update(jid,progress=min(97,round(done/total*97)))
            proc.stdin.close();err=proc.stderr.read().decode('utf-8','replace');ret=proc.wait()
            if ret:raise RuntimeError(err or 'FFmpeg failed')
            job_update(jid,status='done',progress=100,url='/download/'+jid,bytes=target.stat().st_size)
    except Exception as exc:
        if proc and proc.poll() is None:proc.kill();proc.wait()
        target.unlink(missing_ok=True);job_update(jid,status='cancelled' if isinstance(exc,InterruptedError) else 'error',error=str(exc))

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(STATIC),**kw)
    def log_message(self,fmt,*args):
        if not self.path.startswith(('/assets/','/api/job/')):super().log_message(fmt,*args)
    def json_response(self,value,status=200):
        b=json.dumps(value,ensure_ascii=False).encode();self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(b)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(b)
    def read_json(self):
        n=int(self.headers.get('Content-Length','0'))
        if n>100000:raise ValueError('Request too large')
        return json.loads(self.rfile.read(n))
    def do_GET(self):
        path=urlsplit(self.path).path
        try:
            if path=='/api/temples':return self.json_response(DATA)
            if path=='/api/health':return self.json_response({'ffmpeg':bool(shutil.which(os.getenv('FFMPEG','ffmpeg'))),'teluguShaping':features.check('raqm'),'fonts':{x:Path(font_path(x)).name for x in ('en','te')}})
            if path.startswith('/api/job/'):
                jid=path.split('/')[-1];j=JOBS.get(jid);return self.json_response({k:v for k,v in j.items() if k!='cancel'} if j else {'error':'Export not found'},200 if j else 404)
            if path.startswith('/uploads/'):
                p=safe_image(unquote(path));return self.send_file(p,'image/jpeg')
            if path.startswith('/download/'):
                jid=path.split('/')[-1];j=JOBS.get(jid)
                if not j or j['status']!='done':return self.json_response({'error':'Video not ready'},404)
                return self.send_file(EXPORT/(jid+'.mp4'),'video/mp4',j['filename'])
            return super().do_GET()
        except (BrokenPipeError,ConnectionResetError):pass
        except Exception as exc:self.json_response({'error':str(exc)},400)
    def send_file(self,p,typ,name=None):
        self.send_response(200);self.send_header('Content-Type',typ);self.send_header('Content-Length',str(p.stat().st_size));
        if name:self.send_header('Content-Disposition',f'attachment; filename="{name}"')
        self.end_headers()
        with p.open('rb') as f:shutil.copyfileobj(f,self.wfile)
    def do_POST(self):
        path=urlsplit(self.path).path
        try:
            if path=='/api/layout':return self.json_response(layout_payload(validate(self.read_json())))
            if path=='/api/upload':
                n=int(self.headers.get('Content-Length','0'))
                if n<1 or n>15*1024*1024:raise ValueError('Choose an image smaller than 15 MB.')
                im=ImageOps.exif_transpose(Image.open(io.BytesIO(self.rfile.read(n)))).convert('RGB');im.thumbnail((2200,2400),Image.Resampling.LANCZOS);name=uuid.uuid4().hex+'.jpg';im.save(UPLOAD/name,quality=93);return self.json_response({'image':'/uploads/'+name})
            if path=='/api/export':
                if not shutil.which(os.getenv('FFMPEG','ffmpeg')):raise ValueError('FFmpeg is not installed or not in PATH.')
                state=validate(self.read_json()); jid=uuid.uuid4().hex; slug=re.sub(r'[^a-zA-Z0-9]+','-',BYDAY[state['day']]['en']['name']).strip('-'); filename=f'Day-{state["day"]:02}-{slug}-{state["lang"].upper()}-{3+3*state["sectionSeconds"]}s.mp4';job_update_new={'status':'queued','progress':0,'filename':filename,'cancel':False}
                with LOCK:JOBS[jid]=job_update_new
                threading.Thread(target=encode,args=(jid,state),daemon=True).start();return self.json_response({'id':jid,**job_update_new},202)
            if path.startswith('/api/cancel/'):
                jid=path.split('/')[-1]
                if jid not in JOBS:return self.json_response({'error':'Export not found'},404)
                job_update(jid,cancel=True);return self.json_response({'ok':True})
            self.json_response({'error':'Not found'},404)
        except (BrokenPipeError,ConnectionResetError):pass
        except Exception as exc:self.json_response({'error':str(exc)},400)

if __name__=='__main__':
    host=os.getenv('HOST','127.0.0.1');port=int(os.getenv('PORT','8080')); print(f'Temple Shorts Studio: http://{host}:{port}',flush=True);ThreadingHTTPServer((host,port),Handler).serve_forever()
