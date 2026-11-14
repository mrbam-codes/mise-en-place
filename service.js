/* Service: the Opening Day scene above the daily quiz.
   Her own restaurant on opening day. Kimchi runs the door, Charlee runs the
   kitchen. Each right answer walks two guests in and seats a table; a miss
   strolls past promising to come back. The ending depends on how many tables
   were seated, and every ending is kind.
   This file only draws. It never scores, saves or reads anything: app.js keeps
   every rule, and tests/test_quiz_page.py proves the scores match the old quiz.
   If anything here throws, app.js carries on with the plain quiz sheet.
   One word turns it off: set SCENE to 'off'. */
var Service=(function(){
'use strict';
const SCENE='opening';
const W=320,FULL=190,TOP=56,SMALL=124;
const PAL=['#ea5f36','#009b37','#258fec','#7647cd','#b31e65','#b48a3c'],SKIN=['#f1c9a5','#c98d5e','#8a5a3a','#e8b68c'];
const BANNER=['FULLY BOOKED','ONE TABLE LEFT','A STEADY SERVICE','SOFT LAUNCH','FRIENDS AND FAMILY'],NAMES=['full','last','steady','soft','family'];
const tierOf=(n,t)=>n>=t?0:n===t-1?1:n===t-2&&n>0?2:n>0?3:4;
const S=Math.sin,ease=p=>p<=0?0:p>=1?1:1-(1-p)*(1-p);

function mount(host,o){
  if(SCENE!=='opening')return null;
  const cv=document.createElement('canvas'),cx=cv.getContext('2d');if(!cx)throw new Error('no canvas');
  cv.setAttribute('role','img');cv.style.display='block';cv.style.width='100%';host.append(cv);
  const total=Math.max(1,o.total|0),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sc={seats:(o.seats||[]).slice(0,total),evs:[],end:false,tier:0};
  let now=0,alive=true;
  const label=()=>{const n=sc.seats.length;cv.setAttribute('aria-label',sc.end?'Your restaurant at the end of service: '+n+' of '+total+' tables seated. '+BANNER[sc.tier].toLowerCase()+'.':'Your restaurant on opening day: '+n+' of '+total+' tables seated. Kimchi is at the door and Charlee is in the kitchen.');host.dataset.seated=n;if(sc.end)host.dataset.end=NAMES[sc.tier]};
  function fit(){const r=Math.min(host.clientWidth||320,560),h=sc.end?FULL:SMALL,d=Math.min(devicePixelRatio||1,3);cv.style.maxWidth='560px';cv.style.margin='0 auto';cv.style.height=Math.round(r*h/W)+'px';cv.width=Math.round(r*d);cv.height=Math.round(r*h/W*d);cx.setTransform(cv.width/W,0,0,cv.width/W,0,sc.end?0:-TOP*cv.width/W)}

  const R=(x,y,w,h,f)=>{cx.fillStyle=f;cx.fillRect(x,y,w,h)};
  const C=(x,y,r,f)=>{cx.fillStyle=f;cx.beginPath();cx.arc(x,y,r,0,7);cx.fill()};
  const E=(x,y,rx,ry,f,rot)=>{cx.fillStyle=f;cx.beginPath();cx.ellipse(x,y,rx,ry,rot||0,0,7);cx.fill()};
  const L=(x1,y1,x2,y2,s,w)=>{cx.strokeStyle=s;cx.lineWidth=w||1;cx.lineCap='round';cx.beginPath();cx.moveTo(x1,y1);cx.lineTo(x2,y2);cx.stroke()};
  const TRI=(a,b,c,d,e,f,fill)=>{cx.fillStyle=fill;cx.beginPath();cx.moveTo(a,b);cx.lineTo(c,d);cx.lineTo(e,f);cx.fill()};
  const RR=(x,y,w,h,r,f)=>{cx.fillStyle=f;cx.beginPath();if(cx.roundRect)cx.roundRect(x,y,w,h,r);else cx.rect(x,y,w,h);cx.fill()};
  const TX=(s,x,y,font,f)=>{cx.font=font;cx.fillStyle=f;cx.textAlign='center';cx.fillText(s,x,y)};
  function heart(x,y,s,f){cx.fillStyle=f;cx.beginPath();cx.moveTo(x,y+s*.9);cx.bezierCurveTo(x-s*1.4,y-s*.2,x-s*.6,y-s*1.1,x,y-s*.3);cx.bezierCurveTo(x+s*.6,y-s*1.1,x+s*1.4,y-s*.2,x,y+s*.9);cx.fill()}
  function star(x,y,r,f){cx.fillStyle=f;cx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,q=i%2?r*.4:r;cx.lineTo(x+Math.cos(a)*q,y+S(a)*q)}cx.fill()}

  /* the two cats, sitting and facing us: 'k' Kimchi (cream, blue-grey points, blue eyes), 'c' Charlee (brown tabby, cream bib, green eyes) */
  function cat(x,y,s,kind,p){
    p=p||{};const K=kind==='k',fur=K?'#f3e9d8':'#9a6236',pt=K?'#5b6b8e':'#5e3a1c',eye=K?'#3f9be0':'#5fae3a',bib='#f3e3c8',ph=K?0:1.7,d=K?1:-1;
    const hop=p.hop?-Math.abs(S(now*5+ph))*6:0;
    cx.save();cx.translate(x,y+hop);cx.scale(s,s);if(p.bow)cx.rotate(p.bow);
    const sw=S(now*2.4+ph)*5;cx.strokeStyle=pt;cx.lineWidth=K?4:5.5;cx.lineCap='round';cx.beginPath();cx.moveTo(d*8,-4);cx.quadraticCurveTo(d*21,-5,d*18+sw,-21);cx.stroke();
    E(0,-9,K?9.5:11,10,fur);
    if(!K){E(0,-7,6,7.5,bib);L(-9,-12,-6,-10,pt,1.5);L(9,-12,6,-10,pt,1.5);L(-10,-7,-7,-6,pt,1.5);L(10,-7,7,-6,pt,1.5)}
    E(-4,-1,3.3,2.3,K?pt:bib);E(4,-1,3.3,2.3,K?pt:bib);
    if(p.wave){const a=S(now*9)*3;L(7,-13,14+a,-24,fur,4.5);C(14+a,-25,2.8,K?pt:bib)}
    const hy=-25;
    TRI(-9,hy-2,-7.5,hy-14,-1.5,hy-7,K?pt:fur);TRI(9,hy-2,7.5,hy-14,1.5,hy-7,K?pt:fur);
    TRI(-7.5,hy-4,-7,hy-10.5,-3.5,hy-7,'#f0a9b8');TRI(7.5,hy-4,7,hy-10.5,3.5,hy-7,'#f0a9b8');
    if(!K){TRI(-8,hy+1,-13.5,hy+4,-7,hy+6,fur);TRI(8,hy+1,13.5,hy+4,7,hy+6,fur)}
    C(0,hy,9,fur);
    if(K)E(0,hy+2,5.8,5.2,'#8d99b5');else{E(0,hy+3.5,4.5,3.4,bib);L(0,hy-8.5,0,hy-5.5,pt,1.4);L(-3,hy-8,-2.5,hy-5.5,pt,1.4);L(3,hy-8,2.5,hy-5.5,pt,1.4)}
    if(((now*.6+ph)%3.6)<.13||p.happy){cx.strokeStyle='#2b2417';cx.lineWidth=1.2;cx.beginPath();cx.arc(-3.5,hy-.5,1.8,Math.PI*1.1,Math.PI*1.9);cx.stroke();cx.beginPath();cx.arc(3.5,hy-.5,1.8,Math.PI*1.1,Math.PI*1.9);cx.stroke()}
    else{C(-3.5,hy-1,2.1,eye);C(3.5,hy-1,2.1,eye);C(-3.5,hy-1,1,'#1d1810');C(3.5,hy-1,1,'#1d1810');C(-2.9,hy-1.7,.5,'#fff');C(4.1,hy-1.7,.5,'#fff')}
    TRI(-1.2,hy+2,1.2,hy+2,0,hy+3.4,'#e58aa0');
    cx.strokeStyle='#2b2417';cx.lineWidth=.8;cx.beginPath();cx.arc(-1.3,hy+3.6,1.3,0,Math.PI);cx.stroke();cx.beginPath();cx.arc(1.3,hy+3.6,1.3,0,Math.PI);cx.stroke();
    if(p.tie){TRI(0,-15.5,-5.5,-18.5,-5.5,-12.5,'#c0392b');TRI(0,-15.5,5.5,-18.5,5.5,-12.5,'#c0392b');C(0,-15.5,1.5,'#8e2a20')}
    if(p.hat){R(-6,hy-15,12,7,'#fff');C(-5,hy-17,4.5,'#fff');C(0,hy-19,5.5,'#fff');C(5,hy-17,4.5,'#fff');L(-6,hy-9,6,hy-9,'#e4cf9c',1)}
    cx.restore()}
  function person(x,y,col,i,walk){
    const b=walk?Math.abs(S(now*9+i))*1.6:S(now*2+i)*.8,l=walk?S(now*9+i)*3:0;
    L(x-1.5,y-6,x-1.5-l,y,'#2b2417',2);L(x+1.5,y-6,x+1.5+l,y,'#2b2417',2);
    RR(x-4.5,y-19-b,9,14,4,col);C(x,y-23-b,4.5,SKIN[i%4]);cx.fillStyle='#2b2417';cx.beginPath();cx.arc(x,y-24-b,4.6,Math.PI,0);cx.fill()}
  function bubble(x,y,s){cx.font='700 12px Courier Prime,monospace';const w=cx.measureText(s).width+12;x=Math.max(w/2+3,Math.min(W-w/2-3,x));cx.strokeStyle='#a8650f';cx.lineWidth=1.2;RR(x-w/2,y-17,w,18,6,'#fbf1dc');cx.stroke();TX(s,x,y-4,'700 12px Courier Prime,monospace','#a8650f')}

  function draw(){
    const t=now,n=sc.seats.length,end=sc.end,T=sc.tier;
    const arr=sc.evs.find(e=>e.type==='seat'),pas=sc.evs.find(e=>e.type==='miss');
    const ap=arr?t-arr.t0:9,shown=n-(arr&&ap<1.5?1:0);
    const party=end&&T===0,family=end&&T===4,duo=end&&T===1,busy=end&&T===2,soft=end&&T===3;
    cx.clearRect(0,0,W,FULL);
    const g=cx.createLinearGradient(0,0,0,150);g.addColorStop(0,'#fbe9c4');g.addColorStop(1,'#fcf9f2');R(0,0,W,FULL,g);
    C(24,13,8,'#ffd27a');for(let i=0;i<8;i++){const a=t*.4+i*Math.PI/4;L(24+Math.cos(a)*11,13+S(a)*11,24+Math.cos(a)*14,13+S(a)*14,'#ffd27a',1.5)}
    [[0,9,1],[170,15,.7]].forEach(c=>{const x=(t*5*c[2]+c[0])%(W+70)-35;E(x,c[1],15*c[2],5*c[2],'rgba(255,255,255,.8)');E(x+10*c[2],c[1]-3*c[2],10*c[2],5*c[2],'rgba(255,255,255,.8)')});
    /* the building, bunting and sign */
    R(12,20,296,132,'#fffdf8');cx.strokeStyle='#e4cf9c';cx.lineWidth=1.5;cx.strokeRect(12,20,296,132);
    for(let i=0;i<15;i++){const x=20+i*20;TRI(x,21,x+12,21,x+6,30+S(t*2+i)*.8,PAL[i%6])}
    TX('LA  MAISON',160,43,'400 13px Marcellus,serif','#2b2417');
    for(let i=0;i<2;i++)star(i?212:108,38,3+S(t*3+i*2)*.8,'#b48a3c');
    if(duo||party)for(let i=0;i<6;i++){const p=(t*.5+i/6)%1;star(70+i*36,36-p*10+S(i)*3,2.5*(1-p)+.4,PAL[i])}
    /* the dining room and its tables */
    R(22,64,180,78,shown||family||!end?'#fff3d6':'#f4ecda');R(22,128,180,14,'#ecd9ae');
    const step=176/total,k=Math.min(1,step/34.5);
    for(let i=0;i<total;i++){const x=24+step*(i+.5),on=i<shown;
      L(x,64,x,72,'#886425',1);TRI(x-5*k,78,x+5*k,78,x,71,'#b48a3c');if(on)C(x,80,(6+S(t*4+i))*k,'rgba(255,210,122,.33)');
      cx.save();cx.translate(x,138);cx.scale(k,k);
      if(on){const pop=arr&&i===n-1?ease((ap-1.5)/.4):1,b=S(t*2.2+i)*.8;cx.save();cx.translate(0,-16);cx.scale(pop,pop);
        E(-9,-5,5.5,6,sc.seats[i]);C(-9,-13+b,4.5,SKIN[i%4]);cx.fillStyle='#2b2417';cx.beginPath();cx.arc(-9,-14+b,4.6,Math.PI,0);cx.fill();
        E(9,-5,5.5,6,'#2b2417');C(9,-13-b,4.5,SKIN[(i+2)%4]);cx.fillStyle='#886425';cx.beginPath();cx.arc(9,-14-b,4.6,Math.PI,0);cx.fill();cx.restore()}
      R(-12,-17,24,3,on?'#886425':'#d8cdb4');L(0,-14,0,0,on?'#886425':'#d8cdb4',2);
      if(on){E(-5,-18,4,1.4,'#fff');E(5,-18,4,1.4,'#fff');R(-1,-25,2,8,'#fffdf8');E(0,-27+S(t*13+i)*.4,1.5,2.6+S(t*11+i)*.5,'#ffaa3c')}
      cx.restore();
      if(arr&&i===n-1&&ap>1.5&&ap<2.6){const p=(ap-1.5)/1.1;for(let j=0;j<6;j++){const a=j*1.05;star(x+Math.cos(a)*p*20,104+S(a)*p*14-p*8,3*(1-p)+.5,PAL[j])}heart(x,98-p*16,4*(1-p*.5),'#e0527a')}}
    cx.strokeStyle='#b48a3c';cx.lineWidth=1.5;cx.strokeRect(22,64,180,78);L(112,64,112,142,'#b48a3c',1);
    cx.fillStyle='rgba(255,255,255,.2)';cx.beginPath();cx.moveTo(30,64);cx.lineTo(48,64);cx.lineTo(28,142);cx.lineTo(22,142);cx.lineTo(22,96);cx.fill();
    for(let i=0;i<15;i++){const x=17.5+i*19,c=i%2?'#fff':'#ad4c25';R(x,48,19,10,c);cx.fillStyle=c;cx.beginPath();cx.arc(x+9.5,58+S(t*3+i)*.6,9.5,0,Math.PI);cx.fill()}
    /* the door */
    const open=arr&&ap>1.1&&ap<2;R(210,78,30,74,'#2b2417');R(214,84,22,30,open?'#ffd27a':'#6d5a3a');C(235,120,1.6,'#e4cf9c');if(open)R(210,78,5,74,'#886425');
    /* the kitchen pass: Charlee, steam, the pan and the bell */
    R(248,70,54,48,'#fff3d6');
    for(let j=0;j<3;j++){const p=(t*.5+j/3)%1;C(262+j*13+S(t*2+j)*3,74-p*30,3+p*4,'rgba(255,255,255,'+(.7*(1-p))+')')}
    const ding=arr&&ap>1.5&&ap<2.7,flip=ding||busy;
    if(!party&&!family&&!duo){cx.save();cx.beginPath();cx.rect(248,70,54,48);cx.clip();cat(270,124,1.05,'c',{hat:1,happy:flip});
      if(flip){const p=ding?(ap-1.5)/1.2:(t*.8)%1;E(291,104,7,2.2,'#3a3226');L(284,104,278,107,'#3a3226',2);E(291,101-S(p*Math.PI)*22,4.5,1.8,'#e9b44c',p*6.3)}cx.restore()}
    cx.strokeStyle='#b48a3c';cx.lineWidth=1.5;cx.strokeRect(248,70,54,48);R(245,117,60,4,'#8d9299');
    {const sh=ding?S(t*40)*1.5:0;cx.fillStyle='#b48a3c';cx.beginPath();cx.arc(255+sh,117,4.5,Math.PI,0);cx.fill();C(255+sh,112,1.2,'#886425');if(ding){cx.strokeStyle='#b48a3c';cx.lineWidth=1;for(let j=1;j<3;j++){cx.beginPath();cx.arc(255,114,5+j*3.5,Math.PI*1.15,Math.PI*1.85);cx.stroke()}}}
    R(256,126,38,22,'#2b2417');for(let j=0;j<3;j++)L(261,132+j*5,289-j*5,132+j*5,'#e4cf9c',1);
    /* pavement and planters */
    R(0,152,W,38,'#eadfc6');for(let i=0;i<9;i++)L(i*40-10,152,i*40-22,190,'#dccfb0',1);
    [6,203,244].forEach(x=>{C(x+4,145+S(t*1.5+x)*.5,6,'#5f8f3a');C(x+1,148,4.5,'#4f7d2e');R(x-1,149,10,7,'#ad4c25')});
    if(end&&T>0&&T<4)for(let j=0;j<5-T;j++){const bx=200-j*7,by=84+j*5+S(t*1.6+j)*2.5;L(bx,by+8,206,128,'#886425',.8);E(bx,by,6,7.5,PAL[j])}
    if(party)for(let i=0;i<5;i++)person(22+i*24,171+(i%2)*5,PAL[i],i,false);
    if(soft){person(274,174,PAL[2],1,false);person(288,176,PAL[4],2,false);bubble(278,140,'next time!')}
    /* walk-ins: arriving for a right answer, strolling past for a miss */
    if(arr&&ap<1.5){const x=-16+ease(ap/1.5)*226;person(x,172,arr.col,n,true);person(x-13,174,'#2b2417',n+2,true)}
    if(pas){const p=t-pas.t0,x=-16+p/3.4*370;person(x,174,pas.col,3,true);person(x-13,176,'#78684b',1,true);L(x+7,163,x+7,146,'#78684b',1.2);cx.fillStyle='#a8650f';cx.beginPath();cx.arc(x+7,147,9,Math.PI,0);cx.fill();if(p>.8&&p<2.5)bubble(x,138,'back tomorrow!')}
    /* the cats */
    if(family){
      R(96,160,34,3,'#886425');L(113,163,113,178,'#886425',2.5);E(113,158.5,8,2,'#fff');E(113,157,5,1.5,'#8fb3c9');TRI(118,157,122,154.5,122,159.5,'#8fb3c9');R(103,151,2,8,'#fffdf8');E(104,149.5,1.5,2.8+S(t*11)*.5,'#ffaa3c');
      cat(84,180,1.15,'k',{tie:1});cat(142,180,1.15,'c',{hat:1});heart(113,126+S(t*2)*3,5,'#e0527a');
    }else{
      const bow=arr&&ap>.8&&ap<1.7?S((ap-.8)/.9*Math.PI)*.32:0;
      cat(225,172,1.15,'k',{tie:1,bow:bow,wave:!!pas||duo||busy||soft,hop:party,happy:party});
      if(party||duo){cat(262,172,1.15,'c',{hat:1,hop:party,happy:party,wave:duo});if(party)for(let j=0;j<3;j++){const p=(t*.45+j/3)%1;heart(243+S(t*2+j*2)*8,140-p*44,4*(1-p)+1,'#e0527a')}}
    }
    if(end){const txt=BANNER[T];cx.font='700 12px Courier Prime,monospace';const w=cx.measureText(txt).width+18,y=4+S(t*1.8)*.8;L(160-w/2,y+2,160-w/2-14,0,'#886425',1);L(160+w/2,y+2,160+w/2+14,0,'#886425',1);R(160-w/2,y,w,16,'#fffdf8');cx.strokeStyle='#ad4c25';cx.lineWidth=1.2;cx.strokeRect(160-w/2,y,w,16);TX(txt,160,y+12,'700 12px Courier Prime,monospace','#ad4c25')}
    if(party)for(let i=0;i<46;i++){const x=(i*53+S(t+i)*8)%W,y=(t*34+i*41)%(FULL+10)-8;cx.save();cx.translate(x,y);cx.rotate(t*3+i);R(-2,-1,4,2.4,PAL[i%6]);cx.restore()}
  }
  const safe=()=>{try{draw()}catch(e){alive=false;host.remove()}};
  const still=()=>{now=4.2;sc.evs=[];safe()};
  function tick(ms){if(!alive||!cv.isConnected){alive=false;removeEventListener('resize',onSize);return}now=ms/1000;sc.evs=sc.evs.filter(e=>now-e.t0<e.dur);if(!document.hidden)safe();requestAnimationFrame(tick)}
  function onSize(){if(!cv.isConnected)return removeEventListener('resize',onSize);fit();if(reduce)still()}
  function fire(type,col){if(reduce)return still();sc.evs=sc.evs.filter(e=>e.type!==type);sc.evs.push({type:type,col:col,t0:performance.now()/1000,dur:type==='seat'?2.8:3.4})}
  addEventListener('resize',onSize);fit();label();
  if(reduce)still();else{now=performance.now()/1000;safe();requestAnimationFrame(tick)}
  return{
    seat(col){if(sc.seats.length<total)sc.seats.push(col||'#b48a3c');label();fire('seat',col)},
    miss(col){fire('miss',col||'#b48a3c')},
    end(n){sc.end=true;sc.tier=tierOf(n,total);sc.evs=[];fit();label();if(reduce)still()},
    destroy(){alive=false;removeEventListener('resize',onSize)}};
}
return{mount:mount,SCENE:SCENE,tierOf:tierOf};
})();
