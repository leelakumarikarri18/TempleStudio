const assert=require('node:assert/strict');
const {generate,topics}=require('../studio/static/metadata.js');
const temples=require('../studio/data/temples.json');
assert.equal(topics.length,90);
const titles=new Set(),descriptions=new Set();
for(const t of temples)for(const l of ['en','te']){
 const m=generate(t,l);assert.ok(m.title.length>0&&m.title.length<=100,`Day ${t.day} ${l} title`);assert.ok(m.description.length<=5000);assert.ok(m.description.includes(t[l].name));assert.ok(m.description.includes(t[l].hook));assert.ok(m.description.includes('#Shorts'));assert.ok(m.tags.includes(t.en.name)&&m.tags.includes(t.te.name));assert.ok(m.tagLength<=500);assert.ok(m.tags.includes(topics[t.day-1][l==='en'?0:1][0]));assert.equal(titles.has(m.title),false);assert.equal(descriptions.has(m.description),false);titles.add(m.title);descriptions.add(m.description);assert.equal(m.description.includes(l==='en'?'representative illustration':'ప్రతీకాత్మక చిత్రం'),t.imageType==='illustration');
}
const edited=generate(temples[0],'en',{hook:'A new temple question?',story:'A new test story.',image:'data:image/jpeg;base64,AA'});assert.ok(edited.title.includes('A new temple question?'));assert.ok(edited.description.includes('A new test story.'));assert.ok(!edited.description.includes('representative illustration'));assert.ok(!edited.tags.includes('Adisesha'));console.log('180 unique title/description/tag sets, limits, custom edits, and illustration disclosures passed.');
