/* Mise en Place: the daily page. Reads briefs/index.json and one edition,
   draws the opening, three lessons with their diagrams, news, the quiz with
   streak and review, and the glossary, toolkit, archive and progress sheets.
   Everything about the reader (streak, answers, review) is kept only in this
   phone's browser storage. Nothing is sent anywhere. */
(function(){
'use strict';
const el=(t,c,x)=>{const n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n};
const safe=u=>/^https:\/\/[^\s"'<>]+$/.test(u||'')?u:'#';
const link=(label,u)=>{const a=el('a',null,label);a.href=safe(u);a.target='_blank';a.rel='noopener noreferrer';return a};
const AREA={kitchen:['Kitchen','#ea5f36','#fce9e3','#ac4627'],drinks:['Drinks','#865d00','#eee8db','#865d00'],money:['Money','#009b37','#dbf1e3','#00792b'],opening:['Opening and legal','#258fec','#e0effc','#1b68ad'],brand:['Brand','#b31e65','#f4dfe9','#b31e65'],guests:['Guests and growth','#7647cd','#ece5f8','#7647cd']};
const NEWS=[['industry','UK industry'],['trends','Food and drink trends'],['finedining','Fine dining and chefs'],['openings','London openings']];
const PHASES=["Run today's floor better",'Master the craft','Design your own restaurant','Open, launch and grow','Capstones: your restaurant on paper'];
const HERO_INK={plate:['#20242a','#6b7280'],pour:['#2b2417','#7a6646'],macaron:['#2d2226','#8a6f78'],tower:['#2b2417','#7a6646'],pancake:['#1f2a33','#677585'],gelato:['#2d241f','#8a7262'],redwine:['#2a1f22','#806a6e'],tea:['#1f2a24','#5f6f66'],matcha:['#1f2a20','#667060'],benny:['#2a2318','#7d6f5a']};
const START=new Date(2026,10,8), TOTAL=221;
const ORD=['First','Second','Third'];

/* ---------- saved progress (this phone only) ---------- */
const KEY='mep-v1',DAYRE=/^\d{4}-\d{2}-\d{2}$/;
const fresh=()=>({days:{},areas:{},lessons:{},points:0,badges:{},review:[],prog:{},learned:{},sound:false,kimchi:{},charlee:{}});
let S=(()=>{try{const s=JSON.parse(localStorage.getItem(KEY));return s&&s.days?Object.assign(fresh(),s):fresh()}catch(e){return fresh()}})();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const LEVELS=[[0,'Commis'],[500,'Demi chef'],[2000,'Chef de partie'],[5000,'Sous chef'],[9000,'Head chef'],[14000,'Chef patron'],[20000,'Restaurateur']];
/* scoring: shared rules in scorecore.js, re-scored from the saved history every time */
const MODE='all',RANKS=LEVELS.map(l=>[l[1],l[0]]);
function rescoreAll(){if(!window.ScoreCore)return null;const R=ScoreCore.rescore(S.days,MODE);Object.keys(R.day).forEach(k=>{S.days[k].points=R.day[k].points});S.points=R.total+(S.bonus||0);return R}
if(!S.v2){S.v2=1;S.bonus=0;if(Object.keys(S.days).length)S.rescored=1}rescoreAll();save();
const level=p=>{let i=0;LEVELS.forEach((l,j)=>{if(p>=l[0])i=j});const nx=LEVELS[i+1];return{name:LEVELS[i][1],i,from:LEVELS[i][0],next:nx?nx[0]:null}};
const ds=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const parse=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return ds(d)};
const todayStr=()=>ds(new Date());
const REPEATS={'2026-11-10':1};/* must match course.json repeats; check.py asserts it */
const courseDay=s=>REPEATS[s]||Math.round((parse(s)-START)/864e5)+1-Object.keys(REPEATS).filter(r=>r<s).length;
const nice=s=>parse(s).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
const doneDays=()=>Object.keys(S.days).filter(k=>DAYRE.test(k)).sort();
function streak(){const set=new Set(doneDays());let d=todayStr();if(!set.has(d))d=addDays(d,-1);let n=0;while(set.has(d)){n++;d=addDays(d,-1)}return n}
const totalCorrect=()=>Object.values(S.areas).reduce((a,t)=>a+t[0],0);
const BADGES=[
 ['first','First service','Finish your first quiz',()=>doneDays().length>=1],
 ['perfect','Perfect plate','Score 5 out of 5',()=>Object.values(S.days).some(d=>d.total>=5&&d.score===d.total)],
 ['s3','3-day streak','Quiz three days running',()=>streak()>=3],
 ['s7','7-day streak','Quiz seven days running',()=>streak()>=7],
 ['s30','30-day streak','Quiz thirty days running',()=>streak()>=30],
 ['c100','100 correct','Get 100 answers right',()=>totalCorrect()>=100],
 ['back','Comeback','Clear a question you once got wrong',()=>!!S.cleared],
 ['p1','Floor ready','Finish the quizzes to day 73',()=>doneDays().some(d=>courseDay(d)>=73)]];
function award(){const got=[];BADGES.forEach(([id,n,d,t])=>{if(!S.badges[id]&&t()){S.badges[id]=todayStr();got.push(n)}});return got}

/* ---------- Kimchi (the kitten): a quiz reward and a daily hide-and-seek in one lesson ---------- */
const K=()=>window.KIMCHI||null;
/* which lesson he hides in: seeded by the date, never the first ticket, same all day */
/* Two cats hide each day: Kimchi in one lesson, Charlee in another. Any lesson can be a hiding place.
   With an older kimchi.js (no Charlee art) the page falls back to Kimchi alone. */
const CATS={kimchi:{name:'Kimchi',he:'He',key:'kimchi'},charlee:{name:'Charlee',he:'She',key:'charlee'}};
function palArt(b){const k=K();return k&&k.pal?k.pal(k.cameoFor(b.day)):null}
function hideAt(b){const n=(b.lessons||[]).length;if(n<2||!K())return null;let h=2166136261;for(const c of b.date){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0}
  if(!palArt(b))return{kimchi:1+h%(n-1),charlee:-1,pair:false};
  const k=h%n;return{kimchi:k,charlee:(k+1+(h>>>9)%(n-1))%n,pair:true}}
const catFound=(b,who)=>!!(S[who]&&S[who][b.date]);
const kimchiFound=b=>catFound(b,'kimchi');
function kimchiHint(b){const t=el('span','khint'),hs=hideAt(b),k=kimchiFound(b),c=catFound(b,'charlee');t.id='khint';
  t.textContent=!(hs&&hs.pair)?(k?'You found Kimchi today. He moves to a new hiding place tomorrow.':'Kimchi is hiding in one of today’s lessons. Can you find him?')
    :k&&c?'You found them both today. They pick new hiding places tomorrow.'
    :k?'You found Kimchi. Charlee is still hiding in another lesson.'
    :c?'You found Charlee. Kimchi is still hiding in another lesson.'
    :'Kimchi and Charlee are hiding in two of today’s lessons. Can you find them both?';return t}
function kimchiCameo(b,i,who){
  const cat=CATS[who||'kimchi'],other=CATS[cat.key==='kimchi'?'charlee':'kimchi'],hs=hideAt(b)||{};
  const box=el('div','kcam'),win=el('div','kwin'),lip=el('div','klip'),tx=el('div','ktx');box.setAttribute('aria-live','polite');
  const say=()=>{tx.textContent='';if(catFound(b,cat.key))tx.append(el('b',null,'You found '+cat.name+'!'),el('span',null,cat.he+' was hiding in lesson '+(i+1)+'. '+(!hs.pair?'Tomorrow he’ll pick a new spot.':catFound(b,other.key)?'That’s both of them today.':other.name+' is still hiding.')));else tx.append(el('b',null,'Psst…'),el('span',null,'someone is reading along with you.'))};
  say();win.append(lip);box.append(win,tx);let host=null;
  const io=new IntersectionObserver(es=>{if(!es.some(e=>e.isIntersecting))return;io.disconnect();box.classList.add('up');
    if(!host){host=el('div','kpeek');win.prepend(host);K().cameo(host,cat.key==='charlee'?palArt(b):K().cameoFor(b.day),112)}
    if(!catFound(b,cat.key)){S[cat.key]=S[cat.key]||{};S[cat.key][b.date]=Date.now();save();say();fizz(24);const h=document.getElementById('khint');if(h)h.replaceWith(kimchiHint(b))}},{threshold:.6});
  setTimeout(()=>io.observe(box),300);return box}
function kimchiReward(bd,b){
  if(!K())return;const sk=streak(),r=el('div','kreward'),stage=el('div','kstage'),ov=el('div','kov');
  const hs=hideAt(b),both=!!(hs&&hs.pair&&kimchiFound(b)&&catFound(b,'charlee')),who=both?'Kimchi and Charlee':'Kimchi';
  ov.append(el('b',null,sk>1?sk+'-day streak':'Day '+b.day+' done'),el('span',null,sk>1?who+(both?' are':' is')+' proud of you. Same time tomorrow?':who+(both?' approve':' approves')+'. Come back tomorrow to start a streak.'));
  r.append(stage,ov);bd.append(r);K().mount(stage,K().forDay(b.day));
  /* found them both: Charlee joins Kimchi, in a small window in the corner of his scene */
  if(both)try{const pal=el('div','kpal');stage.append(pal);K().cameo(pal,K().pal(K().forDay(b.day))||palArt(b),Math.max(84,Math.round((stage.clientWidth||340)*.27)),true)}catch(e){}}

/* ---------- score badge (top right), My scores, and the postcard to share (Kimchi and Charlee take turns) ---------- */
let CURB=null;
function myStats(){const t=todayStr(),R=rescoreAll()||{day:{},perfects:0,right:0,asked:0},L=level(S.points),pv=window.ScoreCore?ScoreCore.preview(S.days,t,MODE):{mult:1,dropped:0};
  return{t,R,L,pv,run:window.ScoreCore?ScoreCore.run(S.days,t,MODE):streak(),best:window.ScoreCore?ScoreCore.best(S.days,MODE):streak(),td:S.days[t]?R.day[t]:null,toTop:Math.min(1,S.points/LEVELS[LEVELS.length-1][0])}}
function paintBadge(bump){let bg=document.getElementById('scorebadge');if(!bg){bg=el('button','scorebadge');bg.id='scorebadge';bg.type='button';bg.append(el('span','ring'),el('span','pill'));bg.onclick=openScores;document.body.append(bg)}
  const m=myStats();bg.querySelector('.ring').style.setProperty('--p',Math.round(m.toTop*100)+'%');bg.querySelector('.ring').textContent=m.run;bg.querySelector('.pill').textContent=m.L.name;
  bg.setAttribute('aria-label','My scores: '+S.points+' points, '+m.L.name+', '+m.run+'-day streak');if(bump&&!matchMedia('(prefers-reduced-motion: reduce)').matches)bg.animate([{transform:'scale(1)'},{transform:'scale(1.15)'},{transform:'scale(1)'}],{duration:600})}
function openScores(){
  const{bd}=sheet('My scores'),m=myStats(),L=m.L,w=L.next?Math.round(100*(S.points-L.from)/(L.next-L.from)):100;
  const hero=el('div','sc-hero'),rg=el('div','ring big');rg.style.setProperty('--p',Math.round(m.toTop*100)+'%');rg.append(el('b',null,L.name));
  const tx=el('div');tx.append(el('div','sc-tot',S.points.toLocaleString('en-GB')),el('small',null,'points · level '+(L.i+1)+' of '+LEVELS.length),el('small',null,L.next?(L.next-S.points).toLocaleString('en-GB')+' to '+LEVELS[L.i+1][1]:'Top level reached'));hero.append(rg,tx);
  const br=el('div','bar');br.style.maxWidth='none';br.append(el('i'));br.firstChild.style.width=w+'%';bd.append(hero,br);
  if(S.rescored){bd.append(el('p','note','Scores now use the new rules: 10 a right answer, 20 for a perfect day, and a streak multiplier. Every day you have finished still counts.'));delete S.rescored;save()}
  const g=el('div','sc-stats'),st=(v,l)=>{const c=el('div');c.append(el('b',null,v),el('span',null,l));g.append(c)};
  st(m.run+' 🔥','Day streak');st('×'+m.pv.mult,m.td?'Multiplier':'Today’s ×');st(m.best+'','Best streak');st(m.R.perfects+'','Perfect days');st(m.R.asked?Math.round(100*m.R.right/m.R.asked)+'%':'–','Correct');st(Object.keys(m.R.day).length+'','Quizzes');bd.append(g);
  if(m.pv.dropped&&!m.td)bd.append(el('p','note','You missed a day, so today’s multiplier is one step lower. Finish today’s quiz to climb back.'));
  bd.append(el('h3',null,'The last four weeks'));const strip=el('div','sc-strip');const first=doneDays()[0]||m.t;for(let i=27;i>=0;i--){const d=addDays(m.t,-i),x=S.days[d],c=el('i',x?(m.R.day[d]&&m.R.day[d].perfect?'p':'d'):(i&&d>first?'m':''));if(!i)c.classList.add('t');c.title=nice(d)+(x?': '+x.score+'/'+x.total+', '+m.R.day[d].points+' points':'');strip.append(c)}bd.append(strip);
  const key=el('div','sc-key');[['d','done'],['p','perfect'],['m','missed'],['t','today']].forEach(([c,t])=>{const k=el('span');k.append(el('i',c),t);key.append(k)});bd.append(key);
  const sh=el('button','btn','Show my share card');sh.onclick=()=>{history.back();setTimeout(openShare,350)};const pr=el('button','btn alt','Full progress and badges');pr.onclick=()=>{history.back();setTimeout(openProgress,350)};bd.append(sh,pr)}
function openShare(){
  const{bd}=sheet('Share card');const lab=el('label','sc-name');const inp=el('input');inp.maxLength=16;inp.autocomplete='given-name';inp.placeholder='Your first name';inp.value=S.name||'';lab.append('First name on the card (kept on this phone only)',inp);
  const host=el('div');bd.append(lab,host,el('p','meta','Take a screenshot to share it. It shows your first name, level, score and streak, and nothing about where you work.'));
  /* the cat swaps each time the card opens: Kimchi first, then Charlee, and so on (kept on this phone only) */
  const who=S.pcCat==='kimchi'?'charlee':'kimchi';S.pcCat=who;save();
  const draw=()=>{host.textContent='';host.append(postcard(who))};inp.oninput=()=>{S.name=inp.value.trim().slice(0,16);save();const n=host.querySelector('.pc-name');if(n)n.textContent=S.name||'Mise en Place'};draw()}
function postcard(who){
  const m=myStats(),b=CURB,day=b?b.day:courseDay(m.t),td=m.td,c=el('div','pcard'),scene=el('div','pc-scene'),body=el('div','pc-body');
  /* Charlee's art is tall, so her card gives the picture more room. No Charlee art (older kimchi.js): Kimchi's card. */
  const art=K()?K().forDay(day):null,pal=who==='charlee'&&art&&K().pal?K().pal(art):null;if(pal)c.classList.add('pc-charlee');
  const say=pal?(td&&td.perfect?'Majestic work!':m.run>=7?'A royal streak!':td?'I approve!':'Quiz time?'):td&&td.perfect?'Perfect plate!':m.run>=7?'On fire, chef!':td?'Proud of you!':'Quiz time?';
  c.append(scene,el('div','pc-say',say),body);
  body.append(el('div','pc-tag','Mise en Place · Day '+day),el('div','pc-lv',m.L.name));const pts=el('div','pc-pts');pts.append(el('b',null,td?String(td.points):'0'),el('span',null,td?'points today':'no quiz yet today'));body.append(pts);
  const ch=el('div','pc-chips');if(td)ch.append(el('span',td.perfect?'p':'',td.perfect?'Perfect 5/5':S.days[m.t].score+'/'+S.days[m.t].total+' right'));ch.append(el('span',null,'×'+m.pv.mult+' streak'),el('span',null,m.run+(m.run===1?' day':' days')));body.append(ch);
  const L=m.L,w=L.next?Math.round(100*(S.points-L.from)/(L.next-L.from)):100,br=el('div','pc-bar');br.append(el('i'));br.firstChild.style.width=w+'%';body.append(br);
  const ft=el('div','pc-foot');ft.append(S.points.toLocaleString('en-GB')+' points · '+(L.next?(L.next-S.points).toLocaleString('en-GB')+' to '+LEVELS[L.i+1][1]:'top level')+' · ');ft.append(el('span','pc-name',S.name||'Mise en Place'));body.append(ft);
  if(K()){const k=el('div','khost');scene.append(k);setTimeout(()=>K().mount(k,pal||art),0)}
  return c}

/* ---------- gold bubbles on a right answer ---------- */
function fizz(n,big){const c=document.getElementById('fx');if(!c||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const d=Math.min(devicePixelRatio||1,2);c.width=innerWidth*d;c.height=innerHeight*d;const x=c.getContext('2d'),col=['#b48a3c','#e4cf9c','#f7dc8e','#d6a548'];
  const P=[...Array(n)].map(()=>({x:innerWidth*(.2+Math.random()*.6),y:innerHeight*(big?.75:.85),vx:(Math.random()-.5)*2,vy:-Math.random()*(big?9:6)-2,r:Math.random()*4+2,c:col[Math.floor(Math.random()*4)],life:1}));
  let last=performance.now();(function f(t){const dt=Math.min((t-last)/16,2);last=t;x.clearRect(0,0,c.width,c.height);let alive=0;P.forEach(p=>{p.vy*=.995;p.x+=p.vx*dt+Math.sin(t/200+p.r)*.4;p.y+=p.vy*dt;p.life-=.012*dt;if(p.life>0){alive++;x.globalAlpha=Math.max(p.life,0);x.strokeStyle=p.c;x.lineWidth=1.5*d;x.beginPath();x.arc(p.x*d,p.y*d,p.r*d,0,7);x.stroke()}});if(alive)requestAnimationFrame(f);else x.clearRect(0,0,c.width,c.height)})(last)}

/* ---------- sheets (full-screen panels with a working Back button) ---------- */
const stack=[];
addEventListener('popstate',()=>{const t=stack.pop();if(t){t.sh.remove();t.prev&&t.prev.focus&&t.prev.focus();if(!stack.length)document.body.style.overflow=''}});
addEventListener('keydown',e=>{if(e.key==='Escape'&&stack.length)history.back()});
function sheet(label){
  const prev=document.activeElement,sh=el('div','sheet');sh.setAttribute('role','dialog');sh.setAttribute('aria-modal','true');sh.setAttribute('aria-label',label);
  const bar=el('div','sbar'),cl=el('button','close','← Back');cl.onclick=()=>history.back();
  bar.append(el('strong',null,label),cl);const bd=el('div','body');sh.append(bar,bd);document.body.append(sh);document.body.style.overflow='hidden';cl.focus();history.pushState({s:1},'');stack.push({sh,prev});
  return{sh,bd}}

/* ---------- diagrams: the edition's inline SVG, re-checked here ---------- */
const SVG_OK=new Set(['svg','g','rect','circle','ellipse','line','polyline','polygon','path','text','tspan','title','desc','defs','lineargradient','radialgradient','stop','marker','clippath']);
const ATTR_OK=new Set('viewbox xmlns role aria-label id x y x1 y1 x2 y2 cx cy r rx ry width height d points fill fill-opacity stroke stroke-width stroke-dasharray stroke-linecap stroke-linejoin stroke-opacity opacity transform font-size font-weight font-family font-style text-anchor dominant-baseline letter-spacing dx dy offset stop-color stop-opacity gradientunits gradienttransform fx fy markerwidth markerheight refx refy orient markerunits marker-end marker-start clip-path clippathunits preserveaspectratio textlength lengthadjust pathlength'.split(' '));
function drawSvg(src){
  try{const doc=new DOMParser().parseFromString(src,'image/svg+xml'),root=doc.documentElement;
    if(!root||root.nodeName.toLowerCase()!=='svg'||doc.getElementsByTagName('parsererror').length)return null;
    const walk=n=>{[...n.children].forEach(c=>{if(!SVG_OK.has(c.nodeName.toLowerCase())){c.remove();return}
      [...c.attributes].forEach(a=>{const k=a.name.toLowerCase(),v=a.value;if(!ATTR_OK.has(k)||/javascript:|https?:|data:/i.test(v)||(/url\(/i.test(v)&&!/^\s*url\(#[\w-]+\)\s*$/.test(v)))c.removeAttribute(a.name)});walk(c)})};
    [...root.attributes].forEach(a=>{if(!ATTR_OK.has(a.name.toLowerCase()))root.removeAttribute(a.name)});walk(root);
    if(!root.getAttribute('font-family'))root.setAttribute('font-family','Figtree, system-ui, sans-serif');
    return document.importNode(root,true)}catch(e){return null}}

/* ---------- quiz engine (from the morning brief) ---------- */
const todayMult=()=>window.ScoreCore?ScoreCore.preview(S.days,todayStr(),MODE).mult:1;
const maxPoints=n=>Math.round((n*10+(n>=5?20:0))*todayMult());
function play(items,o){
  const{bd,sh}=sheet(o.title);let i=0,run=0,gained=0,right=0,picks=[],missed=[],pickKey=null;
  const each=o.practice?0:o.points!=null?o.points:o.review?5:10;
  /* a screen reader hears each result; A to D or 1 to 4 choose an answer */
  const live=el('div','sr');live.setAttribute('aria-live','polite');sh.append(live);
  const onKey=e=>{if(!sh.isConnected){removeEventListener('keydown',onKey);return}if(!stack.length||stack[stack.length-1].sh!==sh||e.metaKey||e.ctrlKey||e.altKey||!pickKey)return;
    const a='abcd'.indexOf(String(e.key).toLowerCase()),k=a>=0?a:'1234'.indexOf(e.key);if(k>=0){e.preventDefault();pickKey(k)}};
  addEventListener('keydown',onKey);
  const resume=(o.resume||[]).slice(0,items.length);
  resume.forEach((k,j)=>{const it=items[j];picks[j]=k;if(k===it.answer){run++;right++;gained+=each}else{run=0;missed.push(it)}});i=resume.length;
  const q=()=>{
    bd.textContent='';pickKey=null;if(i>=items.length)return finish();
    const it=items[i],dots=el('div','dots');
    items.forEach((_,j)=>dots.append(el('i',j<i?(picks[j]===items[j].answer?'ok':'no'):j===i?'on':'')));
    const hq=el('h2',null,it.q);hq.tabIndex=-1;
    bd.append(el('div','meta',o.title+' · question '+(i+1)+' of '+items.length+' · '+it.tag),dots);
    if(it.from==='review'&&it.title)bd.append(el('div','rev','From lesson '+it.n+': '+it.title));
    if(it.setup)bd.append(el('p','setup',it.setup));
    bd.append(hq);if(i>resume.length||live.textContent)hq.focus({preventScroll:true});
    const btns=it.options.map((t,k)=>{const b=el('button','opt');b.append(el('b',null,'ABCD'[k]),el('span',null,t));bd.append(b);return b});
    const fb=el('div');bd.append(fb);pickKey=k=>{if(btns[k]&&!btns[k].disabled)btns[k].click()};
    btns.forEach((b,k)=>b.onclick=()=>{
      btns.forEach(x=>x.disabled=true);const ok=k===it.answer;picks[i]=k;
      btns[it.answer].classList.add('ok');if(!ok){b.classList.add('no');missed.push(it)}btns.forEach((x,j)=>{if(j!==it.answer&&j!==k)x.classList.add('dim')});
      let p=0;if(ok){run++;right++;p=each;gained+=p;fizz(30)}else run=0;
      live.textContent=(ok?'Correct. ':'Not quite. The answer is '+'ABCD'[it.answer]+': '+it.options[it.answer]+'. ')+it.why;
      o.each&&o.each(it,ok,i,picks);
      fb.append(el('div','why',(ok?'Correct'+(p?', +'+p+' points':'')+'. ':'Not quite. ')+it.why));
      const nx=el('button','btn',i+1<items.length?'Next question':'See my score');nx.onclick=()=>{i++;q()};fb.append(nx);nx.focus({preventScroll:true});nx.scrollIntoView({block:'nearest',behavior:'smooth'})})};
  const finish=()=>{
    const perfect=right===items.length&&items.length>=5&&!o.review&&!o.practice;if(perfect)gained+=20;
    const res=o.done?o.done({right,total:items.length,gained,missed,picks,perfect}):{badges:[]};if(res.gained!=null)gained=res.gained;
    if(perfect)fizz(120,true);
    if(o.reward)try{o.reward(bd)}catch(e){}
    bd.append(el('div','meta',o.title+' complete'),el('div','score',right+'/'+items.length),el('div','pts',o.practice?(o.again&&right===items.length?'All put right. Practice runs are not scored.':'Practice run: not scored'):res.math?res.math:'+'+gained+' points'+(perfect?' (includes the perfect bonus)':'')));
    const L=level(S.points),w=L.next?Math.round(100*(S.points-L.from)/(L.next-L.from)):100;
    const bx=el('div','quizcard');const br=el('div','bar');br.append(el('i'));br.firstChild.style.width=w+'%';
    const sk=streak();bx.append(el('div','prog','Level '+(L.i+1)+' · '+L.name),br,el('p',null,S.points+' points. '+(L.next?(L.next-S.points)+' to the next level. ':'Top level. ')+(sk?'Streak: '+sk+' day'+(sk>1?'s':'')+' in a row.':'Come back tomorrow to start a streak.')));bd.append(bx);
    (res.badges||[]).forEach(n=>{const g=el('div','bd new');g.append(el('b',null,'New badge: '+n));bd.append(g)});
    if(res.lvUp)bd.append(el('p','pts','Promoted to '+res.lvUp+'!'));
    if(missed.length){bd.append(el('h3',null,'To revise'));missed.forEach(m=>{const g=el('div','why');g.append(el('b',null,m.q),el('br'),'Answer: '+m.options[m.answer]+'. '+m.why);bd.append(g)});if(!o.practice)bd.append(el('p','meta','Questions you missed come back in Review over the next days, until you get them right.'))}
    if(missed.length&&!o.review&&!o.solo){const again=missed.slice(),pm=el('button','btn alt','Practise the '+again.length+' you missed');pm.onclick=()=>play(again,{title:'Practice',practice:true,again:true});bd.append(pm)}
    const dn=el('button','btn','Done');dn.onclick=()=>history.back();bd.append(dn);
    o.after&&o.after();paintBadge(!o.practice)};
  q()}
function dayItems(b){return(b.quiz||[]).map((it,i)=>{const L=typeof it.from==='number'?b.lessons[it.from-1]:null,R=it.from==='review'&&AREA[it.area]?it:null;
  return Object.assign({},it,{id:b.date+'-'+i,date:b.date,n:R?R.n:L?L.n:null,area:R?R.area:L?L.area:'news',tag:R?'Earlier lesson · '+AREA[R.area][0]:L?AREA[L.area][0]:'News'})})}
function finishDay(b,items,r){
  const key=b.date;S.days[key]={score:r.right,total:r.total,points:0,at:Date.now()};
  items.forEach((it,i)=>{const ok=r.picks[i]===it.answer;const a=S.areas[it.area]=S.areas[it.area]||[0,0];a[1]++;if(ok)a[0]++;
    if(it.n){const L=S.lessons[it.n]=S.lessons[it.n]||[0,0];L[1]++;if(ok)L[0]++}
    if(!ok&&!S.review.some(x=>x.id===it.id))S.review.push(Object.assign({},it,{box:0,due:addDays(todayStr(),1)}))});
  const before=level(S.points);const R=rescoreAll();const after=level(S.points);delete S.prog[key];save();
  const dd=R?R.day[key]:{points:r.gained,base:r.right*10,bonus:0,mult:1};
  const badges=award();save();return{badges,lvUp:after.i>before.i?after.name:null,gained:dd.points,math:r.right+' right × 10'+(dd.bonus?' + 20 perfect':'')+(dd.mult>1?', × '+dd.mult+' streak':'')+' = +'+dd.points+' points'}}
function startQuiz(b,items,redraw){
  if(S.days[b.date])return play(items,{title:'Practice',practice:true});
  const prog=(S.prog[b.date]||[]).filter(k=>Number.isInteger(k)&&k>=0&&k<4);
  play(items,{title:'Today’s quiz',resume:prog,each:(it,ok,i,picks)=>{S.prog[b.date]=picks.slice();save()},done:r=>finishDay(b,items,r),reward:bd=>kimchiReward(bd,b),after:redraw})}
/* the Sunday scenario: one judgement call on the week's lessons, 15 points the first time */
function startScenario(b,redraw){
  const was=S.scen&&S.scen[b.date],it=Object.assign({},b.scenario,{id:b.date+'-s',tag:'Scenario'});
  play([it],{title:was?'Practice':'Sunday scenario',practice:!!was,solo:true,points:15,after:redraw,
    done:was?null:r=>{S.scen=S.scen||{};S.scen[b.date]={ok:r.right===1,at:Date.now()};S.bonus=(S.bonus||0)+r.gained;rescoreAll();const badges=award();save();return{badges}}})}
function startReview(redraw){
  const t=todayStr(),due=S.review.filter(x=>x.due<=t).slice(0,5);if(!due.length)return;const steps=[1,3,7,14,30];
  play(due,{title:'Review',review:true,each:(it,ok)=>{const r=S.review.find(x=>x.id===it.id);if(!r)return;
      if(ok){r.box++;if(r.box>=steps.length){S.review=S.review.filter(x=>x!==r);S.cleared=true}else r.due=addDays(t,steps[r.box])}else{r.box=0;r.due=addDays(t,1)}save()},
    done:r=>{S.bonus=(S.bonus||0)+r.gained;rescoreAll();const badges=award();save();return{badges}},after:redraw})}

/* ---------- glossary, toolkit, archive, progress ---------- */
let ALL=null;
async function allBriefs(list){if(ALL)return ALL;const out=[];
  await Promise.all(list.map(d=>fetch('briefs/'+d+'.json',{cache:'no-cache'}).then(r=>r.json()).then(b=>out.push(b)).catch(()=>0)));
  ALL=out.sort((a,b)=>a.date<b.date?-1:1);return ALL}
async function openGlossary(list){
  const{bd}=sheet('Glossary');bd.append(el('h2',null,'Glossary'),el('p','meta','Every term from your lessons so far, in plain English. It grows each day.'));
  const inp=el('input');inp.placeholder='Search terms';inp.setAttribute('aria-label','Search terms');bd.append(inp);const box=el('div','words');bd.append(box);box.append(el('p','meta','Loading…'));
  const m=new Map();(await allBriefs(list)).forEach(b=>(b.terms||[]).forEach(t=>{const k=t.term.toLowerCase();if(!m.has(k)){const L=b.lessons[t.lesson-1];m.set(k,Object.assign({day:b.day,area:L?L.area:''},t))}}));
  const terms=[...m.values()].sort((a,b)=>a.term.localeCompare(b.term,'en-GB'));
  const draw=()=>{box.textContent='';const q=inp.value.trim().toLowerCase(),dl=el('dl');
    terms.filter(t=>!q||(t.term+' '+t.def).toLowerCase().includes(q)).forEach(t=>{const dt=el('dt');if(AREA[t.area]){const d=el('i','dot');d.style.background=AREA[t.area][1];dt.append(d)}dt.append(t.term);dl.append(dt,el('dd',null,t.def+' (day '+t.day+')'))});
    box.append(el('p','meta',terms.length+' terms'),dl)};inp.oninput=draw;draw()}
async function openToolkit(list){
  const{bd}=sheet('Toolkit');bd.append(el('h2',null,'Your toolkit'),el('p','meta','Checklists, formulas and frameworks from your lessons, ready to use at work.'));
  const box=el('div');bd.append(box);box.append(el('p','meta','Loading…'));const tools=[];
  (await allBriefs(list)).forEach(b=>(b.toolkit||[]).forEach(t=>tools.push(Object.assign({day:b.day},t))));box.textContent='';
  ['checklist','formula','framework','script','template'].forEach(k=>{const g=tools.filter(t=>t.kind===k);if(!g.length)return;box.append(el('h3',null,k[0].toUpperCase()+k.slice(1)+'s'));g.forEach(t=>box.append(toolCard(t)))})}
function toolCard(t){const c=el('div','tool'),h=el('div');h.append(el('b',null,t.name),el('span','k',t.kind+(t.day?' · day '+t.day:'')));const ul=el('ul');(t.items||[]).forEach(s=>ul.append(el('li',null,s)));c.append(h,ul);return c}
function openArchive(list){
  const{bd}=sheet('Archive');bd.append(el('h2',null,'Past days'),el('p','meta','Every edition so far. Catching up on a missed quiz still counts towards your streak for that day.'));
  const box=el('div','arch');list.forEach(d=>{const a=el('a');a.href='?d='+d;const done=S.days[d];a.append(el('b',null,'Day '+courseDay(d)+' · '+nice(d)),el('span',null,done?done.score+'/'+done.total:'Not done'));box.append(a)});bd.append(box)}
async function openProgress(){
  const{bd}=sheet('Progress');const L=level(S.points),w=L.next?Math.round(100*(S.points-L.from)/(L.next-L.from)):100,days=doneDays();
  bd.append(el('h2',null,'Level '+(L.i+1)+': '+L.name));const b=el('div','bar');b.style.maxWidth='none';b.append(el('i'));b.firstChild.style.width=w+'%';bd.append(b);
  const r=el('div','row');r.append(el('span',null,S.points+' points'),el('span',null,L.next?(L.next-S.points)+' to '+LEVELS[L.i+1][1]:'Top level'));bd.append(r);
  const tc=totalCorrect(),tt=Object.values(S.areas).reduce((a,x)=>a+x[1],0);
  const stat=(a,b2)=>{const c=el('div','bd');c.append(el('b',null,a),b2);return c};const g=el('div','badges');g.style.marginTop='16px';
  g.append(stat(streak()+(streak()===1?' day':' days'),'Current streak'),stat(days.length+(days.length===1?' day':' days'),'Quizzes finished'),stat(S.review.length+'','Questions in review'),stat(tt?Math.round(100*tc/tt)+'%':'None yet','Right answers ('+tc+' of '+tt+')'));bd.append(g);
  bd.append(el('h3',null,'By area'));
  Object.keys(AREA).forEach(k=>{const[c,n]=S.areas[k]||[0,0],p=n?Math.round(100*c/n):0;const row=el('div');row.style.margin='10px 0';const r2=el('div','row'),lab=el('span'),d=el('i','dot');d.style.background=AREA[k][1];lab.append(d,AREA[k][0]);r2.append(lab,el('span',null,n?c+' of '+n+' right':'No answers yet'));const br=el('div','bar');br.style.maxWidth='none';br.append(el('i'));br.firstChild.style.width=p+'%';br.firstChild.style.background=AREA[k][1];row.append(r2,br);bd.append(row)});
  bd.append(el('h3',null,'The 661-lesson map'));const gr=el('div','grid');bd.append(gr,el('p','meta','One square per lesson, coloured by area. A square lights up when you serve that lesson or take that day’s quiz.'));
  try{const c=await fetch('course.json',{cache:'force-cache'}).then(r=>r.json());const seen=new Set(days.map(courseDay));
    c.lessons.forEach(l=>{const i=el('i',seen.has(l.day)||(S.learned&&S.learned[l.n])?'d':'');i.style.background=AREA[l.area][1];i.title='Day '+l.day+': '+l.title;gr.append(i)})}catch(e){gr.append(el('p','meta','The map could not load.'))}
  bd.append(el('h3',null,'Badges'));const bg=el('div','badges');BADGES.forEach(([id,n,d])=>{const c=el('div','bd'+(S.badges[id]?'':' lock'));c.append(el('b',null,n),S.badges[id]?'Earned '+S.badges[id]:d);bg.append(c)});bd.append(bg);
  if(window.Keep)Keep.mount(bd,{app:'MEP',get:()=>S,valid:o=>!!(o&&o.days&&typeof o.days==='object'&&!o.tags),
    describe:o=>{const n=Object.keys(o.days||{}).filter(k=>DAYRE.test(k)).length;return (o.points||0)+' points, '+n+(n===1?' day':' days')},
    apply:o=>{S=Object.assign(fresh(),o);save();location.reload()}})}

/* ---------- the page ---------- */
function rule(t,id){const r=el('div','rule',t);if(id)r.id=id;return r}
const mins=l=>Math.max(2,Math.round([l.intro,l.atWork,l.takeaway].concat((l.points||[]).map(p=>p.p)).join(' ').split(/\s+/).length/110))+' min';
const pad3=n=>String(n).padStart(3,'0');
const ROMAN=['I','II','III'];
function glimpse(src){const g=drawSvg(src);if(!g)return null;const vb=(g.getAttribute('viewBox')||'').split(/[ ,]+/).map(Number);
  /* full width, so no label is cut mid-word; the top of the drawing, fading out below */
  if(vb.length===4&&vb.every(isFinite)){g.setAttribute('viewBox',vb[0]+' '+vb[1]+' '+vb[2]+' '+Math.min(vb[3],vb[2]/1.6));g.setAttribute('preserveAspectRatio','xMidYMin meet')}
  g.setAttribute('aria-hidden','true');return g}
/* pass sounds, made live (off until she turns them on) */
let AC=null;const ac=()=>{try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();return AC}catch(e){return null}};
function bell(t0){const c=ac();if(!c)return;const t=c.currentTime+t0;[[1568,.45,1.6],[1568*2.76,.2,.9],[1568*5.4,.08,.45],[1568*1.003,.28,1.5]].forEach(([f,v,d])=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(c.destination);o.start(t);o.stop(t+d+.1)})}
function whoosh(){const c=ac();if(!c)return;const t=c.currentTime,d=.4,b=c.createBuffer(1,Math.ceil(c.sampleRate*d),c.sampleRate),x=b.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;const n=c.createBufferSource();n.buffer=b;const f=c.createBiquadFilter(),g=c.createGain();f.type='bandpass';f.Q.value=.6;f.frequency.setValueAtTime(400,t);f.frequency.exponentialRampToValueAtTime(2500,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.3,t+.15);g.gain.exponentialRampToValueAtTime(.0001,t+d);n.connect(f).connect(g).connect(c.destination);n.start(t)}
const orderUpSound=()=>{if(!S.sound)return;whoosh();setTimeout(()=>{bell(0);bell(.2)},450)};
const waitMs=ms=>new Promise(r=>setTimeout(r,ms));
const anim=(n,k,o)=>{const a=n.animate(k,Object.assign({fill:'forwards',easing:'cubic-bezier(.2,.9,.2,1)'},o));if(matchMedia('(prefers-reduced-motion: reduce)').matches){a.finish();return Promise.resolve()}return Promise.race([a.finished,waitMs((o.duration||300)+120)]).catch(()=>{})};
function glide(box,to){const from=box.scrollTop,d=to-from,t0=performance.now(),T=matchMedia('(prefers-reduced-motion: reduce)').matches?0:420;if(!T){box.scrollTop=to;return}setTimeout(()=>{box.scrollTop=to},T+80);(function f(t){const k=Math.min(1,(t-t0)/T),e=1-Math.pow(1-k,3);box.scrollTop=from+d*e;if(k<1)requestAnimationFrame(f)})(t0)}
function build(svg){svg.classList.add('building');[...svg.children].forEach((c,i)=>c.style.animationDelay=(i*28)+'ms')}
function enlarge(l){const prev=document.activeElement,bg=el('div','big');bg.setAttribute('role','dialog');bg.setAttribute('aria-modal','true');bg.setAttribute('aria-label','Diagram: '+l.title);
  const br=el('div','bar2');br.append(el('span',null,l.title));const cb=el('button',null,'Done');cb.onclick=()=>history.back();br.append(cb);
  const pan=el('div','pan'),g=drawSvg(l.svg);if(g)pan.append(g);bg.append(br,pan,el('div','hint2','Drag to move around the diagram'));document.body.append(bg);
  history.pushState({s:1},'');stack.push({sh:bg,prev});cb.focus()}
function openLesson(b,i,after,undo){
  const l=b.lessons[i],a=AREA[l.area]||['','#b48a3c'],prev=document.activeElement,id='L'+i;
  const wrap=el('div','lwrap'),scrim=el('div','lscrim'),sh=el('div','lsheet');sh.setAttribute('role','dialog');sh.setAttribute('aria-modal','true');sh.setAttribute('aria-label','Lesson '+l.n+': '+l.title);
  const x=el('button','x','✕');x.setAttribute('aria-label','Close lesson');
  const rc=el('div','rcpt');rc.append(el('span',null,'LESSON '+pad3(l.n)+' · '+a[0].toUpperCase()),el('span',null,mins(l).toUpperCase()));
  const lb=el('div','lb');lb.append(el('h2',null,l.title),el('p','out',l.outcome));
  const f=el('div','fig');f.id=id+'-fig';const g=drawSvg(l.svg);if(g){f.dataset.ok='1';f.append(g);build(g)}else f.append(el('p','note','The diagram could not be drawn.'));
  f.append(el('div','alt',l.alt));const zb=el('button','zoom','Enlarge diagram ⤢');zb.onclick=()=>enlarge(l);if(g)f.append(zb);lb.append(f,el('p',null,l.intro));
  (l.points||[]).forEach((pt,k)=>{const h=el('h4',null,pt.h);if(!k)h.id=id+'-pts';lb.append(h,el('p',null,pt.p))});
  try{const hs=hideAt(b);if(hs){if(i===hs.kimchi)lb.append(kimchiCameo(b,i,'kimchi'));if(i===hs.charlee)lb.append(kimchiCameo(b,i,'charlee'))}}catch(e){}
  const w=el('div','work');w.id=id+'-work';w.append(el('b',null,'At work'),el('p',null,l.atWork));const tk=el('p','take',l.takeaway);tk.id=id+'-take';lb.append(w,tk);
  const sr=el('div','src');sr.append('Source · ');(l.sources||[]).forEach((s2,j)=>{if(j)sr.append(' · ');sr.append(link(s2.name+' ↗',s2.url))});lb.append(sr);
  if(l.checked)lb.append(el('div','checked','Figures re-checked: '+l.checked));
  const was=!!(S.learned&&S.learned[l.n]);const sv=el('button','served'+(was?' was':''),was?'Served ✓ · close':'Mark as served');lb.append(sv);
  if(was){const un=el('button','unserve','Not finished? Take it off the pass');un.onclick=()=>{history.back();delete S.learned[l.n];save();undo&&undo(i)};lb.append(un)}
  const tabs=el('div','tabs');[['Diagram','-fig'],['Key points','-pts'],['At work','-work'],['Remember','-take']].forEach(([t,sf],j)=>{const bt=el('button',j?'':'on',t);bt.onclick=()=>{[...tabs.children].forEach(z=>z.classList.remove('on'));bt.classList.add('on');const tg=document.getElementById(id+sf);if(tg)glide(sh,tg.offsetTop-tabs.offsetHeight-10)};tabs.append(bt)});
  sh.append(el('div','grab'),x,rc,tabs,lb);wrap.append(scrim,sh);document.body.append(wrap);document.body.style.overflow='hidden';
  history.pushState({s:1},'');stack.push({sh:wrap,prev});x.onclick=scrim.onclick=()=>history.back();x.focus();
  sv.onclick=()=>{history.back();if(!was){S.learned=S.learned||{};S.learned[l.n]=b.date;save();after&&after(i)}}}
function tickets(b){
  const sec=el('section');sec.id='lessons';const hd=el('div','lhead');hd.append(el('h2',null,'Today’s tickets'));
  const r=el('div','r'),b1=el('b');b1.append(el('span','bell'),'THE PASS');const cnt=el('span');r.append(b1,cnt);hd.append(r);
  const n=b.lessons.length;const sub=el('p','lsub');sub.append(el('span',null,n+' tickets on the pass. Swipe, then tap to fire.'));sec.append(hd,sub);
  if(hideAt(b))sec.append(kimchiHint(b));
  const pass=el('div','pass'),lamp=el('div','lamp'),rail=el('div','rail'),ou=el('div','orderup','Order up!'),full=el('div','full','SERVICE COMPLETE · SEE YOU TOMORROW');
  const snd=el('button','snd');const sndTxt=()=>snd.textContent=S.sound?'SOUND ON':'SOUND OFF';sndTxt();snd.setAttribute('aria-label','Turn pass sounds on or off');snd.onclick=()=>{S.sound=!S.sound;save();sndTxt();if(S.sound)bell(0)};
  pass.append(lamp,rail,ou,full);sub.append(snd);const slotX=i=>{const w=pass.clientWidth||360,gap=(w-n*76)/(n+1);return Math.round(gap+i*(76+gap))};
  const slots=b.lessons.map((l,i)=>{const s2=el('div','slot',String(i+1));pass.append(s2);return s2});
  const placeSlots=()=>slots.forEach((s2,i)=>{s2.style.left=slotX(i)+'px';const h=pass.querySelector('.hung[data-i="'+i+'"]');if(h)h.style.left=slotX(i)+'px';const c=pass.querySelector('.clip[data-i="'+i+'"]');if(c)c.style.left=(slotX(i)+29)+'px'});
  const hang=(i,swing)=>{const l=b.lessons[i],a=AREA[l.area]||['','#b48a3c'];if(pass.querySelector('.hung[data-i="'+i+'"]'))return;slots[i].style.visibility='hidden';
    const h=el('div','hung');h.dataset.i=i;h.style.setProperty('--c',a[1]);h.style.setProperty('--cd',a[3]||a[1]);h.append(el('span',null,l.title),el('i',null,'SERVED'));const c=el('div','clip');c.dataset.i=i;pass.append(h,c);placeSlots();
    if(swing)h.animate([{transform:'rotate(14deg)'},{transform:'rotate(-9deg)'},{transform:'rotate(5deg)'},{transform:'rotate(-2deg)'},{transform:'rotate(0)'}],{duration:1100,easing:'ease-out'})};
  const car=el('div','car'),pager=el('div','pager'),tks=[];
  const isDone=i=>!!(S.learned&&S.learned[b.lessons[i].n]);
  const mark=()=>{let c=0,nx=-1;tks.forEach((t,i)=>{const on=isDone(i);t.classList.toggle('done',on);pager.children[i].classList.toggle('ok',on);if(on){c++;hang(i,false)}else if(nx<0)nx=i});
    tks.forEach((t,i)=>t.classList.toggle('next',i===nx&&c>0));cnt.textContent=c+'/'+n+' SERVED';full.classList.toggle('on',c===n);return nx};
  b.lessons.forEach((l,i)=>{const a=AREA[l.area]||['','#b48a3c'];const t=el('button','tk');t.style.setProperty('--c',a[1]);t.style.setProperty('--cd',a[3]||a[1]);t.setAttribute('aria-label','Ticket '+(i+1)+' of '+n+': lesson '+l.n+', '+l.title+', '+mins(l));
    const pa=el('div','paper'),r1=el('div','rows');r1.append(el('span',null,'LESSON '+pad3(l.n)),el('span','ar',a[0].toUpperCase()));
    const r2=el('div','rows lt');r2.append(el('span',null,'COVERS '+mins(l).toUpperCase()),el('span',null,'TICKET '+(i+1)+'/'+n));
    const gl=el('div','glimpse'),gs=glimpse(l.svg);if(gs){gl.dataset.ok='1';gl.append(gs)}
    const fire=el('div','fire');fire.append(el('span',null,l.module.toUpperCase()),el('span',null,'FIRE →'));
    pa.append(r1,r2,el('div','rn',ROMAN[i]||String(i+1)),el('hr','dash'),el('h3',null,l.title),el('p',null,l.outcome),gl,fire);
    t.append(pa,el('div','stamp','SERVED'));car.append(t);tks.push(t);pager.append(el('i',i?'':'on'));
    t.onclick=()=>openLesson(b,i,served,unserve)});
  /* send a served ticket back: lift it off the rail and put it back in the carousel */
  async function unserve(i){await waitMs(380);const h=pass.querySelector('.hung[data-i="'+i+'"]'),c=pass.querySelector('.clip[data-i="'+i+'"]');
    if(h){await anim(h,[{transform:'rotate(0)',opacity:1},{transform:'translateY(-14px) rotate(-6deg)',opacity:0}],{duration:420});h.remove()}if(c)c.remove();
    slots[i].style.visibility='';tks[i].classList.remove('done');pager.children[i].classList.remove('ok');
    const nx=mark();if(nx>=0)car.scrollTo({left:tks[nx].offsetLeft-(car.clientWidth-tks[nx].offsetWidth)/2,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
  async function served(i){await waitMs(380);const t=tks[i];t.classList.add('done');pager.children[i].classList.add('ok');
    const tr=t.getBoundingClientRect(),pr=pass.getBoundingClientRect();
    if(pr.bottom<0||pr.top>innerHeight)pass.scrollIntoView({block:'center',behavior:'smooth'}),await waitMs(450);
    const pr2=pass.getBoundingClientRect(),tr2=t.getBoundingClientRect(),fl=t.cloneNode(true);fl.className='tk flyer';fl.style.cssText+=';left:'+tr2.left+'px;top:'+tr2.top+'px;width:'+tr2.width+'px;margin:0';document.body.append(fl);
    const s=76/tr2.width,dx=pr2.left+slotX(i)-tr2.left,dy=pr2.top+24-tr2.top;orderUpSound();
    await anim(fl,[{transform:'translate(0,0) scale(1)'},{transform:'translate('+dx*.55+'px,'+(dy-40)+'px) scale('+(s*1.6)+') rotate(-6deg)',offset:.6},{transform:'translate('+dx+'px,'+dy+'px) scale('+s+')'}],{duration:700,easing:'cubic-bezier(.4,0,.2,1)'});
    fl.remove();hang(i,true);lamp.classList.add('on');ou.animate([{opacity:0,transform:'scale(.6)'},{opacity:1,transform:'scale(1.08)'},{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(1)'}],{duration:1200});
    setTimeout(()=>lamp.classList.remove('on'),1300);const nx=mark();if(nx>=0)setTimeout(()=>car.scrollTo({left:tks[nx].offsetLeft-(car.clientWidth-tks[nx].offsetWidth)/2,behavior:'smooth'}),900)}
  const upd=()=>{const w=tks[0].offsetWidth+14,idx=Math.max(0,Math.min(tks.length-1,Math.round(car.scrollLeft/w)));[...pager.children].forEach((d,i)=>d.classList.toggle('on',i===idx));tks.forEach((t,i)=>t.classList.toggle('off',i!==idx))};
  car.addEventListener('scroll',()=>requestAnimationFrame(upd));requestAnimationFrame(()=>{placeSlots();const nx=tks.findIndex((t,i)=>!isDone(i));if(nx>0)car.scrollLeft=tks[nx].offsetLeft-(car.clientWidth-tks[nx].offsetWidth)/2;upd()});addEventListener('resize',placeSlots);
  sec.append(pass,car,pager);mark();return sec}
/* ---------- news: The Pass Gazette carousel, the front page first, then the other stories ---------- */
const NAREA={industry:['UK industry',AREA.opening[1],AREA.opening[2],AREA.opening[3]],trends:['Food and drink trends',AREA.drinks[1],AREA.drinks[2],AREA.drinks[3]],finedining:['Fine dining and chefs',AREA.kitchen[1],AREA.kitchen[2],AREA.kitchen[3]],openings:['London openings',AREA.brand[1],AREA.brand[2],AREA.brand[3]]};
const nv=x=>({gist:x.gist||x.summary||'',big:x.big||null,read:x.read||{what:x.summary||'',soWhat:x.why||'',take:''}});
/* Photos are saved by the publisher under a fingerprint of their source address, so a reordered story never shows another story's photo */
function photoName(src){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(src))).then(h=>'briefs/img/'+[...new Uint8Array(h)].slice(0,8).map(x=>x.toString(16).padStart(2,'0')).join('')+'.jpg')}
function photoEl(b,k,ph,cls){if(!ph)return null;const f=el('figure',cls||'nphoto'),im=el('img');photoName(ph.src).then(n=>{im.src=n},()=>f.remove());im.alt=ph.alt||'';im.loading='lazy';im.decoding='async';im.onerror=()=>f.remove();
  const cap=el('figcaption');const a=link('Photo: '+ph.credit+', '+ph.licence+' ↗',ph.page);cap.append(a);f.append(im,cap);return f}
function openStory(b,k){const x=b.news[k],v=nv(x),ar=NAREA[x.area]||['','#b48a3c'],prev=document.activeElement;
  const wrap=el('div','lwrap'),scrim=el('div','lscrim'),sh=el('div','lsheet nsheet');sh.setAttribute('role','dialog');sh.setAttribute('aria-modal','true');sh.setAttribute('aria-label',x.headline);sh.style.setProperty('--c',ar[1]);sh.style.setProperty('--cd',ar[3]||ar[1]);
  const xb=el('button','x','✕');xb.setAttribute('aria-label','Close story');const body=el('div','nb');
  const ph=photoEl(b,k,x.photo,'nhero');if(ph)body.append(ph);
  const m=el('div','nmeta');m.append(el('span','nk',ar[0]),el('span',null,(x.source.name+' · '+x.source.date).toUpperCase()));body.append(m,el('h2',null,x.headline));
  if(v.big){const f=el('div','nfig');f.append(el('b',null,v.big.value),el('span',null,v.big.label));body.append(f)}
  if(x.drawing){const d=el('div','ndraw'),g=drawSvg(x.drawing);if(g){d.dataset.ok='1';d.append(g);build(g)}if(x.drawingAlt)d.append(el('div','alt',x.drawingAlt));body.append(d)}
  const sec=(h,t,c)=>{if(!t)return;const d=el('div','nsec'+(c?' '+c:''));d.append(el('h4',null,h),el('p',null,t));body.append(d)};
  sec('What happened',v.read.what);sec('How it works',v.read.how);sec('So what for you',v.read.soWhat,'so');sec('Key insight',v.read.take,'ins');
  const a=link('',x.source.url);a.className='orig';a.append(el('span',null,'Read the original at '+x.source.name),el('span',null,'↗'));body.append(a);
  sh.append(el('div','grab'),xb,body);wrap.append(scrim,sh);document.body.append(wrap);document.body.style.overflow='hidden';
  history.pushState({s:1},'');stack.push({sh:wrap,prev});xb.onclick=scrim.onclick=()=>history.back();xb.focus()}
function newsSection(b){
  const sec=el('section','news');sec.id='news';const items=b.news||[];
  const mast=el('div','gmast');mast.append(el('h2',null,'The Pass Gazette'),el('span',null,nice(b.date)));sec.append(mast);
  if(!items.length){sec.append(el('p','note','No news today.'));return sec}
  const n=items.length,car=el('div','gcar');car.tabIndex=0;car.setAttribute('role','region');car.setAttribute('aria-label','Today’s news: swipe or use the arrow keys');
  const lead=items[0],lv=nv(lead),la=NAREA[lead.area]||['','#b48a3c'];const L=el('button','glead');L.type='button';L.style.setProperty('--c',la[1]);L.style.setProperty('--cd',la[3]||la[1]);L.setAttribute('aria-label','Lead story, 1 of '+n+': '+lead.headline);
  const lp=photoEl(b,0,lead.photo,'gphoto');if(lp){const fc=lp.querySelector('figcaption');fc.textContent='Photo: '+lead.photo.credit+', '+lead.photo.licence;L.append(lp)}
  L.append(el('span','nk',la[0]));if(lv.big){L.append(el('div','gbig',lv.big.value),el('div','gbl',lv.big.label))}
  L.append(el('h3',null,lead.headline),el('p',null,lv.gist),el('span','grd','Read the story →'));L.onclick=()=>openStory(b,0);car.append(L);
  /* the other stories as full receipt cards: photo (with its credit) or the key figure on top, then headline, gist and the way in */
  items.slice(1).forEach((x,j)=>{const k=j+1,v=nv(x),ar=NAREA[x.area]||['','#b48a3c'];const c=el('button','gcard');c.type='button';c.style.setProperty('--c',ar[1]);c.style.setProperty('--cd',ar[3]||ar[1]);c.setAttribute('aria-label','Story '+(k+1)+' of '+n+': '+x.headline);
    const pp=el('div','pp'),dl=el('div','dl');dl.append(el('span','t',ar[0].toUpperCase()),el('span',null,String(x.source.date||'').toUpperCase()));pp.append(dl);
    const fig=v.big?el('div','gfig'):null;if(fig)fig.append(el('b',null,v.big.value),el('span',null,v.big.label));
    const ph=photoEl(b,k,x.photo,'gphoto');
    if(ph){ph.querySelector('figcaption').textContent='Photo: '+x.photo.credit+', '+x.photo.licence;pp.append(ph);
      /* a photo that fails to load is removed by photoEl; the key figure then takes its place as the panel */
      if(fig){fig.classList.add('sm');ph.querySelector('img').addEventListener('error',()=>fig.classList.remove('sm'))}}
    if(fig)pp.append(fig);
    pp.append(el('h4',null,x.headline),el('p',null,v.gist),el('span','more','READ THE STORY →'));c.append(pp);c.onclick=()=>openStory(b,k);car.append(c)});
  const slides=[...car.children],nav=el('div','gnav'),pv=el('button','gnb','‹'),nx=el('button','gnb','›'),pos=el('div','gpos'),cnt=el('span','gcount','1 / '+n),dots=el('div','pager');
  pv.type=nx.type='button';pv.setAttribute('aria-label','Previous story');nx.setAttribute('aria-label','Next story');pv.disabled=true;cnt.setAttribute('aria-live','polite');dots.setAttribute('aria-hidden','true');
  slides.forEach((s,i)=>dots.append(el('i',i?'':'on')));pos.append(cnt,dots);nav.append(pv,pos,nx);
  if(n<2){car.classList.add('solo');nav.hidden=true}
  /* which slide sits at the start of the row; at the far end the last story counts as shown */
  const at=()=>{const x=car.scrollLeft+slides[0].offsetLeft;let best=0,d=1e9;slides.forEach((s,i)=>{const e=Math.abs(s.offsetLeft-x);if(e<d){d=e;best=i}});return best};
  let cur=0,tm=0;
  const upd=()=>{const max=car.scrollWidth-car.clientWidth,end=car.scrollLeft>=max-2,i=end?n-1:at();
    if(i!==cur){cur=i;cnt.textContent=(i+1)+' / '+n;[...dots.children].forEach((d,j)=>d.classList.toggle('on',j===i))}
    pv.disabled=car.scrollLeft<=2;nx.disabled=end};
  /* previous and next: a smooth scroll, with a timer that finishes the move if the frames stall */
  const go=d=>{const i=Math.max(0,Math.min(n-1,at()+d)),left=Math.min(slides[i].offsetLeft-slides[0].offsetLeft,car.scrollWidth-car.clientWidth);
    car.scrollTo({left,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});clearTimeout(tm);tm=setTimeout(()=>{if(Math.abs(car.scrollLeft-left)>2)car.scrollLeft=left;upd()},900)};
  pv.onclick=()=>go(-1);nx.onclick=()=>go(1);
  ['pointerdown','touchstart','wheel'].forEach(e=>car.addEventListener(e,()=>clearTimeout(tm),{passive:true}));
  car.addEventListener('scroll',()=>requestAnimationFrame(upd),{passive:true});addEventListener('resize',()=>requestAnimationFrame(upd));requestAnimationFrame(upd);
  sec.append(car,nav);if(b.newsNote)sec.append(el('p','note',b.newsNote));return sec}
function render(b,list){
  const app=document.getElementById('app');app.textContent='';CURB=b;paintBadge();
  const isToday=b.date===todayStr(),sk=streak(),heroSk=sk+(isToday&&!S.days[b.date]?1:0);
  const hid=new URLSearchParams(location.search).get('hero'),hero=(window.HEROES&&HEROES.ORDER.includes(hid))?hid:(window.HEROES?HEROES.forDay(b.day):'plate');
  app.append(el('div','mast','Mise en Place'));
  const h=el('div','hero'),cv=el('canvas'),ink=HERO_INK[hero]||HERO_INK.pour;h.dataset.hero=hero;h.style.setProperty('--hink',ink[0]);h.style.setProperty('--hsub',ink[1]);cv.setAttribute('aria-hidden','true');
  const ov=el('div','ov'),dd=el('div','d','Day '+b.day);dd.append(el('small',null,PHASES[b.phase-1]+' · '+(sk?sk+'-day streak':'start your streak today')));ov.append(el('div','s',nice(b.date)),dd);h.append(cv,ov);app.append(h);
  if(window.HEROES)try{HEROES.startHero(cv,hero,{day:b.day,total:TOTAL,streak:heroSk,areas:b.lessons.map(l=>(AREA[l.area]||AREA.drinks)[1])})}catch(e){}
  if(!isToday){const n=el('p','note','You are reading an earlier day. ');const a=el('a',null,'Go to today');a.href='./';n.append(a);app.append(n)}
  app.append(el('p','welcome',b.welcome));
  const pg=el('div','prog','Day '+b.day+' of '+TOTAL+' · Phase '+b.phase+' of 5'),bar=el('div','bar');bar.append(el('i'));bar.firstChild.style.width=Math.round(100*b.day/TOTAL)+'%';pg.append(bar);app.append(pg);
  const ch=el('div','chips');[['Lessons','#lessons'],['News','#news'],['Words','#words'],['Quiz','#quiz']].forEach(([t,hr])=>{const a=el('a',null,t);a.href=hr;ch.append(a)});app.append(ch);
  app.append(tickets(b));
  const t=el('section','tryit');t.append(rule('Try this at work'),el('h2',null,b.try.title));const ol=el('ol');b.try.steps.forEach(s=>ol.append(el('li',null,s)));t.append(ol,el('p','why',b.try.why));app.append(t);
  const items=dayItems(b),qc=el('section','quizcard');qc.id='quiz';
  const rv=el('section','reviewcard'),scn=el('section','reviewcard'),nRev=items.filter(x=>x.from==='review').length;scn.hidden=true;
  const draw=()=>{qc.textContent='';const dn=S.days[b.date],pr=(S.prog[b.date]||[]).length;
    if(b.scenario&&Array.isArray(b.scenario.options)){const was=S.scen&&S.scen[b.date];scn.hidden=false;scn.textContent='';scn.id='scenario';
      scn.append(el('div','prog','Sunday scenario'),el('h2',null,b.scenario.title),el('p',null,was?(was.ok?'You made the right call: +15 points. ':'Not the best call this time. ')+'Replays are practice.':'One situation built from this week’s lessons. Choose what you would do. 15 points for the right call.'));
      const sb=el('button','btn alt',was?'Try it again':'Open the scenario');sb.onclick=()=>startScenario(b,draw);scn.append(sb)}
    qc.append(el('div','prog','Quiz · '+items.length+' questions'),el('h2',null,dn?'You scored '+dn.score+' out of '+dn.total:pr?'You are '+pr+' questions in':(items.length-nRev)+' questions on today'+(nRev?', '+nRev+' from earlier lessons':'')),el('p',null,dn?'+'+dn.points+' points. Replays are practice and do not change your score.':'Points for every right answer, a bonus for a perfect score, and a streak for every day you play. Up to '+maxPoints(items.length)+' points today.'));
    const bt=el('button','btn',dn?'Practise again':pr?'Resume quiz':'Start the quiz');bt.onclick=()=>startQuiz(b,items,draw);qc.append(bt);
    rv.textContent='';const due=S.review.filter(x=>x.due<=todayStr()).length;
    rv.hidden=!due;if(due){rv.append(el('div','prog','Review'),el('h2',null,due+' question'+(due>1?'s':'')+' to revise'),el('p',null,'Questions you missed before. Get each right a few times, days apart, and it leaves the list.'));const rb=el('button','btn alt','Start review');rb.onclick=()=>startReview(draw);rv.append(rb)}};
  app.append(newsSection(b));
  const wd=el('section','words');wd.id='words';wd.append(rule('Today’s words'));const dl=el('dl');(b.terms||[]).forEach(x=>dl.append(el('dt',null,x.term),el('dd',null,x.def)));wd.append(dl);
  if((b.toolkit||[]).length){wd.append(rule('Added to your toolkit'));b.toolkit.forEach(x=>wd.append(toolCard(x)))}app.append(wd);
  if(window.Evidence)Evidence.mount(app,b,{cls:'evidence'});
  /* the quiz goes last, after everything there is to read (Agnes, 10 Nov 2026) */
  app.append(rule('Quiz'),qc,scn,rv);draw();
  const more=el('div','chips');more.style.marginTop='34px';[['Glossary',()=>openGlossary(list)],['Toolkit',()=>openToolkit(list)],['Progress',openProgress],['Past days',()=>openArchive(list)]].forEach(([t,f])=>{const x=el('button',null,t);x.onclick=f;more.append(x)});app.append(more);
  app.append(el('footer',null,'Mise en Place · a daily course for running and opening a restaurant. Your streak and answers are saved only on this phone. News links go to the original reporting; lessons are a study guide, so check the official source before acting on anything legal.'));
  if(location.hash){const tgt=document.getElementById(location.hash.slice(1));tgt&&tgt.scrollIntoView()}
  const op=+new URLSearchParams(location.search).get('open');if(op>=1&&op<=b.lessons.length)openLesson(b,op-1)}
async function boot(){
  const app=document.getElementById('app');
  try{const list=await fetch('briefs/index.json',{cache:'no-cache'}).then(r=>r.json());
    if(!Array.isArray(list)||!list.length){app.textContent='';app.append(el('p','err','The first edition is on its way. Check back soon.'));return}
    const want=new URLSearchParams(location.search).get('d'),t=todayStr();
    const date=list.includes(want)?want:(list.find(d=>d<=t)||list[list.length-1]);
    const b=await fetch('briefs/'+date+'.json',{cache:'no-cache'}).then(r=>r.json());
    render(b,list.filter(d=>d<=t||d===date))}
  catch(e){app.textContent='';app.append(el('p','err',(navigator.onLine===false||/fetch|network|load failed/i.test(String(e&&e.message)))?'No connection. Today’s edition needs signal: try again when you have it.':'Today’s edition could not load. Pull down to refresh, or try again in a minute.'))}}
boot();
})();
