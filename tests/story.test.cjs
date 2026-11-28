const assert=require('node:assert/strict');
const {splitStory,sceneDurations}=require('../studio/static/story.js');
const data=require('../studio/data/temples.json');
const norm=s=>s.trim().replace(/\s+/gu,' ');
assert.equal(data.length,90);
for(const t of data)for(const l of ['en','te']){
  const {hook,story}=t[l];assert.ok(hook&&story);
  const parts=splitStory(story);assert.equal(parts.length,3);assert.ok(parts.every(Boolean));assert.equal(norm(parts.join(' ')),norm(story),`Day ${t.day} ${l}`);
  const times=sceneDurations(hook,parts,l,'auto');assert.equal(times.length,4);assert.ok(times.every(x=>x>=3));
  assert.deepEqual(sceneDurations(hook,parts,l,5),[3,5,5,5]);
}
for(const text of ['','one','one two','one two three','A sentence. Another sentence. Last sentence.','క్రీ.శ. 966లో దానం చేశారు. ఇది ఆలయం. ఇది చరిత్ర.'])assert.equal(norm(splitStory(text).join(' ')),norm(text));
console.log('180 story variants and short-edit cases passed.');
