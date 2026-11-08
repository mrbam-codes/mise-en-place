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
const AREA={kitchen:['Kitchen','#c4562a'],drinks:['Drinks','#b48a3c'],money:['Money','#5e8f3a'],opening:['Opening and legal','#4f6d8f'],brand:['Brand','#a3456b'],guests:['Guests and growth','#7a5aa8']};
const NEWS=[['industry','UK industry'],['trends','Food and drink trends'],['finedining','Fine dining and chefs'],['openings','London openings']];
const PHASES=["Run today's floor better",'Master the craft','Design your own restaurant','Open, launch and grow','Capstones: your restaurant on paper'];
const HERO_INK={plate:['#20242a','#6b7280'],pour:['#2b2417','#7a6646'],macaron:['#2d2226','#8a6f78'],tower:['#2b2417','#7a6646'],pancake:['#1f2a33','#677585'],gelato:['#2d241f','#8a7262'],redwine:['#2a1f22','#806a6e'],tea:['#1f2a24','#5f6f66'],matcha:['#1f2a20','#667060'],benny:['#2a2318','#7d6f5a']};
const START=new Date(2026,10,8), TOTAL=221;
const ORD=['First','Second','Third'];

/* ---------- saved progress (this phone only) ---------- */
const KEY='mep-v1',DAYRE=/^\d{4}-\d{2}-\d{2}$/;
const fresh=()=>({days:{},areas:{},lessons:{},points:0,badges:{},review:[],prog:{}});
let S=(()=>{try{const s=JSON.parse(localStorage.getItem(KEY));return s&&s.days?Object.assign(fresh(),s):fresh()}catch(e){return fresh()}})();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const LEVELS=[[0,'Commis'],[100,'Demi chef'],[300,'Chef de partie'],[600,'Sous chef'],[1000,'Head chef'],[1600,'Chef patron'],[2500,'Restaurateur']];
const level=p=>{let i=0;LEVELS.forEach((l,j)=>{if(p>=l[0])i=j});const nx=LEVELS[i+1];return{name:LEVELS[i][1],i,from:LEVELS[i][0],next:nx?nx[0]:null}};
const ds=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const parse=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return ds(d)};
const todayStr=()=>ds(new Date());
const courseDay=s=>Math.round((parse(s)-START)/864e5)+1;
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
const pointsFor=run=>10+Math.min(run-1,4)*2;
const maxPoints=n=>{let t=0;for(let i=1;i<=n;i++)t+=pointsFor(i);return t+(n>=5?20:0)};
function play(items,o){
  const{bd}=sheet(o.title);let i=0,run=0,gained=0,right=0,picks=[],missed=[];
  const resume=(o.resume||[]).slice(0,items.length);
  resume.forEach((k,j)=>{const it=items[j];picks[j]=k;if(k===it.answer){run++;right++;gained+=o.review?5:pointsFor(run)}else{run=0;missed.push(it)}});i=resume.length;
  const q=()=>{
    bd.textContent='';if(i>=items.length)return finish();
    const it=items[i],dots=el('div','dots');
    items.forEach((_,j)=>dots.append(el('i',j<i?(picks[j]===items[j].answer?'ok':'no'):j===i?'on':'')));
    bd.append(el('div','meta',o.title+' · question '+(i+1)+' of '+items.length+' · '+it.tag),dots,el('h2',null,it.q));
    const btns=it.options.map((t,k)=>{const b=el('button','opt');b.append(el('b',null,'ABCD'[k]),el('span',null,t));bd.append(b);return b});
    const fb=el('div');bd.append(fb);
    btns.forEach((b,k)=>b.onclick=()=>{
      btns.forEach(x=>x.disabled=true);const ok=k===it.answer;picks[i]=k;
      btns[it.answer].classList.add('ok');if(!ok){b.classList.add('no');missed.push(it)}btns.forEach((x,j)=>{if(j!==it.answer&&j!==k)x.classList.add('dim')});
      let p=0;if(ok){run++;right++;p=o.review?5:(o.practice?0:pointsFor(run));gained+=p;fizz(30)}else run=0;
      o.each&&o.each(it,ok,i,picks);
      fb.append(el('div','why',(ok?'Correct'+(p?', +'+p+' points':'')+'. ':'Not quite. ')+it.why));
      const nx=el('button','btn',i+1<items.length?'Next question':'See my score');nx.onclick=()=>{i++;q()};fb.append(nx);nx.scrollIntoView({block:'nearest',behavior:'smooth'})})};
  const finish=()=>{
    const perfect=right===items.length&&items.length>=5&&!o.review&&!o.practice;if(perfect)gained+=20;
    const res=o.done?o.done({right,total:items.length,gained,missed,picks,perfect}):{badges:[]};
    if(perfect)fizz(120,true);
    bd.append(el('div','meta',o.title+' complete'),el('div','score',right+'/'+items.length),el('div','pts',o.practice?'Practice run: not scored':'+'+gained+' points'+(perfect?' (includes the perfect bonus)':'')));
    const L=level(S.points),w=L.next?Math.round(100*(S.points-L.from)/(L.next-L.from)):100;
    const bx=el('div','quizcard');const br=el('div','bar');br.append(el('i'));br.firstChild.style.width=w+'%';
    const sk=streak();bx.append(el('div','prog','Level '+(L.i+1)+' · '+L.name),br,el('p',null,S.points+' points. '+(L.next?(L.next-S.points)+' to the next level. ':'Top level. ')+(sk?'Streak: '+sk+' day'+(sk>1?'s':'')+' in a row.':'Come back tomorrow to start a streak.')));bd.append(bx);
    (res.badges||[]).forEach(n=>{const g=el('div','bd new');g.append(el('b',null,'New badge: '+n));bd.append(g)});
    if(res.lvUp)bd.append(el('p','pts','Promoted to '+res.lvUp+'!'));
    if(missed.length){bd.append(el('h3',null,'To revise'));missed.forEach(m=>{const g=el('div','why');g.append(el('b',null,m.q),el('br'),'Answer: '+m.options[m.answer]+'. '+m.why);bd.append(g)});if(!o.practice)bd.append(el('p','meta','Questions you missed come back in Review over the next days, until you get them right.'))}
    const dn=el('button','btn','Done');dn.onclick=()=>history.back();bd.append(dn);
    o.after&&o.after()};
  q()}
function dayItems(b){return(b.quiz||[]).map((it,i)=>{const L=typeof it.from==='number'?b.lessons[it.from-1]:null;
  return Object.assign({},it,{id:b.date+'-'+i,date:b.date,n:L?L.n:null,area:L?L.area:'news',tag:L?AREA[L.area][0]:'News'})})}
function finishDay(b,items,r){
  const key=b.date;S.days[key]={score:r.right,total:r.total,points:r.gained,at:Date.now()};
  items.forEach((it,i)=>{const ok=r.picks[i]===it.answer;const a=S.areas[it.area]=S.areas[it.area]||[0,0];a[1]++;if(ok)a[0]++;
    if(it.n){const L=S.lessons[it.n]=S.lessons[it.n]||[0,0];L[1]++;if(ok)L[0]++}
    if(!ok&&!S.review.some(x=>x.id===it.id))S.review.push(Object.assign({},it,{box:0,due:addDays(todayStr(),1)}))});
  const before=level(S.points);S.points+=r.gained;const after=level(S.points);delete S.prog[key];save();
  const badges=award();save();return{badges,lvUp:after.i>before.i?after.name:null}}
function startQuiz(b,items,redraw){
  if(S.days[b.date])return play(items,{title:'Practice',practice:true});
  const prog=(S.prog[b.date]||[]).filter(k=>Number.isInteger(k)&&k>=0&&k<4);
  play(items,{title:'Today’s quiz',resume:prog,each:(it,ok,i,picks)=>{S.prog[b.date]=picks.slice();save()},done:r=>finishDay(b,items,r),after:redraw})}
function startReview(redraw){
  const t=todayStr(),due=S.review.filter(x=>x.due<=t).slice(0,5);if(!due.length)return;const steps=[1,3,7,14,30];
  play(due,{title:'Review',review:true,each:(it,ok)=>{const r=S.review.find(x=>x.id===it.id);if(!r)return;
      if(ok){r.box++;if(r.box>=steps.length){S.review=S.review.filter(x=>x!==r);S.cleared=true}else r.due=addDays(t,steps[r.box])}else{r.box=0;r.due=addDays(t,1)}save()},
    done:r=>{S.points+=r.gained;const badges=award();save();return{badges}},after:redraw})}

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
  bd.append(el('h3',null,'The 661-lesson map'));const gr=el('div','grid');bd.append(gr,el('p','meta','One square per lesson, coloured by area. Squares light up once you have taken that day’s quiz.'));
  try{const c=await fetch('course.json',{cache:'force-cache'}).then(r=>r.json());const seen=new Set(days.map(courseDay));
    c.lessons.forEach(l=>{const i=el('i',seen.has(l.day)?'d':'');i.style.background=AREA[l.area][1];i.title='Day '+l.day+': '+l.title;gr.append(i)})}catch(e){gr.append(el('p','meta','The map could not load.'))}
  bd.append(el('h3',null,'Badges'));const bg=el('div','badges');BADGES.forEach(([id,n,d])=>{const c=el('div','bd'+(S.badges[id]?'':' lock'));c.append(el('b',null,n),S.badges[id]?'Earned '+S.badges[id]:d);bg.append(c)});bd.append(bg);
  bd.append(el('h3',null,'Back up your progress'),el('p','meta','Your streak and answers live only on this phone. Copy a backup code to keep them safe or move them to a new phone.'));
  const ex=el('button','btn','Copy backup code'),ta=el('textarea');ta.placeholder='Paste a backup code here to restore';ta.setAttribute('aria-label','Backup code');
  ex.onclick=()=>{const code=btoa(unescape(encodeURIComponent(JSON.stringify(S))));const show=()=>{ta.value=code;ta.select();ex.textContent='Code shown below: copy it'};try{navigator.clipboard.writeText(code).then(()=>ex.textContent='Copied',show)}catch(e){show()}};
  const im=el('button','btn alt','Restore from code');
  im.onclick=()=>{try{const o=JSON.parse(decodeURIComponent(escape(atob(ta.value.trim()))));if(!o.days)throw 0;if(!confirm('Replace the progress on this phone with the backup?'))return;S=Object.assign(fresh(),o);save();location.reload()}catch(e){im.textContent='That code did not work'}};
  bd.append(ex,ta,im)}

/* ---------- the page ---------- */
function rule(t,id){const r=el('div','rule',t);if(id)r.id=id;return r}
function lessonEl(l,i){
  const s=el('section','lesson'),a=AREA[l.area]||['',''];s.id='lesson-'+(i+1);
  const r=rule(ORD[i]+' · '+a[0]);const d=el('i','dot');d.style.background=a[1];r.insertBefore(d,r.childNodes[0]);s.append(r);
  s.append(el('div','mod','Lesson '+l.n+' · '+l.module),el('h2','t',l.title),el('p','outcome',l.outcome));
  const f=el('div','fig'),g=drawSvg(l.svg);if(g){f.dataset.ok='1';f.append(g)}else f.append(el('p','note','The diagram could not be drawn.'));f.append(el('div','alt',l.alt));s.append(f);
  s.append(el('p',null,l.intro));(l.points||[]).forEach(p=>s.append(el('h3',null,p.h),el('p',null,p.p)));
  const w=el('div','atwork');w.append(el('b',null,'At work'),el('p',null,l.atWork));s.append(w,el('p','take',l.takeaway));
  const sr=el('div','src');sr.append('Source · ');(l.sources||[]).forEach((x,j)=>{if(j)sr.append(' · ');sr.append(link(x.name+' ↗',x.url))});s.append(sr);
  if(l.checked)s.append(el('div','checked','Figures re-checked: '+l.checked));
  return s}
function render(b,list){
  const app=document.getElementById('app');app.textContent='';
  const isToday=b.date===todayStr(),sk=streak(),heroSk=sk+(isToday&&!S.days[b.date]?1:0);
  const hid=new URLSearchParams(location.search).get('hero'),hero=(window.HEROES&&HEROES.ORDER.includes(hid))?hid:(window.HEROES?HEROES.forDay(b.day):'plate');
  app.append(el('div','mast','Mise en Place'));
  const h=el('div','hero'),cv=el('canvas'),ink=HERO_INK[hero]||HERO_INK.pour;h.dataset.hero=hero;h.style.setProperty('--hink',ink[0]);h.style.setProperty('--hsub',ink[1]);cv.setAttribute('aria-hidden','true');
  const ov=el('div','ov'),dd=el('div','d','Day '+b.day);dd.append(el('small',null,PHASES[b.phase-1]+' · '+(sk?sk+'-day streak':'start your streak today')));ov.append(el('div','s',nice(b.date)),dd);h.append(cv,ov);app.append(h);
  if(window.HEROES)try{HEROES.startHero(cv,hero,{day:b.day,total:TOTAL,streak:heroSk,areas:b.lessons.map(l=>(AREA[l.area]||AREA.drinks)[1])})}catch(e){}
  if(!isToday){const n=el('p','note','You are reading an earlier day. ');const a=el('a',null,'Go to today');a.href='./';n.append(a);app.append(n)}
  app.append(el('p','welcome',b.welcome));
  const pg=el('div','prog','Day '+b.day+' of '+TOTAL+' · Phase '+b.phase+' of 5'),bar=el('div','bar');bar.append(el('i'));bar.firstChild.style.width=Math.round(100*b.day/TOTAL)+'%';pg.append(bar);app.append(pg);
  const ch=el('div','chips');[['Lessons','#lesson-1'],['Quiz','#quiz'],['News','#news'],['Words','#words']].forEach(([t,hr])=>{const a=el('a',null,t);a.href=hr;ch.append(a)});app.append(ch);
  b.lessons.forEach((l,i)=>app.append(lessonEl(l,i)));
  const t=el('section','tryit');t.append(rule('Try this at work'),el('h2',null,b.try.title));const ol=el('ol');b.try.steps.forEach(s=>ol.append(el('li',null,s)));t.append(ol,el('p','why',b.try.why));app.append(t);
  const items=dayItems(b),qc=el('section','quizcard');qc.id='quiz';
  const rv=el('section','reviewcard');
  const draw=()=>{qc.textContent='';const dn=S.days[b.date],pr=(S.prog[b.date]||[]).length;
    qc.append(el('div','prog','Quiz · '+items.length+' questions'),el('h2',null,dn?'You scored '+dn.score+' out of '+dn.total:pr?'You are '+pr+' questions in':'Five questions on today'),el('p',null,dn?'+'+dn.points+' points. Replays are practice and do not change your score.':'Points for every right answer, a bonus for a perfect score, and a streak for every day you play. Up to '+maxPoints(items.length)+' points today.'));
    const bt=el('button','btn',dn?'Practise again':pr?'Resume quiz':'Start the quiz');bt.onclick=()=>startQuiz(b,items,draw);qc.append(bt);
    rv.textContent='';const due=S.review.filter(x=>x.due<=todayStr()).length;
    rv.hidden=!due;if(due){rv.append(el('div','prog','Review'),el('h2',null,due+' question'+(due>1?'s':'')+' to revise'),el('p',null,'Questions you missed before. Get each right a few times, days apart, and it leaves the list.'));const rb=el('button','btn alt','Start review');rb.onclick=()=>startReview(draw);rv.append(rb)}};
  app.append(rule('Quiz'),qc,rv);draw();
  const nw=el('section','news');nw.id='news';nw.append(rule('In the news'));
  NEWS.forEach(([k,label])=>{const its=(b.news||[]).filter(x=>x.area===k);if(!its.length)return;const g=el('div','ng');g.append(el('div','nh',label));
    its.forEach(x=>{const it=el('div','item');const so=el('p','so');so.append(el('b',null,'For you: '),x.why);it.append(el('h3',null,x.headline),el('p',null,x.summary),so,link(x.source.name+', '+x.source.date+' ↗',x.source.url));g.append(it)});nw.append(g)});
  if(b.newsNote)nw.append(el('p','note',b.newsNote));app.append(nw);
  const wd=el('section','words');wd.id='words';wd.append(rule('Today’s words'));const dl=el('dl');(b.terms||[]).forEach(x=>dl.append(el('dt',null,x.term),el('dd',null,x.def)));wd.append(dl);
  if((b.toolkit||[]).length){wd.append(rule('Added to your toolkit'));b.toolkit.forEach(x=>wd.append(toolCard(x)))}app.append(wd);
  const more=el('div','chips');more.style.marginTop='34px';[['Glossary',()=>openGlossary(list)],['Toolkit',()=>openToolkit(list)],['Progress',openProgress],['Past days',()=>openArchive(list)]].forEach(([t,f])=>{const x=el('button',null,t);x.onclick=f;more.append(x)});app.append(more);
  app.append(el('footer',null,'Mise en Place · a daily course for running and opening a restaurant. Your streak and answers are saved only on this phone. News links go to the original reporting; lessons are a study guide, so check the official source before acting on anything legal.'));
  if(location.hash){const tgt=document.getElementById(location.hash.slice(1));tgt&&tgt.scrollIntoView()}}
async function boot(){
  const app=document.getElementById('app');
  try{const list=await fetch('briefs/index.json',{cache:'no-cache'}).then(r=>r.json());
    if(!Array.isArray(list)||!list.length){app.textContent='';app.append(el('p','err','The first edition is on its way. Check back soon.'));return}
    const want=new URLSearchParams(location.search).get('d'),t=todayStr();
    const date=list.includes(want)?want:(list.find(d=>d<=t)||list[list.length-1]);
    const b=await fetch('briefs/'+date+'.json',{cache:'no-cache'}).then(r=>r.json());
    render(b,list.filter(d=>d<=t||d===date))}
  catch(e){app.textContent='';app.append(el('p','err','Today’s edition could not load. Pull down to refresh, or try again in a minute.'))}}
boot();
})();
