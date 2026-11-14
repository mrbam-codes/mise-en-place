/* made.js: "How this brief was made", drawn as a line from market to pass.
   It reads the same data as evidence.js (the edition's "evidence" block, its sources and sources.json)
   and borrows that file's source and tier rules, so the tiers match check.py.
   What it shows:
   - a small drawing: a market crate (one dot per search), a board and bin (one trimming per rejected
     lead) and a plate (one dot per story kept). It is decoration; every number is also page text;
   - the exact counts as large numerals, the lessons whose figures were re-checked on the day,
     the sources by tier, and, behind two tap-to-open panels, each rejected lead with its reason
     and every source with its link.
   Rules: it throws before adding anything when the edition has no usable evidence, so the page can fall
   back to evidence.js. Text goes in with textContent only. The drawing plays once when it scrolls into
   view; with reduced motion (or ?still) it is drawn finished, and a timer always forces the end state. */
(function(){
'use strict';
var NS='http://www.w3.org/2000/svg',CAP={searches:60,kept:12},DONE_MS=2600;
var TIER={original:['original reporting','#886425'],secondary:['good secondary','#c9a45e'],lead:['lead only','#e4cf9c'],unlisted:['not yet rated','#cbc3b3']};
var META='Tiers come from the source register in this site’s code. A lead-only source, such as a social post or a rumour site, can point to a story, but from 11 November 2026 it cannot be a story’s only source.';
var CSS=[
'.mk{margin:40px 0 0;color:var(--body);font:400 15px/1.5 var(--ui)}',
'.mk-rule{display:flex;align-items:center;gap:10px;margin:0 0 6px;color:var(--goldd);font:400 12px var(--caps);letter-spacing:.24em;text-transform:uppercase;text-align:center}',
'.mk-rule::before,.mk-rule::after{content:"";flex:1;height:1px;background:var(--goldl)}',
'.mk-title{margin:8px 0 2px;text-align:center;font:400 26px/1.15 var(--disp);color:var(--ink)}',
'.mk-sub{margin:0 0 16px;text-align:center;font-size:14px;color:var(--mute);text-wrap:balance}',
'.mk-card{background:var(--card);border:1px solid var(--goldl);border-radius:16px;padding:18px 14px 6px}',
'.mk-pic{display:block;width:100%;height:auto;overflow:visible}',
'.mk-nums{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;margin:8px 0 0;padding:0;list-style:none;text-align:center}',
'.mk-nums b{display:block;font:400 38px/1 var(--disp);color:var(--ink)}.mk-nums b.mk-nil{font:400 14px/38px var(--ui);color:var(--mute)}',
'.mk-nums span{display:block;margin-top:6px;font:400 12px/1.3 var(--caps);letter-spacing:.12em;text-transform:uppercase;color:var(--goldd)}',
'.mk-nums em{display:block;font:italic 400 13px/1.3 var(--ui);color:var(--mute)}',
'.mk-key{margin:10px 0 0;text-align:center;font-size:12px;color:var(--mute)}',
'.mk-row{margin:14px 0 0;padding:14px 0 0;border-top:1px solid var(--goldl)}',
'.mk-row h3,.mk-more h3{margin:0 0 6px;font:400 12px var(--caps);letter-spacing:.18em;text-transform:uppercase;color:var(--goldd)}',
'.mk-row p{margin:4px 0;font-size:14px}',
'.mk-bar{display:flex;gap:2px;height:10px;margin:8px 0;border-radius:99px;overflow:hidden;background:var(--ivory2)}.mk-bar i{flex:1 1 0;min-width:0}',
'.mk-legend{display:flex;flex-wrap:wrap;gap:4px 14px;margin:0;padding:0;list-style:none;font-size:13px}',
'.mk-legend li::before{content:"";display:inline-block;width:10px;height:10px;margin-right:6px;border-radius:3px;background:var(--c);vertical-align:-1px}',
'.mk-tick{display:inline-block;width:12px;height:6px;margin-right:8px;border:solid var(--ok);border-width:0 0 2px 2px;transform:rotate(-45deg) translateY(-3px)}',
'.mk-checked{font-size:13px;color:var(--mute)}',
'.mk-more{border-top:1px solid var(--goldl)}',
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
/* the drawing: the rules here are the finished picture; .mk-pre holds the start, .mk-run animates to the end */
'.mk-pic .mk-d,.mk-pic .mk-t,.mk-pic .mk-k{transform-box:fill-box;transform-origin:center}',
'.mk-pic .mk-flow{stroke-dasharray:3 3}',
'.mk-pre .mk-d{opacity:0;transform:translateY(-6px)}.mk-pre .mk-t{opacity:0;transform:translateY(-50px) rotate(40deg)}',
'.mk-pre .mk-k{opacity:0;transform:scale(.2)}.mk-pre .mk-flow{opacity:0}',
'.mk-run .mk-d{transition:opacity .35s,transform .35s;transition-delay:calc(var(--i)*14ms)}',
'.mk-run .mk-flow{transition:opacity .5s .7s}',
'.mk-run .mk-t{transition:opacity .3s,transform .6s cubic-bezier(.5,0,.75,0);transition-delay:calc(1s + var(--i)*90ms)}',
'.mk-run .mk-k{transition:opacity .3s,transform .45s cubic-bezier(.3,1.6,.5,1);transition-delay:calc(1.5s + var(--i)*80ms)}',
'.mk-done *{transition:none!important}',
'@media (prefers-reduced-motion:reduce){.mk *{transition:none!important}}'
].join('\n');

function el(t,c,x){var n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n}
function sv(t,a,c){var n=document.createElementNS(NS,t);for(var k in a)n.setAttribute(k,a[k]);if(c)n.setAttribute('class',c);return n}
function whole(v){return typeof v==='number'&&isFinite(v)&&v>=0&&Math.floor(v)===v}
function pl(n,one,many){return n+' '+(n===1?one:many)}
function still(){try{return matchMedia('(prefers-reduced-motion: reduce)').matches||/[?&]still\b/.test(location.search)}catch(e){return true}}
function safe(u){return /^https:\/\/[^\s"'<>]+$/.test(u||'')?u:null}
/* how many marks to draw for n, and how many each stands for (one each unless n is past the cap) */
function marks(n,cap){var per=Math.max(1,Math.ceil(n/cap));return{n:Math.ceil(n/per),per:per}}

/* the picture: crate, board and bin, plate; one third of the width each, to sit over the numerals */
function picture(c){
  var g=sv('svg',{viewBox:'0 36 300 110',role:'img','aria-label':c.say},'mk-pic'),s=c.s,r=c.r,k=c.k;
  var ink='#886425',line='#e4cf9c',paper='#f4ecda';
  /* the market crate, filled from the bottom */
  g.append(sv('rect',{x:6,y:50,width:84,height:68,rx:7,fill:paper,stroke:ink,'stroke-width':1.2}),
    sv('path',{d:'M6 62H90',stroke:line,'stroke-width':1,fill:'none'}),sv('rect',{x:38,y:54,width:20,height:4,rx:2,fill:'none',stroke:ink,'stroke-width':1}));
  if(s)for(var i=0;i<s.n;i++){var row=Math.floor(i/10),col=i%10;
    var d=sv('circle',{cx:(13.8+col*7.6).toFixed(1),cy:(110-row*7.6).toFixed(1),r:2.6,fill:'#b48a3c'},'mk-d');d.style.setProperty('--i',i);g.append(d)}
  /* the line between stations */
  g.append(sv('path',{d:'M94 66H106M194 66H206',stroke:ink,'stroke-width':1.2,fill:'none'},'mk-flow'),
    sv('path',{d:'M103 62l4 4-4 4M203 62l4 4-4 4',stroke:ink,'stroke-width':1.2,fill:'none','stroke-linecap':'round'},'mk-flow'));
  /* the board, and the bin under it */
  g.append(sv('rect',{x:110,y:48,width:80,height:36,rx:9,fill:'#fbf3e2',stroke:ink,'stroke-width':1.2}),
    sv('circle',{cx:180,cy:66,r:3.2,fill:'none',stroke:ink,'stroke-width':1}),
    sv('path',{d:'M150 52V80',stroke:line,'stroke-width':1,'stroke-dasharray':'2 3'}),
    sv('path',{d:'M126 100H174L169 142H131Z',fill:paper,stroke:ink,'stroke-width':1.2,'stroke-linejoin':'round'}),
    sv('path',{d:'M122 100H178',stroke:ink,'stroke-width':1.6,'stroke-linecap':'round'}));
  /* each trimming is a group (moved by the animation) round a rect (tilted by its own attribute) */
  if(r)for(var j=0;j<r.n;j++){var tx=134+(j%4)*8.6,ty=132-Math.floor(j/4)*6-(j%2)*1.5,t=sv('g',{},'mk-t');
    t.append(sv('rect',{x:tx,y:ty,width:7,height:2.6,rx:1.3,fill:'#a8452e',transform:'rotate('+((j*37)%50-25)+' '+(tx+3.5)+' '+(ty+1.3)+')'}));
    t.style.setProperty('--i',j);g.append(t)}
  /* the plate, with what was kept set round the rim */
  g.append(sv('circle',{cx:252,cy:80,r:40,fill:'#fffdf8',stroke:ink,'stroke-width':1.2}),
    sv('circle',{cx:252,cy:80,r:29,fill:'none',stroke:line,'stroke-width':1}));
  if(k)for(var q=0;q<k.n;q++){var a=-Math.PI/2+q*2*Math.PI/k.n,rr=k.n>1?17:0;
    var p=sv('circle',{cx:(252+rr*Math.cos(a)).toFixed(1),cy:(80+rr*Math.sin(a)).toFixed(1),r:4.2,fill:'#4f7d2e'},'mk-k');p.style.setProperty('--i',q);g.append(p)}
  return g}

function numeral(ul,key,v,label,sub){var li=el('li');li.dataset.k=key;
  li.append(v==null?el('b','mk-nil','not logged'):el('b',null,String(v)),el('span',null,label),el('em',null,sub));ul.append(li)}

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
  var sec=el('section','mk');sec.id='made';sec.setAttribute('aria-labelledby','mk-h');
  var h=el('h2','mk-rule','How this brief was made');h.id='mk-h';
  sec.append(h,el('p','mk-title','From market to pass'),el('p','mk-sub','What this morning’s run brought in, what it trimmed and what reached your plate.'));
  var card=el('div','mk-card'),c={say:'From market to pass: '+said.join(', ')+'.',
    s:searches?marks(searches,CAP.searches):null,r:nr?marks(nr,8):null,k:kept?marks(kept,CAP.kept):null};
  var pic=picture(c),wrap=el('div');wrap.append(pic);card.append(wrap);
  var ul=el('ul','mk-nums');
  numeral(ul,'searches',searches,searches===1?'Search run':'Searches run','at the market');
  numeral(ul,'rejected',nr,nr===1?'Lead binned':'Leads binned','with reasons');
  numeral(ul,'kept',kept,kept===1?'Story kept':'Stories kept','on the plate');
  card.append(ul);
  var scaled=[c.s,c.r,c.k].some(function(m){return m&&m.per>1});
  card.append(el('p','mk-key',scaled?'Each mark in the drawing stands for '+[['s','search','searches'],['r','lead','leads'],['k','story','stories']].filter(function(x){return c[x[0]]&&c[x[0]].per>1})
    .map(function(x){return c[x[0]].per+' '+x[2]}).join(' or ')+'; the numbers are exact.':'One mark in the drawing for each search, lead and story.'));

  /* where the produce came from: the sources, by tier once the register loads */
  var row=el('div','mk-row'),mix=el('p',null,list.length?pl(list.length,'source','sources')+' behind today’s brief. Checking the register…':'No linked sources today.');
  var bar=el('div','mk-bar'),leg=el('ul','mk-legend');bar.setAttribute('aria-hidden','true');bar.hidden=leg.hidden=true;
  row.append(el('h3',null,'Where the produce came from'),mix,bar,leg);card.append(row);
  if(checked.length){var tr=el('div','mk-row');tr.append(el('h3',null,'Tasted before serving'));
    var p=el('p');p.append(el('span','mk-tick'),pl(checked.length,'lesson','lessons')+' with figures re-checked at the source today.');tr.append(p);
    checked.forEach(function(l){tr.append(el('p','mk-checked',(l.title?l.title+': ':'')+l.checked.trim()))});card.append(tr)}

  if(rj&&rj.length||note){var d1=el('details','mk-more');d1.append(el('summary',null,rj&&rj.length?'Why '+pl(rj.length,'lead was','leads were')+' binned':'A note from the run'));
    if(rj&&rj.length){var ol=el('ol');rj.forEach(function(x){var li=el('li');li.append(el('strong',null,String(x.what)));if(x.why)li.append(el('span',null,String(x.why)));ol.append(li)});d1.append(ol)}
    if(note)d1.append(el('p','mk-note','Run note: '+note));card.append(d1)}
  /* a news source is named by its story, so five links to one outlet can be told apart */
  var heads={};(b.news||[]).forEach(function(x){if(x&&x.source&&x.source.url&&x.headline)heads[x.source.url]=String(x.headline)+(x.source.name?' ('+x.source.name+')':'')});
  var d2=null,groups=null;
  if(list.length){d2=el('details','mk-more');groups=el('div');d2.append(el('summary',null,'All '+pl(list.length,'source','sources')+', by tier'),groups,el('p','mk-meta',META));card.append(d2)}
  sec.append(card);

  /* by: sources grouped by tier, or null while the register is loading (gone: it could not be loaded) */
  function show(by,gone){var lead=pl(list.length,'source','sources')+' behind today’s brief.';
    mix.textContent=by?lead:lead+(gone?' The register could not be loaded, so they are not rated.':' Checking the register…');
    bar.textContent=leg.textContent='';bar.hidden=leg.hidden=!by;if(groups)groups.textContent='';
    Object.keys(TIER).forEach(function(t){var xs=by?by[t]:(t==='unlisted'?list:[]);if(!xs.length)return;
      if(by){xs.forEach(function(){var i=el('i');i.style.background=TIER[t][1];bar.append(i)});
        var li=el('li',null,xs.length+' '+TIER[t][0]);li.dataset.t=t;li.dataset.n=xs.length;li.style.setProperty('--c',TIER[t][1]);leg.append(li)}
      if(!groups)return;groups.append(el('h3',null,by?xs.length+' '+TIER[t][0]:'Not rated yet'));var u=el('ul');
      xs.forEach(function(s){var li=el('li'),url=safe(s.url),name=heads[s.url]||String(s.name||Evidence.host(s.url)||'Source');
        if(url){var a=el('a',null,name);a.href=url;a.target='_blank';a.rel='noopener noreferrer';li.append(a)}else li.append(el('span',null,name));u.append(li)});
      groups.append(u)})}
  if(list.length)show(null,!window.fetch);

  /* the drawing plays once, the first time it is on screen; the timer always lands the finished picture */
  var anim=!still()&&'IntersectionObserver' in window;
  if(anim)wrap.className='mk-pre';
  app.append(sec);
  if(anim){var io=new IntersectionObserver(function(es){if(!es.some(function(e){return e.isIntersecting}))return;io.disconnect();
      void wrap.getBoundingClientRect();wrap.className='mk-run';setTimeout(function(){wrap.className='mk-done'},DONE_MS)},{threshold:.35});
    io.observe(wrap)}
  if(list.length&&window.fetch)fetch('sources.json').then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(reg){
    var by={original:[],secondary:[],lead:[],unlisted:[]};list.forEach(function(s){(by[Evidence.tierOf(reg,s.url)]||by.unlisted).push(s)});show(by)},
    function(){show(null,true)}).catch(function(){});
  return sec}

window.Made={mount:mount};
})();
