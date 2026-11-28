const assert=require('node:assert/strict');
const fs=require('node:fs');
const Export=require('../studio/static/export.js');

assert.deepEqual(Export.MIME_TYPES,['video/mp4;codecs="avc1.424028"','video/mp4']);

class RecorderMock{
  static supported=new Set();
  static rejected=new Set();
  static isTypeSupported(type){return this.supported.has(type)}
  constructor(stream,options){
    if(RecorderMock.rejected.has(options.mimeType))throw new Error('codec rejected');
    this.stream=stream;this.options=options;this.mimeType=options.mimeType;this.startArgs=null;
  }
  start(...args){this.startArgs=args}
}

RecorderMock.supported=new Set(Export.MIME_TYPES);
RecorderMock.rejected=new Set([Export.MIME_TYPES[0]]);
const selected=Export.createRecorder({id:'stream'},RecorderMock,{videoBitsPerSecond:6000000});
assert.equal(selected.requestedType,'video/mp4');
assert.equal(selected.recorder.options.videoBitsPerSecond,6000000);
Export.startRecorder(selected.recorder);
assert.deepEqual(selected.recorder.startArgs,[],'recorder must start without fragmented timeslices');
assert.equal(Export.actualType({mimeType:'video/mp4'},'video/webm'),'video/mp4');

const track={stops:0,stop(){this.stops++}},stream={getTracks:()=>[track]},canvas={captureStream(fps){assert.equal(fps,30);return stream}};
const prepared=Export.createStream(canvas);
assert.equal(prepared.stream,stream);
prepared.cleanup();prepared.cleanup();
assert.equal(track.stops,1);

function bytes(value){return typeof value==='string'?Buffer.from(value,'ascii'):Buffer.from(value)}
function box(type,...payloads){
  const payload=Buffer.concat(payloads.map(bytes)),result=Buffer.alloc(8+payload.length);
  result.writeUInt32BE(result.length,0);result.write(type,4,4,'ascii');payload.copy(result,8);return result;
}
function mp4({fragmented=false,editList=false}={}){
  const trak=box('trak',...(editList?[box('edts',box('elst'))]:[]),box('mdia',box('minf',box('stbl'))));
  const moov=box('moov',trak,...(fragmented?[box('mvex',box('trex'))]:[]));
  const parts=[box('ftyp','isomavc1'),moov,box('mdat','video')];
  if(fragmented)parts.splice(2,0,box('moof'));
  const buffer=Buffer.concat(parts);return buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength);
}

assert.deepEqual(Export.inspectMp4(mp4()).topLevelBoxes,['ftyp','moov','mdat']);
assert.throws(()=>Export.inspectMp4(mp4({fragmented:true})),/unsupported MP4 metadata/);
assert.throws(()=>Export.inspectMp4(mp4({editList:true})),/unsupported MP4 metadata/);

const calls={disposed:0,conversionOptions:null,formatOptions:null,executed:0};
const finalBuffer=mp4();
class InputMock{constructor(options){this.options=options}dispose(){calls.disposed++}}
class BlobSourceMock{constructor(blob){this.blob=blob}}
class BufferTargetMock{constructor(){this.buffer=finalBuffer}}
class Mp4OutputFormatMock{constructor(options){calls.formatOptions=options}}
class OutputMock{constructor(options){this.format=options.format;this.target=options.target}}
class ConversionMock{
  static async init(options){calls.conversionOptions=options;return new ConversionMock()}
  constructor(){this.isValid=true;this.onProgress=null}
  async execute(){calls.executed++;this.onProgress?.(1,1)}
  async cancel(){}
}
const library={ALL_FORMATS:['mp4'],Input:InputMock,BlobSource:BlobSourceMock,BufferTarget:BufferTargetMock,Mp4OutputFormat:Mp4OutputFormatMock,Output:OutputMock,Conversion:ConversionMock};

(async()=>{
  const result=await Export.finalizeMp4(new Blob(['raw'],{type:'video/mp4'}),{Mediabunny:library},{onProgress:()=>{}});
  assert.equal(result.blob.type,'video/mp4');
  assert.equal(calls.formatOptions.fastStart,'in-memory');
  assert.equal(calls.conversionOptions.copy.mode,'forced');
  assert.equal(calls.conversionOptions.copy.shiftTolerance,Infinity);
  assert.equal(calls.conversionOptions.audio.discard,true);
  assert.deepEqual(calls.conversionOptions.tags,{});
  assert.equal(calls.executed,1);
  assert.equal(calls.disposed,1);

  const html=fs.readFileSync(require.resolve('../studio/static/index.html'),'utf8');
  const app=fs.readFileSync(require.resolve('../studio/static/app.js'),'utf8');
  const vendor=fs.readFileSync(require.resolve('../studio/static/vendor/mediabunny-1.66.5.min.js'),'utf8');
  for(const id of ['exportPreview','shareVideo'])assert.match(html,new RegExp(`id="${id}"`));
  assert.ok(html.indexOf('/export.js')<html.indexOf('/app.js'),'export helpers must load before app.js');
  assert.match(vendor,/var Mediabunny=/);
  assert.match(app,/TempleExport\.finalizeMp4\(rawBlob/);
  assert.match(app,/navigator\.share\(\{files:\[exportFile\]/);

  const Mediabunny=require('../studio/static/vendor/mediabunny-1.66.5.min.js');
  const sample=fs.readFileSync(require.resolve('../samples/Day-01-Tirumala-English-24s.mp4'));
  const fragmentedInput=new Mediabunny.Input({formats:Mediabunny.ALL_FORMATS,source:new Mediabunny.BlobSource(new Blob([sample],{type:'video/mp4'}))});
  const fragmentedTarget=new Mediabunny.BufferTarget();
  const fragmentedOutput=new Mediabunny.Output({format:new Mediabunny.Mp4OutputFormat({fastStart:'fragmented'}),target:fragmentedTarget});
  const fragmentConversion=await Mediabunny.Conversion.init({input:fragmentedInput,output:fragmentedOutput,copy:{mode:'forced'},tags:{}});
  assert.equal(fragmentConversion.isValid,true);
  await fragmentConversion.execute();
  fragmentedInput.dispose();
  const fragmentedBytes=Buffer.from(fragmentedTarget.buffer);
  assert.equal(fragmentedBytes.includes(Buffer.from('moof')),true,'integration fixture must be fragmented MP4');

  const integrated=await Export.finalizeMp4(new Blob([fragmentedTarget.buffer],{type:'video/mp4'}),{Mediabunny});
  assert.deepEqual(integrated.structure.topLevelBoxes,['ftyp','moov','mdat']);
  assert.ok(integrated.blob.size>0,'real Mediabunny remux must produce MP4 data');
  const integratedBytes=Buffer.from(await integrated.blob.arrayBuffer());
  assert.equal(integratedBytes.includes(Buffer.from('moof')),false,'final MP4 must not be fragmented');
  assert.equal(integratedBytes.includes(Buffer.from('mp4a')),false,'synthetic audio must be removed before YouTube upload');
  console.log('Fast-start YouTube MP4 export helpers passed.');
})().catch(error=>{console.error(error);process.exitCode=1});
