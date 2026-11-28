(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TempleExport=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const MIME_TYPES=['video/mp4;codecs="avc1.424028"','video/mp4'];
  const MEDIABUNNY_URL='/vendor/mediabunny-1.66.5.min.js';
  const CONTAINERS=new Set(['moov','trak','mdia','minf','stbl','edts','mvex','dinf','udta','meta','ilst']);
  const FORBIDDEN_BOXES=new Set(['moof','mfra','mvex','trex','edts','elst']);
  let mediabunnyPromise=null;

  function supportedTypes(MediaRecorderClass){return MIME_TYPES.filter(type=>MediaRecorderClass.isTypeSupported(type))}

  function createRecorder(stream,MediaRecorderClass,options={}){
    for(const type of supportedTypes(MediaRecorderClass)){
      try{return {recorder:new MediaRecorderClass(stream,{...options,mimeType:type}),requestedType:type}}catch{}
    }
    throw new Error('This browser cannot create the MP4 recording required by YouTube. Use the latest Chrome or Edge.');
  }

  function createStream(canvas){
    const stream=canvas.captureStream(30);
    let cleaned=false;
    return {stream,cleanup(){if(cleaned)return;cleaned=true;stream.getTracks().forEach(track=>track.stop())}};
  }

  function loadMediabunny(environment){
    if(environment.Mediabunny)return Promise.resolve(environment.Mediabunny);
    if(mediabunnyPromise)return mediabunnyPromise;
    if(!environment.document)throw new Error('The MP4 finalizer could not be loaded.');
    mediabunnyPromise=new Promise((resolve,reject)=>{
      const script=environment.document.createElement('script');
      script.src=MEDIABUNNY_URL;
      script.async=true;
      script.onload=()=>environment.Mediabunny?resolve(environment.Mediabunny):reject(new Error('The MP4 finalizer did not initialize.'));
      script.onerror=()=>reject(new Error('The MP4 finalizer could not be loaded. Refresh the page and try again.'));
      environment.document.head.append(script);
    }).catch(error=>{mediabunnyPromise=null;throw error});
    return mediabunnyPromise;
  }

  function readType(bytes,offset){return String.fromCharCode(bytes[offset],bytes[offset+1],bytes[offset+2],bytes[offset+3])}
  function parseBoxes(buffer,start=0,end=buffer.byteLength,depth=0,result=[]){
    const view=new DataView(buffer),bytes=new Uint8Array(buffer);
    let offset=start;
    while(offset+8<=end){
      let size=view.getUint32(offset),header=8;
      const type=readType(bytes,offset+4);
      if(size===1){
        if(offset+16>end)throw new Error('The finalized MP4 has a damaged large box header.');
        const high=view.getUint32(offset+8),low=view.getUint32(offset+12);
        size=high*4294967296+low;header=16;
      }else if(size===0)size=end-offset;
      if(!Number.isSafeInteger(size)||size<header||offset+size>end)throw new Error('The finalized MP4 has invalid box sizes.');
      result.push({type,depth});
      if(CONTAINERS.has(type)){
        const childStart=offset+header+(type==='meta'?4:0);
        if(childStart<offset+size)parseBoxes(buffer,childStart,offset+size,depth+1,result);
      }
      offset+=size;
    }
    if(offset!==end&&end-offset>3)throw new Error('The finalized MP4 has trailing invalid data.');
    return result;
  }

  function containsAscii(buffer,text){
    const bytes=new Uint8Array(buffer),target=Array.from(text,character=>character.charCodeAt(0));
    outer:for(let i=0;i<=bytes.length-target.length;i++){for(let j=0;j<target.length;j++)if(bytes[i+j]!==target[j])continue outer;return true}
    return false;
  }

  function inspectMp4(buffer){
    const boxes=parseBoxes(buffer),top=boxes.filter(box=>box.depth===0).map(box=>box.type),ftyp=top.indexOf('ftyp'),moov=top.indexOf('moov'),mdat=top.indexOf('mdat'),forbidden=boxes.filter(box=>FORBIDDEN_BOXES.has(box.type)).map(box=>box.type);
    if(ftyp<0||moov<0||mdat<0||!(ftyp<moov&&moov<mdat))throw new Error('The video was not finalized as a fast-start MP4.');
    if(forbidden.length)throw new Error(`The video still contains unsupported MP4 metadata (${[...new Set(forbidden)].join(', ')}).`);
    if(!containsAscii(buffer,'avc1'))throw new Error('The finalized MP4 does not contain H.264 video.');
    return {topLevelBoxes:top,hasH264:true};
  }

  async function finalizeMp4(rawBlob,environment,options={}){
    const library=await loadMediabunny(environment),input=new library.Input({formats:library.ALL_FORMATS,source:new library.BlobSource(rawBlob)}),target=new library.BufferTarget(),output=new library.Output({format:new library.Mp4OutputFormat({fastStart:'in-memory'}),target});
    let conversion,abortHandler;
    try{
      conversion=await library.Conversion.init({input,output,tracks:'primary',audio:{discard:true},copy:{mode:'forced',shiftTolerance:Infinity},tags:{},showWarnings:false});
      if(!conversion.isValid)throw new Error('The browser recording could not be losslessly finalized for YouTube.');
      if(options.onProgress)conversion.onProgress=options.onProgress;
      if(options.signal){
        abortHandler=()=>{const cancellation=conversion.cancel();if(cancellation?.catch)cancellation.catch(()=>{})};
        if(options.signal.aborted)abortHandler();else options.signal.addEventListener('abort',abortHandler,{once:true});
      }
      await conversion.execute();
      if(!target.buffer)throw new Error('The MP4 finalizer produced no video data.');
      const structure=inspectMp4(target.buffer);
      return {blob:new Blob([target.buffer],{type:'video/mp4'}),structure};
    }finally{
      if(options.signal&&abortHandler)options.signal.removeEventListener('abort',abortHandler);
      input.dispose();
    }
  }

  function actualType(recorder,requestedType){return recorder.mimeType||requestedType}
  function startRecorder(recorder){recorder.start()}

  return {MIME_TYPES,MEDIABUNNY_URL,supportedTypes,createRecorder,createStream,loadMediabunny,inspectMp4,finalizeMp4,actualType,startRecorder};
});
