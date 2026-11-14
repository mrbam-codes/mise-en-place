/* made.js: "How this brief was made", drawn as a line from market to pass.
   It reads the same data as evidence.js (the edition's "evidence" block, its sources and sources.json)
   and borrows that file's source and tier rules, so the tiers match check.py.
   Closed (how it starts): the drawing and the three exact counts, with one button to open it.
   - the drawing: a market stall and crate (one piece of produce per search), a board, knife and bin
     (one trimming per rejected lead) and a steaming plate (one dish per story kept). It is decoration;
     every number is also page text.
   Open: the sources by tier, the lessons whose figures were re-checked on the day and, behind two
   further tap-to-open panels, each rejected lead with its reason and every source with its link.
   Rules: it throws before adding anything when the edition has no usable evidence, so the page can fall
   back to evidence.js. Text goes in with textContent only. The drawing plays once when it scrolls into
   view and the counts tick up; with reduced motion (or ?still) everything is drawn finished, and timers
   always force the end state. */
(function(){
'use strict';
var NS='http://www.w3.org/2000/svg',CAP={searches:60,kept:12},DONE_MS=2600;
var TIER={original:['original reporting','#886425'],secondary:['good secondary','#c9a45e'],lead:['lead only','#e4cf9c'],unlisted:['not yet rated','#cbc3b3']};
var PRODUCE=['#ea5f36','#4f7d2e','#e9b44c','#b31e65','#7647cd','#009b37','#b48a3c','#258fec'];
var META='Tiers come from the source register in this site’s code. A lead-only source, such as a social post or a rumour site, can point to a story, but from 11 November 2026 it cannot be a story’s only source.';
var CSS=[
'.mk{margin:40px 0 0;color:var(--body);font:400 15px/1.5 var(--ui)}',
'.mk-rule{display:flex;align-items:center;gap:10px;margin:0 0 6px;color:var(--goldd);font:400 12px var(--caps);letter-spacing:.24em;text-transform:uppercase;text-align:center}',
'.mk-rule::before,.mk-rule::after{content:"";flex:1;height:1px;background:var(--goldl)}',
'.mk-title{margin:8px 0 14px;text-align:center;font:400 26px/1.15 var(--disp);color:var(--ink)}',
'.mk-sub{margin:4px 0 0;text-align:center;font-size:14px;color:var(--mute);text-wrap:balance}',
'.mk-card{background:linear-gradient(180deg,#fffdf8,#fbf3e2);border:1px solid var(--goldl);border-radius:20px;padding:14px 14px 10px;box-shadow:0 8px 22px rgba(58,46,24,.07)}',
'.mk-pic{display:block;width:100%;height:auto;overflow:visible}',
'.mk-nums{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin:6px 0 0;padding:0;list-style:none;text-align:center}',
'.mk-nums li+li{border-left:1px solid var(--goldl)}',
'.mk-nums b{display:block;font:400 40px/1 var(--disp);color:var(--ink);font-variant-numeric:tabular-nums}.mk-nums b.mk-nil{font:400 14px/40px var(--ui);color:var(--mute)}',
'.mk-nums span{display:block;margin-top:6px;font:400 12px/1.3 var(--caps);letter-spacing:.12em;text-transform:uppercase;color:var(--goldd)}',
'.mk-nums em{display:block;font:italic 400 13px/1.3 var(--ui);color:var(--mute)}',
'.mk-toggle{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:48px;margin:14px 0 4px;border-radius:99px;border:1px solid var(--goldl);background:#fff;color:var(--goldd);font:400 13px var(--caps);letter-spacing:.14em;text-transform:uppercase;cursor:pointer}',
'.mk-toggle::after{content:"";width:8px;height:8px;border:solid var(--goldd);border-width:0 1.5px 1.5px 0;transform:translateY(-2px) rotate(45deg);transition:transform .3s}',
'.mk-open .mk-toggle::after{transform:translateY(2px) rotate(225deg)}',
'.mk-fold{display:grid;grid-template-rows:0fr;transition:grid-template-rows .5s cubic-bezier(.2,.9,.2,1)}.mk-open .mk-fold{grid-template-rows:1fr}',
'.mk-fold>div{min-height:0;overflow:hidden;visibility:hidden;transition:visibility 0s .5s}.mk-open .mk-fold>div{visibility:visible;transition-delay:0s}',
'.mk-key{margin:10px 0 0;text-align:center;font-size:12px;color:var(--mute)}',
'.mk-row{margin:14px 0 0;padding:14px 0 0;border-top:1px solid var(--goldl)}',
'.mk-row h3,.mk-more h3{margin:0 0 6px;font:400 12px var(--caps);letter-spacing:.18em;text-transform:uppercase;color:var(--goldd)}',
'.mk-row p{margin:4px 0;font-size:14px}',
'.mk-bar{display:flex;gap:2px;height:12px;margin:8px 0;border-radius:99px;overflow:hidden;background:var(--ivory2)}.mk-bar i{flex:1 1 0;min-width:0;transform-origin:left center}',
'.mk-legend{display:flex;flex-wrap:wrap;gap:4px 14px;margin:0;padding:0;list-style:none;font-size:13px}',
'.mk-legend li::before{content:"";display:inline-block;width:10px;height:10px;margin-right:6px;border-radius:3px;background:var(--c);vertical-align:-1px}',
'.mk-tick{display:inline-block;width:12px;height:6px;margin-right:8px;border:solid var(--ok);border-width:0 0 2px 2px;transform:rotate(-45deg) translateY(-3px)}',
'.mk-checked{font-size:13px;color:var(--mute)}',
'.mk-more{margin-top:14px;border-top:1px solid var(--goldl)}.mk-more+.mk-more{margin-top:0}',
'.mk-more summary{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:48px;cursor:pointer;list-style:none;font:400 13px var(--caps);letter-spacing:.14em;text-transform:uppercase;color:var(--goldd)}',
'.mk-more summary::-webkit-details-marker{display:none}',
'.mk-more summary::after{content:"+";font:400 22px/1 var(--disp);transition:transform .2s}.mk-more[open] summary::after{transform:rotate(45deg)}',
'.mk-more ol,.mk-more ul{margin:0 0 12px;padding:0;list-style:none}',
'.mk-more ol li{position:relative;padding:8px 0 8px 18px;border-bottom:1px dashed var(--goldl)}',
'.mk-more ol li::before{content:"";position:absolute;left:0;top:18px;width:9px;height:2px;background:var(--no);transform:rotate(-20deg)}',
'.mk-more ol strong{display:block;font:600 15px/1.35 var(--ui);color:var(--ink)}.mk-more ol span{display:block;font-size:14px}',
'.mk-more h3{margin:12px 0 0}',
'.mk-more ul a{display:flex;align-items:center;min-height:44px;color:var(--goldd);font-size:14px;line-height:1.3;text-underline-offset:3px;overflow-wrap:anywhere}',
'.mk-note,.mk-meta{margin:0 0 12px;font-size:13px;color:var(--mute)}',
/* opening: each part of the detail rises in turn and the tier bar fills from the left. The base style is the finished state. */
'.mk-open .mk-in{animation:mk-in .5s cubic-bezier(.2,.9,.2,1) both;animation-delay:calc(var(--j,0)*90ms + .1s)}',
'.mk-open .mk-bar i{animation:mk-grow .45s cubic-bezier(.2,.9,.2,1) both;animation-delay:calc(var(--i,0)*35ms + .25s)}',
'@keyframes mk-in{from{opacity:0;transform:translateY(10px)}}@keyframes mk-grow{from{transform:scaleX(0)}}',
/* the drawing: the rules here are the finished picture; .mk-pre holds the start, .mk-run animates to the end */
'.mk-pic .mk-d,.mk-pic .mk-t,.mk-pic .mk-k,.mk-pic .mk-knife{transform-box:fill-box;transform-origin:center}',
'.mk-pic .mk-flow{stroke-dasharray:3 3;animation:mk-march .9s linear infinite}',
'.mk-pic .mk-steam{animation:mk-steam 2.6s ease-in-out infinite;animation-delay:calc(var(--i)*.7s)}',
'.mk-pic .mk-spark{transform-box:fill-box;transform-origin:center;animation:mk-spark 1.8s ease-in-out infinite;animation-delay:calc(var(--i)*.5s)}',
'.mk-pic .mk-awn{transform-box:fill-box;transform-origin:top center;animation:mk-sway 3.2s ease-in-out infinite}',
'.mk-pic .mk-knife{transform-origin:100% 100%}',
'.mk-pre .mk-d{opacity:0;transform:translateY(-34px)}.mk-pre .mk-t{opacity:0;transform:translateY(-52px) rotate(40deg)}',
'.mk-pre .mk-k{opacity:0;transform:scale(.2)}.mk-pre .mk-flow,.mk-pre .mk-steam,.mk-pre .mk-spark{opacity:0;animation:none}',
'.mk-run .mk-d{transition:opacity .25s,transform .5s cubic-bezier(.3,1.5,.5,1);transition-delay:calc(var(--i)*16ms)}',
'.mk-run .mk-knife{animation:mk-chop .34s ease-in-out 7 alternate;animation-delay:.9s}',
'.mk-run .mk-t{transition:opacity .3s,transform .6s cubic-bezier(.5,0,.75,0);transition-delay:calc(1s + var(--i)*90ms)}',
'.mk-run .mk-k{transition:opacity .3s,transform .5s cubic-bezier(.3,1.7,.5,1);transition-delay:calc(1.6s + var(--i)*90ms)}',
'.mk-done .mk-d,.mk-done .mk-t,.mk-done .mk-k{transition:none!important}',
'@keyframes mk-march{to{stroke-dashoffset:-6}}@keyframes mk-chop{to{transform:rotate(-16deg)}}',
'@keyframes mk-steam{0%{opacity:0;transform:translateY(6px)}40%{opacity:.75}100%{opacity:0;transform:translateY(-8px)}}',
'@keyframes mk-spark{0%,100%{opacity:.15;transform:scale(.6)}50%{opacity:1;transform:scale(1.1)}}',
'@keyframes mk-sway{0%,100%{transform:skewX(0)}50%{transform:skewX(-2.5deg)}}',
'.mk-still *{animation:none!important;transition:none!important}',
'@media (prefers-reduced-motion:reduce){.mk *{transition:none!important;animation:none!important}}'
].join('\n');

function el(t,c,x){var n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n}
function sv(t,a,c){var n=document.createElementNS(NS,t);for(var k in a)n.setAttribute(k,a[k]);if(c)n.setAttribute('class',c);return n}
function whole(v){return typeof v==='number'&&isFinite(v)&&v>=0&&Math.floor(v)===v}
function pl(n,one,many){return n+' '+(n===1?one:many)}
function still(){try{return matchMedia('(prefers-reduced-motion: reduce)').matches||/[?&]still\b/.test(location.search)}catch(e){return true}}
function safe(u){return /^https:\/\/[^\s"'<>]+$/.test(u||'')?u:null}
/* how many marks to draw for n, and how many each stands for (one each unless n is past the cap) */
function marks(n,cap){var per=Math.max(1,Math.ceil(n/cap));return{n:Math.ceil(n/per),per:per}}

/* the picture: market stall and crate, board with knife and bin, steaming plate; a third of the width each, over the numerals */
function picture(c){
  var g=sv('svg',{viewBox:'0 14 300 132',role:'img','aria-label':c.say},'mk-pic'),s=c.s,r=c.r,k=c.k;
  var ink='#886425',line='#e4cf9c',wood='#f3e3c3',i,j,q;
  /* soft shadows under each station */
  [[48,121,44],[150,145,26],[252,124,40]].forEach(function(e){g.append(sv('ellipse',{cx:e[0],cy:e[1],rx:e[2],ry:3,fill:'#3a2e18','fill-opacity':.07}))});
  /* the market stall: a striped awning on two poles, over the crate */
  g.append(sv('path',{d:'M8 38V52M88 38V52',stroke:ink,'stroke-width':1.2,fill:'none'}));
  var awn=sv('g',{},'mk-awn');for(i=0;i<6;i++){var x=3+i*15;awn.append(sv('path',{d:'M'+x+' 24h15v9a7.5 7.5 0 0 1-15 0z',fill:i%2?'#fffdf8':'#ad4c25',stroke:ink,'stroke-width':.6}))}g.append(awn);
  g.append(sv('rect',{x:6,y:52,width:84,height:66,rx:6,fill:wood,stroke:ink,'stroke-width':1.2}),
    sv('path',{d:'M6 74H90M6 96H90',stroke:line,'stroke-width':1,fill:'none'}),sv('path',{d:'M20 52V118M76 52V118',stroke:line,'stroke-width':1,fill:'none'}));
  if(s)for(i=0;i<s.n;i++){var row=Math.floor(i/10),col=i%10;
    var d=sv('circle',{cx:(13.8+col*7.6).toFixed(1),cy:(111-row*7.6).toFixed(1),r:3,fill:PRODUCE[(i*5+row)%PRODUCE.length]},'mk-d');d.style.setProperty('--i',i);g.append(d)}
  /* the line between stations: marching dashes and an arrowhead */
  g.append(sv('path',{d:'M94 66H106M194 66H206',stroke:ink,'stroke-width':1.2,fill:'none'},'mk-flow'),
    sv('path',{d:'M103 62l4 4-4 4M203 62l4 4-4 4',stroke:ink,'stroke-width':1.2,fill:'none','stroke-linecap':'round'}));
  /* the board with its knife, and the bin under it */
  g.append(sv('rect',{x:110,y:50,width:80,height:34,rx:9,fill:'#f6e6c4',stroke:ink,'stroke-width':1.2}),
    sv('circle',{cx:181,cy:67,r:3,fill:'#fffdf8',stroke:ink,'stroke-width':1}),
    sv('path',{d:'M118 60H168M122 74H164',stroke:line,'stroke-width':1,fill:'none'}));
  var kn=sv('g',{},'mk-knife');kn.append(sv('path',{d:'M124 62L158 44L160 50L130 66Z',fill:'#dfe2e6',stroke:'#8d9299','stroke-width':.9,'stroke-linejoin':'round'}),
    sv('path',{d:'M158 44L172 37L174 43L160 50Z',fill:'#2b2417'}));g.append(kn);
  g.append(sv('path',{d:'M126 102H174L169 143H131Z',fill:wood,stroke:ink,'stroke-width':1.2,'stroke-linejoin':'round'}),
    sv('path',{d:'M138 104L140 141M150 104V141M162 104L160 141',stroke:line,'stroke-width':1,fill:'none'}),
    sv('path',{d:'M122 102H178',stroke:ink,'stroke-width':1.8,'stroke-linecap':'round'}));
  /* each trimming is a group (moved by the animation) round a rect (tilted by its own attribute) */
  if(r)for(j=0;j<r.n;j++){var tx=134+(j%4)*8.6,ty=133-Math.floor(j/4)*6-(j%2)*1.5,t=sv('g',{},'mk-t');
    t.append(sv('rect',{x:tx,y:ty,width:7,height:2.8,rx:1.4,fill:'#a8452e',transform:'rotate('+((j*37)%50-25)+' '+(tx+3.5)+' '+(ty+1.4)+')'}));
    t.style.setProperty('--i',j);g.append(t)}
  /* the plate: a gold rim, what was kept set round it, steam above and a glint */
  g.append(sv('circle',{cx:252,cy:82,r:38,fill:'#fffdf8',stroke:ink,'stroke-width':1.2}),
    sv('circle',{cx:252,cy:82,r:33,fill:'none',stroke:'#b48a3c','stroke-width':.8}),
    sv('circle',{cx:252,cy:82,r:26,fill:'#fbf6ea',stroke:line,'stroke-width':1}));
  if(k){for(q=0;q<k.n;q++){var a=-Math.PI/2+q*2*Math.PI/k.n,rr=k.n>1?16:0,px=252+rr*Math.cos(a),py=82+rr*Math.sin(a),p=sv('g',{},'mk-k');
      p.append(sv('circle',{cx:px.toFixed(1),cy:py.toFixed(1),r:4.6,fill:'#4f7d2e'}),sv('circle',{cx:(px-1.4).toFixed(1),cy:(py-1.5).toFixed(1),r:1.5,fill:'#a9cd84'}));
      p.style.setProperty('--i',q);g.append(p)}
    [[240,0],[252,1],[264,2]].forEach(function(e){var w=sv('path',{d:'M'+e[0]+' 40c-4-5 4-7 0-12s4-7 0-11',stroke:'#c9b58a','stroke-width':1.4,fill:'none','stroke-linecap':'round'},'mk-steam');w.style.setProperty('--i',e[1]);g.append(w)});
    [[286,54,0],[222,112,1],[290,104,2]].forEach(function(e){var z=sv('path',{d:'M'+e[0]+' '+(e[1]-4)+'l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z',fill:'#b48a3c'},'mk-spark');z.style.setProperty('--i',e[2]);g.append(z)})}
  return g}

function numeral(ul,key,v,label,sub){var li=el('li');li.dataset.k=key;
  li.append(v==null?el('b','mk-nil','not logged'):el('b',null,String(v)),el('span',null,label),el('em',null,sub));ul.append(li)}
/* the counts tick up to their exact values; a timer always lands the real number */
function tickUp(ul){[].forEach.call(ul.querySelectorAll('b:not(.mk-nil)'),function(b){var n=+b.textContent,t0=Date.now(),T=1100;if(!(n>0))return;b.textContent='0';
  var iv=setInterval(function(){var p=Math.min(1,(Date.now()-t0)/T);b.textContent=String(Math.round(n*(1-Math.pow(1-p,3))));if(p>=1)clearInterval(iv)},40);
  setTimeout(function(){clearInterval(iv);b.textContent=String(n)},T+200)})}

function mount(app,b,o){
  var ev=b&&b.evidence;
  if(!ev||typeof ev!=='object'||Array.isArray(ev))throw new Error('Made: this edition has no evidence block');
  var searches=whole(ev.searches)?ev.searches:null,kept=whole(ev.kept)?ev.kept:null;
  var rj=Array.isArray(ev.rejected)?ev.rejected.filter(function(x){return x&&typeof x==='object'&&x.what}):null;
  if(searches==null&&kept==null&&rj==null)throw new Error('Made: the evidence block has no counts');
  var list=window.Evidence?Evidence.sources(b):[],note=typeof ev.note==='string'?ev.note.trim():'';
  var checked=(b.lessons||[]).filter(function(l){return l&&typeof l.checked==='string'&&l.checked.trim()});
  var nr=rj?rj.length:null,said=[];
  if(searches!=null)said.push(pl(searches,'search','searches')+' run');
  if(nr!=null)said.push(pl(nr,'lead','leads')+' rejected');
  if(kept!=null)said.push(pl(kept,'story','stories')+' kept');

  if(!document.getElementById('mk-style')){var st=el('style');st.id='mk-style';st.textContent=CSS;document.head.append(st)}
  var quiet=still(),sec=el('section','mk'+(quiet?' mk-still':''));sec.id='made';sec.setAttribute('aria-labelledby','mk-h');
  var h=el('h2','mk-rule','How this brief was made');h.id='mk-h';
  sec.append(h,el('p','mk-title','From market to pass'));
  var card=el('div','mk-card'),c={say:'From market to pass: '+said.join(', ')+'.',
    s:searches?marks(searches,CAP.searches):null,r:nr?marks(nr,8):null,k:kept?marks(kept,CAP.kept):null};
  var pic=picture(c),wrap=el('div');wrap.append(pic);card.append(wrap);
  var ul=el('ul','mk-nums');
  numeral(ul,'searches',searches,searches===1?'Search run':'Searches run','at the market');
  numeral(ul,'rejected',nr,nr===1?'Lead binned':'Leads binned','with reasons');
  numeral(ul,'kept',kept,kept===1?'Story kept':'Stories kept','on the plate');
  card.append(ul);

  /* closed until she taps: the detail folds out underneath */
  var tg=el('button','mk-toggle','See how it was made'),fold=el('div','mk-fold'),body=el('div');tg.type='button';body.id='mk-body';fold.append(body);
  tg.setAttribute('aria-expanded','false');tg.setAttribute('aria-controls','mk-body');body.inert=true;
  tg.onclick=function(){var open=!sec.classList.contains('mk-open');sec.classList.toggle('mk-open',open);tg.setAttribute('aria-expanded',String(open));tg.textContent=open?'Close':'See how it was made';body.inert=!open};
  card.append(tg,fold);
  var parts=0,add=function(n){n.classList.add('mk-in');n.style.setProperty('--j',parts++);body.append(n);return n};

  var scaled=[c.s,c.r,c.k].some(function(m){return m&&m.per>1});
  add(el('p','mk-sub','What this morning’s run brought in, what it trimmed and what reached your plate.'));
  add(el('p','mk-key',scaled?'Each mark in the drawing stands for '+[['s','search','searches'],['r','lead','leads'],['k','story','stories']].filter(function(x){return c[x[0]]&&c[x[0]].per>1})
    .map(function(x){return c[x[0]].per+' '+x[2]}).join(' or ')+'; the numbers are exact.':'One mark in the drawing for each search, lead and story.'));

  /* where the produce came from: the sources, by tier once the register loads */
  var row=el('div','mk-row'),mix=el('p',null,list.length?pl(list.length,'source','sources')+' behind today’s brief. Checking the register…':'No linked sources today.');
  var bar=el('div','mk-bar'),leg=el('ul','mk-legend');bar.setAttribute('aria-hidden','true');bar.hidden=leg.hidden=true;
  row.append(el('h3',null,'Where the produce came from'),mix,bar,leg);add(row);
  if(checked.length){var tr=el('div','mk-row');tr.append(el('h3',null,'Tasted before serving'));
    var p=el('p');p.append(el('span','mk-tick'),pl(checked.length,'lesson','lessons')+' with figures re-checked at the source today.');tr.append(p);
    checked.forEach(function(l){tr.append(el('p','mk-checked',(l.title?l.title+': ':'')+l.checked.trim()))});add(tr)}

  if(rj&&rj.length||note){var d1=el('details','mk-more');d1.append(el('summary',null,rj&&rj.length?'Why '+pl(rj.length,'lead was','leads were')+' binned':'A note from the run'));
    if(rj&&rj.length){var ol=el('ol');rj.forEach(function(x){var li=el('li');li.append(el('strong',null,String(x.what)));if(x.why)li.append(el('span',null,String(x.why)));ol.append(li)});d1.append(ol)}
    if(note)d1.append(el('p','mk-note','Run note: '+note));add(d1)}
  /* a news source is named by its story, so five links to one outlet can be told apart */
  var heads={};(b.news||[]).forEach(function(x){if(x&&x.source&&x.source.url&&x.headline)heads[x.source.url]=String(x.headline)+(x.source.name?' ('+x.source.name+')':'')});
  var d2=null,groups=null;
  if(list.length){d2=el('details','mk-more');groups=el('div');d2.append(el('summary',null,'All '+pl(list.length,'source','sources')+', by tier'),groups,el('p','mk-meta',META));add(d2)}
  sec.append(card);

  /* by: sources grouped by tier, or null while the register is loading (gone: it could not be loaded) */
  function show(by,gone){var lead=pl(list.length,'source','sources')+' behind today’s brief.',n=0;
    mix.textContent=by?lead:lead+(gone?' The register could not be loaded, so they are not rated.':' Checking the register…');
    bar.textContent=leg.textContent='';bar.hidden=leg.hidden=!by;if(groups)groups.textContent='';
    Object.keys(TIER).forEach(function(t){var xs=by?by[t]:(t==='unlisted'?list:[]);if(!xs.length)return;
      if(by){xs.forEach(function(){var i=el('i');i.style.background=TIER[t][1];i.style.setProperty('--i',n++);bar.append(i)});
        var li=el('li',null,xs.length+' '+TIER[t][0]);li.dataset.t=t;li.dataset.n=xs.length;li.style.setProperty('--c',TIER[t][1]);leg.append(li)}
      if(!groups)return;groups.append(el('h3',null,by?xs.length+' '+TIER[t][0]:'Not rated yet'));var u=el('ul');
      xs.forEach(function(s){var li=el('li'),url=safe(s.url),name=heads[s.url]||String(s.name||Evidence.host(s.url)||'Source');
        if(url){var a=el('a',null,name);a.href=url;a.target='_blank';a.rel='noopener noreferrer';li.append(a)}else li.append(el('span',null,name));u.append(li)});
      groups.append(u)})}
  if(list.length)show(null,!window.fetch);

  /* the drawing plays once, the first time it is on screen; the timer always lands the finished picture */
  var anim=!quiet&&'IntersectionObserver' in window;
  if(anim)wrap.className='mk-pre';
  app.append(sec);
  if(anim){var io=new IntersectionObserver(function(es){if(!es.some(function(e){return e.isIntersecting}))return;io.disconnect();
      void wrap.getBoundingClientRect();wrap.className='mk-run';tickUp(ul);setTimeout(function(){wrap.className='mk-done'},DONE_MS)},{threshold:.35});
    io.observe(wrap)}
  if(list.length&&window.fetch)fetch('sources.json').then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(reg){
    var by={original:[],secondary:[],lead:[],unlisted:[]};list.forEach(function(s){(by[Evidence.tierOf(reg,s.url)]||by.unlisted).push(s)});show(by)},
    function(){show(null,true)}).catch(function(){});
  return sec}

window.Made={mount:mount};
})();
