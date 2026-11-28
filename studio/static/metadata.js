/* Topic-specific search phrases derived from the supplied temple stories.
 * Pure, local generation; no external APIs or keyword-volume claims. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TempleMetadata=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const topics=`Seven Hills, Adisesha, Venkatadri|ఏడు కొండలు, ఆదిశేషుడు, వేంకటాద్రి
Hanging pillar, Vijayanagara architecture|వేలాడే స్తంభం, విజయనగర శిల్పకళ
Growing Ganesha idol, Vinayaka temple|పెరుగుతున్న వినాయక విగ్రహం, వినాయక ఆలయం
Spider snake elephant legend, Vayu Lingam|సాలెపురుగు పాము ఏనుగు కథ, వాయులింగం
Chandanotsavam, Nijaroopa Darshan|చందనోత్సవం, నిజరూప దర్శనం
Jyotirlinga and Shakti Peetha, Bhramaramba|జ్యోతిర్లింగం శక్తిపీఠం, భ్రమరాంబ
Nine Narasimha shrines, Nava Narasimha|నవ నరసింహ క్షేత్రాలు, నవ నరసింహ స్వామి
Sacred yantra, Satyanarayana Swamy|పవిత్ర యంత్రం, సత్యనారాయణ స్వామి
Sun rays on the deity, Surya temple|సూర్యకిరణాలు, సూర్య దేవాలయం
Vishnu's Kurma avatar, tortoise temple|కూర్మావతారం, తాబేలు రూపం
Three Shiva temples, temple architecture|మూడు శివాలయాలు, ఆలయ శిల్పకళ
Growing Nandi tradition, Nandi statue|పెరుగుతున్న నంది కథ, నంది విగ్రహం
Sacred spring and temple tanks, Pushkarini|పవిత్ర ఊట, పుష్కరిణి
Two-storey Shiva sanctum, Pancharama|రెండు అంతస్తుల గర్భగుడి, పంచారామం
Ancient name and Kumararama history, Pancharama|పూర్వపు పేరు, కుమారారామం చరిత్ర
Moon phases and Shiva linga, Pancharama|చంద్రుని కళలు, శివలింగం
Kashi pilgrimage tradition, Pancharama|కాశీ యాత్ర, పంచారామం
Five Pancharama temples, Amaravati Shiva temple|పంచారామ క్షేత్రాలు, అమరావతి శివాలయం
Panakam offering, Panakala Lakshmi Narasimha|పానకం నైవేద్యం, పానకాల నరసింహ స్వామి
Indrakeeladri legend, Vijayawada Durga temple|ఇంద్రకీలాద్రి స్థలపురాణం, విజయవాడ దుర్గమ్మ
Two Venkateswara images, Chinna Tirupati|రెండు వేంకటేశ్వర విగ్రహాలు, చిన్న తిరుపతి
Pada Gaya ancestral rites, Pithapuram pilgrimage|పాదగయ పితృకర్మలు, పిఠాపురం క్షేత్రం
Rama Sita Lakshmana in one stone, Kodandarama|ఒకే శిలలో రామ సీత లక్ష్మణులు, కోదండరాముడు
Hampi comparison, temple heritage|హంపితో పోలిక, ఆలయ వారసత్వం
Ancient Shiva linga, Gudimallam sculpture|ప్రాచీన శివలింగం, గుడిమల్లం శిల్పం
Matsya avatar and Surya Puja, sun rays|మత్స్యావతారం, సూర్యపూజ
Reclining Shiva and Parvati, temple legend|పార్వతి ఒడిలో శివుడు, స్థలపురాణం
Tirupati town history, Govindaraja Swamy|తిరుపతి పట్టణ చరిత్ర, గోవిందరాజ స్వామి
Coastal sand and Shiva temple, archaeology|సముద్రతీర ఇసుక, శివాలయ చరిత్ర
Sirimanotsavam, Pydithalli festival|సిరిమానోత్సవం, పైడితల్లమ్మ జాతర
Lotus and Padmavathi, Alamelu Mangamma|కమలం పద్మావతి అమ్మవారు, అలమేలు మంగ
Annamacharya family, Kalyana Venkateswara|అన్నమాచార్యుల కుటుంబం, కల్యాణ వేంకటేశ్వరుడు
Sacred waterfall, Kapileswara temple|పవిత్ర జలపాతం, కపిలేశ్వర ఆలయం
Royal symbols and temple history, Kodandarama|రాజచిహ్నాలు, కోదండరామాలయ చరిత్ర
Sacred footwear, Tirumala footpath|స్వామివారి పాదాలు, తిరుమల మెట్ల మార్గం
Sundararaja Vishnu shrine, Tiruchanur|సుందరరాజ స్వామి, తిరుచానూరు విష్ణు ఆలయం
Raised hand and Abhaya gesture, Venkateswara|అభయ హస్తం, ప్రసన్న వేంకటేశ్వర స్వామి
Gokulashtami, Venugopala Swamy|గోకులాష్టమి, వేణుగోపాల స్వామి
Karya Siddhi Vinayaka, prayer before work|కార్యసిద్ధి వినాయకుడు, పనులకు ముందు పూజ
Sri Chakra temple, Sahasrakshi|శ్రీచక్ర ఆలయం, సహస్రాక్షి
Festival before Ugadi, Nookambika Jatara|ఉగాది ముందు జాతర, నూకాంబిక అమ్మవారు
Return of the deity, Kanaka Mahalakshmi legend|అమ్మవారి పునరాగమనం, కనకమహాలక్ష్మి కథ
Battle of 1794, Padmanabham history|1794 యుద్ధం, పద్మనాభం చరిత్ర
Sage Vyasa, Siddhi Vinayaka legend|వ్యాస మహర్షి, సిద్ధి వినాయకుడు
Godavari river meets the sea, Narasimha shrine|గోదావరి సముద్ర సంగమం, నరసింహ స్వామి
Coconut seller's devotion, Bala Balaji|కొబ్బరికాయల వ్యాపారి భక్తి, బాల బాలాజీ
Daily divine wedding, Nitya Kalyanam|ప్రతిరోజూ కల్యాణం, నిత్య కల్యాణం
Seven halls and weekdays, temple mandapams|ఏడు మండపాలు, వారంలోని రోజులు
Vishnu and Mohini idol, Jaganmohini Kesava|విష్ణు మోహిని విగ్రహం, జగన్మోహిని కేశవుడు
Pallalamma image discovery, village goddess|పళ్లాలమ్మ విగ్రహం, గ్రామదేవత కథ
Godavari holy bath, Markandeya temple|గోదావరి పుణ్యస్నానం, మార్కండేయ స్వామి
Poet Srinatha, sacred hill|కవి శ్రీనాథుడు, పవిత్ర పర్వతం
Vehicle blessings, Talupulamma Lova|వాహన పూజలు, తలుపులమ్మ లోవ
Tholi Tirupati name, Srungara Vallabha|తొలి తిరుపతి పేరు, శృంగార వల్లభ స్వామి
Gopuram sculptures, Suryanarayana Swamy|గోపుర శిల్పాలు, సూర్యనారాయణ స్వామి
1910 floods, Mavullamma shrine history|1910 వరదలు, మావుళ్లమ్మ ఆలయ చరిత్ర
Two Shiva shrines and annual ceremony, Juttiga|రెండు శివాలయాల ఉత్సవం, జుత్తిగ
Shells and conches, Rameswara linga|నత్తలు శంఖాలు, రామేశ్వర లింగం
Vasavi's resolve, Vasavi Kanyaka Parameswari|వాసవీ సంకల్పం, వాసవీ కన్యకాపరమేశ్వరి
Godavari island hill, Veerabhadra Swamy|గోదావరి మధ్య కొండ, వీరభద్ర స్వామి
Maddi tree and Hanuman, Maddi Anjaneya|మద్ది చెట్టు, మద్ది ఆంజనేయ స్వామి
Telugu classical music, Venugopala shrine|తెలుగు శాస్త్రీయ సంగీతం, వేణుగోపాల స్వామి
Subrahmanya in linga form, Mopidevi temple|లింగరూప సుబ్రహ్మణ్యుడు, మోపిదేవి ఆలయం
Krishnadevaraya's dream, Amuktamalyada|శ్రీకృష్ణదేవరాయల స్వప్నం, ఆముక్తమాల్యద
Kartik Purnima sea bath, Panduranga Swamy|కార్తీక పౌర్ణమి సముద్రస్నానం, పాండురంగ స్వామి
Meditating Narasimha, Yoga Narasimha|ధ్యాన రూప నరసింహుడు, యోగ నరసింహ స్వామి
Temple archaeology, Bhavanarayana heritage|ఆలయ పురావస్తు చరిత్ర, భావనారాయణ స్వామి
Garuda pillar, temple antiquity|గరుడ స్తంభం, ఆలయ ప్రాచీనత
Full-moon light and rock-cut shrine, Shiva caves|పౌర్ణమి చంద్రకాంతి, శివ గుహాలయాలు
Hilltop Shiva and Bala Tripurasundari|కొండపై శివాలయం, బాలాత్రిపురసుందరి
Ranganatha temple gateway, Talpagiri gopuram|రంగనాథ ఆలయ గోపురం, తల్పగిరి
Adi Shankaracharya and Sri Chakra, Kamakshi|ఆదిశంకరాచార్యులు శ్రీచక్రం, కామాక్షి అమ్మవారు
Seven sages and sacred tanks, Saptarishi|సప్తర్షులు, పవిత్ర కొలనులు
Natural rock and Narasimha, Penusila|సహజ శిలారూపం, పెనుశిల నరసింహుడు
Nelli tree, Moolastaneswara legend|నెల్లి చెట్టు, మూలస్థానేశ్వర స్థలపురాణం
Sacred gateway to Tirumala, Lakshmi Venkateswara|తిరుమలకు పవిత్ర గడప, లక్ష్మీ వేంకటేశ్వరుడు
Rama and Hanuman rock image, Gandi legend|రాముడు ఆంజనేయ శిలారూపం, గండి స్థలపురాణం
Two divine images, Chowdeswari legend|రెండు దివ్య రూపాలు, చౌడేశ్వరి స్థలపురాణం
Aksharabhyasam, Saraswati temple|అక్షరాభ్యాసం, సరస్వతి ఆలయం
Submerged temple reappears, Sangameswara|నీటిలో మునిగే ఆలయం, సంగమేశ్వర స్వామి
Ruler's dream, Chennakesava temple legend|రాజు స్వప్నం, చెన్నకేశవ స్థలపురాణం
Stone carvings, Chintala Venkataramana|రాతి శిల్పాలు, చింతల వేంకటరమణ స్వామి
Natural spring and Shiva linga, Bugga Ramalingeswara|సహజ ఊట శివలింగం, బుగ్గ రామలింగేశ్వరుడు
Perennial spring and reclining Vishnu|నిరంతర ఊట, శయన రంగనాథ స్వామి
Telugu Kannada inscriptions, Chennakesava history|తెలుగు కన్నడ శాసనాలు, చెన్నకేశవ చరిత్ర
Ceremonial hall, Kalyana Mandapam|కల్యాణ మండపం, ఆలయ శిల్పకళ
Bilingual inscription, Krishnadevaraya reign|ద్విభాషా శాసనం, శ్రీకృష్ణదేవరాయల కాలం
107-line stone inscription, temple history|107 పంక్తుల శాసనం, ఆలయ చరిత్ర
Hindu Buddhist Jain heritage, Ramatheertham hills|హిందూ బౌద్ధ జైన వారసత్వం, రామతీర్థం కొండలు
Rama bow and arrow design, Ramanarayanam|రాముడి ధనుస్సు బాణం, రామనారాయణం నిర్మాణం`.split('\n').map(s=>s.split('|').map(v=>v.split(', ')));
const clean=s=>String(s??'').replace(/\s+/gu,' ').replace(/[<>]/g,'').trim();
const compact=s=>clean(s).replace(/[^\p{L}\p{M}\p{N}]/gu,'');
const unique=arr=>[...new Map(arr.filter(Boolean).map(s=>[s.toLocaleLowerCase(),s])).values()];
function excerpt(story){const text=clean(story);if(!text)return '';if(text.length<=460)return text;const sentences=text.split(/(?<=[.!?।])\s+(?=[\p{L}\p{N}])/u);let out='';for(const s of sentences){if(out&&out.length+s.length+1>460)break;out+=(out?' ':'')+s;if(out.length>=300)break;}if(out.length<=550)return out;const words=text.split(' ');out='';for(const w of words){if(out.length+w.length+1>450)break;out+=(out?' ':'')+w;}return out+'…';}
function tagLength(tags){return tags.reduce((n,t)=>n+t.length+(t.includes(' ')?2:0),Math.max(0,tags.length-1));}
function generate(temple,lang,state={}){const te=lang==='te',local=temple[lang],name=clean(local.name),en=clean(temple.en.name),tel=clean(temple.te.name),region=clean(temple.region).replace(/\s*\(.*\)$/u,''),hook=clean(state.hook??local.hook),story=clean(state.story??local.story),custom=hook!==clean(local.hook)||story!==clean(local.story),[enTopics,teTopics]=topics[temple.day-1]||[[],[]],focus=te?teTopics:enTopics;
// Prefer the actual opening question; use a shorter temple-specific title for long hooks.
const firstName=name.startsWith('85 ')?name.split(' ').slice(0,2).join(' '):name.split(' ')[0], namedHook=hook&&!custom&&!hook.toLocaleLowerCase().includes(firstName.toLocaleLowerCase())?`${firstName}: ${hook}`:hook;
const titleCandidates=[namedHook&&`${namedHook} #Shorts`,namedHook,!custom&&focus[0]&&`${name}: ${focus[0]} #Shorts`,!custom&&focus[0]&&`${name}: ${focus[0]}`,hook&&`${hook} #Shorts`,hook,`${name} | ${te?'ఆలయ కథ':'Temple Story'} #Shorts`,name];
const title=titleCandidates.find(t=>t&&t.length<=100)||Array.from(name).slice(0,80).join('');
const hashtags=unique(['#Shorts','#'+compact(en),te?'#TeluguShorts':'#TempleHistory','#AndhraPradesh',te?'#భక్తి':'#IndianTemples']).filter(x=>x.length>1);
const intro=te?`${name} (${en}) — ${hook||'ఈ క్షేత్రం కథను తెలుసుకుందాం.'}`:`${name}, ${region}, Andhra Pradesh — ${hook||'Discover the story of this temple.'}`;
const teaser=excerpt(story);
const cta=te?'ఈ ఆలయ కథ మీకు నచ్చితే లైక్ చేయండి. మీరు దర్శించిన ఆలయం ఏదో కామెంట్ చేయండి. ఆంధ్రప్రదేశ్ ఆలయాల మరిన్ని కథల కోసం సబ్‌స్క్రైబ్ చేయండి.':'Enjoyed this temple story? Like the Short, tell us which temple you have visited in the comments, and subscribe for more stories from Andhra Pradesh’s temples.';
const illustration=temple.imageType==='illustration'&&!String(state.image??temple.image).startsWith('data:');
const disclosure=illustration?(te?'గమనిక: ప్రారంభ దృశ్యం ఆలయానికి సంబంధించిన ప్రతీకాత్మక చిత్రం; నిజమైన ఆలయ ఫోటో కాదు.':'Note: The opening artwork is a representative illustration, not a photograph of this temple.') : '';
const description=[intro,teaser,cta,disclosure,hashtags.join(' ')].filter(Boolean).join('\n\n');
const base=unique([name,en,tel,`${en} temple`,`${tel} ఆలయం`,...(!custom?[...focus,...(te?enTopics:teTopics)]:[]),`${region} temples`,'Andhra Pradesh temples',...(te?['తెలుగు ఆలయ కథలు','తెలుగు భక్తి షార్ట్స్','Telugu temple shorts']:['Indian temple history','Hindu temples','temple stories','devotional shorts']),'YouTube Shorts']);
const tags=[];for(const t of base){if(tagLength([...tags,t])<=500)tags.push(t);}return {title,description,tags:tags.join(', '),tagLength:tagLength(tags)};
}
return {generate,tagLength,topics};});
