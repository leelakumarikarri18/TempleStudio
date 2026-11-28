(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TempleExport=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const MIME_TYPES=[
    'video/mp4;codecs="avc1.424028,mp4a.40.2"',
    'video/mp4',
    'video/webm;codecs="vp9,opus"',
    'video/webm;codecs="vp8,opus"',
    'video/webm'
  ];

  function supportedTypes(MediaRecorderClass){
    return MIME_TYPES.filter(type=>MediaRecorderClass.isTypeSupported(type));
  }

  function createRecorder(stream,MediaRecorderClass,options={}){
    for(const type of supportedTypes(MediaRecorderClass)){
      try{
        return {recorder:new MediaRecorderClass(stream,{...options,mimeType:type}),requestedType:type};
      }catch{}
    }
    throw new Error('This browser cannot create a YouTube-compatible video recorder. Use a current Chrome or Edge browser.');
  }

  async function createStream(canvas,environment){
    const AudioContextClass=environment.AudioContext||environment.webkitAudioContext;
    if(!AudioContextClass||!environment.MediaStream)throw new Error('This browser cannot create the audio track required for YouTube preview. Use a current Chrome or Edge browser.');
    const videoStream=canvas.captureStream(30),audioContext=new AudioContextClass({sampleRate:48000}),destination=audioContext.createMediaStreamDestination(),gain=audioContext.createGain(),source=audioContext.createOscillator();
    gain.gain.value=0;
    source.connect(gain);
    gain.connect(destination);
    source.start();
    let cleaned=false;
    const cleanup=()=>{
      if(cleaned)return;
      cleaned=true;
      try{source.stop();}catch{}
      const tracks=new Set([...(stream?.getTracks()||[]),...videoStream.getTracks(),...destination.stream.getTracks()]);
      tracks.forEach(track=>track.stop());
      try{const closing=audioContext.close();if(closing?.catch)closing.catch(()=>{});}catch{}
    };
    let stream;
    try{
      if(audioContext.state==='suspended')await audioContext.resume();
      stream=new environment.MediaStream([...videoStream.getVideoTracks(),...destination.stream.getAudioTracks()]);
      return {stream,cleanup};
    }catch(error){
      cleanup();
      throw error;
    }
  }

  function actualType(recorder,requestedType){return recorder.mimeType||requestedType}
  function extensionFor(type){return String(type).toLowerCase().includes('mp4')?'mp4':'webm'}
  function startRecorder(recorder){recorder.start()}

  return {MIME_TYPES,supportedTypes,createRecorder,createStream,actualType,extensionFor,startRecorder};
});
