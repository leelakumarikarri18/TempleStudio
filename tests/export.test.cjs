const assert=require('node:assert/strict');
const fs=require('node:fs');
const Export=require('../studio/static/export.js');

assert.deepEqual(Export.MIME_TYPES,[
  'video/mp4;codecs="avc1.424028,mp4a.40.2"',
  'video/mp4',
  'video/webm;codecs="vp9,opus"',
  'video/webm;codecs="vp8,opus"',
  'video/webm'
]);

class RecorderMock{
  static supported=new Set();
  static rejected=new Set();
  static isTypeSupported(type){return this.supported.has(type)}
  constructor(stream,options){
    if(RecorderMock.rejected.has(options.mimeType))throw new Error('codec rejected');
    this.stream=stream;
    this.options=options;
    this.mimeType=options.mimeType;
    this.startArgs=null;
  }
  start(...args){this.startArgs=args}
}

RecorderMock.supported=new Set(Export.MIME_TYPES);
RecorderMock.rejected=new Set([Export.MIME_TYPES[0]]);
const selected=Export.createRecorder({id:'stream'},RecorderMock,{videoBitsPerSecond:6000000,audioBitsPerSecond:128000});
assert.equal(selected.requestedType,'video/mp4');
assert.equal(selected.recorder.options.audioBitsPerSecond,128000);
Export.startRecorder(selected.recorder);
assert.deepEqual(selected.recorder.startArgs,[],'recorder must start without fragmented timeslices');
assert.equal(Export.actualType({mimeType:'video/mp4'},'video/webm'),'video/mp4');
assert.equal(Export.actualType({mimeType:''},'video/webm'),'video/webm');
assert.equal(Export.extensionFor('video/mp4;codecs="avc1.424028,mp4a.40.2"'),'mp4');
assert.equal(Export.extensionFor('video/webm;codecs="vp9,opus"'),'webm');

function track(kind){return {kind,stops:0,stop(){this.stops++}}}
const videoTrack=track('video'),audioTrack=track('audio');
const videoStream={getVideoTracks:()=>[videoTrack],getTracks:()=>[videoTrack]};
const destinationStream={getAudioTracks:()=>[audioTrack],getTracks:()=>[audioTrack]};
const calls={fps:0,resume:0,close:0,start:0,stop:0,sourceToGain:0,gainToDestination:0};
class AudioContextMock{
  constructor(options){assert.equal(options.sampleRate,48000);this.state='suspended'}
  createMediaStreamDestination(){return {stream:destinationStream}}
  createGain(){return {gain:{value:1},connect(node){calls.gainToDestination++;return node}}}
  createOscillator(){return {connect(node){calls.sourceToGain++;return node},start(){calls.start++},stop(){calls.stop++}}}
  async resume(){calls.resume++}
  close(){calls.close++;return Promise.resolve()}
}
class MediaStreamMock{
  constructor(tracks){this.tracks=tracks}
  getTracks(){return this.tracks}
  getVideoTracks(){return this.tracks.filter(x=>x.kind==='video')}
  getAudioTracks(){return this.tracks.filter(x=>x.kind==='audio')}
}

(async()=>{
  const canvas={captureStream(fps){calls.fps=fps;return videoStream}};
  const made=await Export.createStream(canvas,{AudioContext:AudioContextMock,MediaStream:MediaStreamMock});
  assert.equal(calls.fps,30);
  assert.equal(calls.resume,1);
  assert.equal(calls.start,1);
  assert.equal(calls.sourceToGain,1);
  assert.equal(calls.gainToDestination,1);
  assert.deepEqual(made.stream.getVideoTracks(),[videoTrack]);
  assert.deepEqual(made.stream.getAudioTracks(),[audioTrack]);
  made.cleanup();
  made.cleanup();
  assert.equal(videoTrack.stops,1);
  assert.equal(audioTrack.stops,1);
  assert.equal(calls.stop,1);
  assert.equal(calls.close,1);
  await assert.rejects(()=>Export.createStream(canvas,{MediaStream:MediaStreamMock}),/audio track required for YouTube preview/);
  const html=fs.readFileSync(require.resolve('../studio/static/index.html'),'utf8');
  const app=fs.readFileSync(require.resolve('../studio/static/app.js'),'utf8');
  for(const id of ['exportPreview','shareVideo'])assert.match(html,new RegExp(`id="${id}"`));
  assert.ok(html.indexOf('/export.js')<html.indexOf('/app.js'),'export helpers must load before app.js');
  assert.match(app,/TempleExport\.startRecorder\(current\)/);
  assert.match(app,/navigator\.share\(\{files:\[exportFile\]/);
  console.log('YouTube-compatible export helpers passed.');
})().catch(error=>{console.error(error);process.exitCode=1});
