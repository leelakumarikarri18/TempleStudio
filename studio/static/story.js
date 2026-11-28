/* Split a single continuous narration into three ordered scenes. No rewriting. */
(function(root){
  const words = text => String(text).trim().match(/\S+/gu)||[];
  const count = text => words(text).length;
  function splitStory(text){
    text=String(text||'').trim();
    const tokens=[...text.matchAll(/\S+/gu)];
    const n=tokens.length;
    if(n<3)return [tokens[0]?.[0]||'',tokens[1]?.[0]||'',''];
    // Prefer sentence endings, ignoring common abbreviation/initial periods.
    const boundaries=[];
    for(let i=1;i<n;i++){
      const word=tokens[i-1][0];
      if(/[.!?।…][”’"')\]]*$/u.test(word)&&! /^(?:[A-Za-z]|Mr|Mrs|Ms|Dr|St|Sr|Jr|vs|etc|e\.g|i\.e|క్రీ\.శ|క్రీ\.పూ)\.$/iu.test(word))boundaries.push(i);
    }
    let best=null,score=Infinity;
    for(const a of boundaries)for(const b of boundaries){
      if(b<=a)continue;
      const lengths=[a,b-a,n-b];
      if(Math.min(...lengths)<n*.16||Math.max(...lengths)>n*.5)continue;
      const cost=lengths.reduce((sum,x)=>sum+(x-n/3)**2,0);
      if(cost<score){score=cost;best=[a,b]}
    }
    // Fallback for very long sentences or user edits without punctuation.
    if(!best)best=[Math.round(n/3),Math.round(2*n/3)];
    const a=tokens[best[0]].index,b=tokens[best[1]].index;
    return [text.slice(0,a).trim(),text.slice(a,b).trim(),text.slice(b).trim()];
  }
  function sceneDurations(hook,parts,lang,sec){
    if(sec!=='auto')return [3,...parts.map(()=>Number(sec))];
    const rate=lang==='te'?125:180;
    return [Math.max(3,Math.ceil(count(hook)*60/rate+1)),...parts.map(p=>Math.max(5,Math.ceil(count(p)*60/rate+2)))];
  }
  const api={splitStory,sceneDurations,count};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TempleStory=api;
})(typeof globalThis!=='undefined'?globalThis:this);
