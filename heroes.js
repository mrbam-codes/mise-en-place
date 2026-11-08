/* Mise en Place opening animations. The ten approved heroes (round 3), drawn
   live on a canvas with no images. startHero(canvas, id, data) runs one of
   them, driven by data: {day, total, streak, areas: [three colours]}. */
(function(){
let DAY=1, TOTAL=221, STREAK=1, AREA=[];
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches || location.search.includes('still');
const rnd=(a,b)=>a+Math.random()*(b-a), clamp=(t)=>t<0?0:t>1?1:t, ease=t=>1-Math.pow(1-clamp(t),3);
const pop=t=>t<=0?0:t>=1?1:ease(t)+Math.sin(t*9)*Math.exp(-t*5)*.3;
const F={};
const shadow=(ctx,x,y,rx,ry,a=.12)=>{ctx.fillStyle=`rgba(30,40,55,${a})`;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,7);ctx.fill();};

/* 1 ---- the plate (kept) ---- */
F.plate=((ctx,W,H)=>{
  const cx=W*.66, cy=H*.42, R=H*.33, CYC=9; let T=0;
  const herbs=[...Array(STREAK)].map(()=>({a:rnd(.05,.95),rot:rnd(0,6),d:rnd(0,.15),o:rnd(-1,1)}));
  const sw=u=>{const a=-2.6+u*3.1;return{x:cx+Math.cos(a)*R*.5,y:cy+Math.sin(a)*R*.5+Math.sin(u*3)*5}};
  return {still:330,step(dt){T=(T+dt)%CYC},
    draw(){
      const p=T/CYC, fade=p>.88?1-(p-.88)/.12:1;
      ctx.fillStyle='#e9ecef'; ctx.fillRect(0,0,W,H);
      shadow(ctx,cx+8,cy+12,R*1.02,R);
      let g=ctx.createRadialGradient(cx-R*.3,cy-R*.3,R*.1,cx,cy,R); g.addColorStop(0,'#fff'); g.addColorStop(1,'#e3e6ea'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.fill();
      ctx.strokeStyle='rgba(120,130,145,.25)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,cy,R*.68,0,7); ctx.stroke();
      ctx.globalAlpha=fade;
      const sp=ease(p/.35);
      for(let u=0;u<sp;u+=.004){const q=sw(u), w=Math.sin(Math.PI*Math.min(u/sp,1))*R*.075*(.55+.45*Math.sin(Math.PI*u));
        ctx.fillStyle=`rgba(${110+u*20|0},20,52,.9)`; ctx.beginPath(); ctx.arc(q.x,q.y,Math.max(w,.6),0,7); ctx.fill();}
      [.18,.52,.86].forEach((u,i)=>{const s=pop((p-.36-i*.05)/.12); if(s<=0) return; const q=sw(u), r=R*.07*s;
        ctx.fillStyle=AREA[i].c; ctx.beginPath(); ctx.arc(q.x,q.y-R*.11,r,0,7); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(q.x-r*.3,q.y-R*.11-r*.3,r*.25,0,7); ctx.fill();});
      herbs.forEach(h=>{const t=ease((p-.55-h.d)/.2); if(t<=0) return; const q=sw(h.a), x=q.x+h.o*R*.12, y=(q.y-R*.18)-(1-t)*R*1.2;
        ctx.save(); ctx.translate(x,y); ctx.rotate(h.rot+(1-t)*3); ctx.fillStyle='#4f7d2e'; ctx.beginPath(); ctx.ellipse(0,0,4.5,2,0,0,7); ctx.fill(); ctx.restore();});
      ctx.globalAlpha=1;
    }};
});

/* 2 ---- the pour, in daylight ---- */
F.pour=((ctx,W,H)=>{
  const cx=W*.72, top=H*.1, bot=H*.68, hw=W*.095, B=[], FILL=.15+.8*DAY/TOTAL; let lvl=0,T=0;
  const bokeh=[...Array(12)].map(()=>({x:rnd(0,W),y:rnd(0,H),r:rnd(10,34),v:rnd(3,8),a:rnd(.08,.18)}));
  const glass=()=>{ctx.beginPath();ctx.moveTo(cx-hw,top);ctx.bezierCurveTo(cx-hw,bot-30,cx-hw*.55,bot,cx,bot+6);ctx.bezierCurveTo(cx+hw*.55,bot,cx+hw,bot-30,cx+hw,top);};
  const surf=()=>bot-(bot-top)*lvl;
  return {still:300,step(dt){T+=dt; if(T>.4) lvl+=(FILL-lvl)*dt*.8;
      for(let k=0;k<STREAK;k++) if(Math.random()<dt*7) B.push({x:cx+rnd(-hw*.35,hw*.35),y:bot-4,r:rnd(.8,2),v:rnd(15,30),w:rnd(0,6)});
      const s=surf(); for(const b of B){b.v+=60*dt;b.y-=b.v*dt;b.w+=dt*5} for(let i=B.length-1;i>=0;i--) if(B[i].y<s+2) B.splice(i,1);
      for(const k of bokeh){k.y-=k.v*dt; if(k.y<-40){k.y=H+40;k.x=rnd(0,W)}}},
    draw(){
      const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#fdfaf3'); g.addColorStop(1,'#f1e8d6'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      for(const k of bokeh){ctx.fillStyle=`rgba(226,190,110,${k.a})`;ctx.beginPath();ctx.arc(k.x,k.y,k.r,0,7);ctx.fill();}
      shadow(ctx,cx+6,H*.905,hw*1.3,6,.14);
      const s=surf();
      ctx.save(); glass(); ctx.closePath(); ctx.fillStyle='rgba(255,255,255,.45)'; ctx.fill(); ctx.clip();
      const lg=ctx.createLinearGradient(cx-hw,0,cx+hw,0); lg.addColorStop(0,'#d4a646'); lg.addColorStop(.45,'#f7dc8e'); lg.addColorStop(1,'#c9993a');
      ctx.fillStyle=lg; ctx.fillRect(cx-hw,s,hw*2,bot-s+10);
      for(const b of B){ctx.strokeStyle='rgba(255,252,236,.95)';ctx.lineWidth=.9;ctx.beginPath();ctx.arc(b.x+Math.sin(b.w)*1.2,b.y,b.r,0,7);ctx.stroke();}
      for(let x=cx-hw;x<cx+hw;x+=4){ctx.fillStyle='rgba(255,252,240,.95)';ctx.beginPath();ctx.arc(x+rnd(-1,1),s+rnd(-1,2),rnd(1.5,3),0,7);ctx.fill();}
      ctx.fillStyle='rgba(255,255,255,.35)'; ctx.fillRect(cx-hw*.7,top,hw*.16,bot-top);
      ctx.restore();
      ctx.strokeStyle='rgba(110,92,60,.5)'; ctx.lineWidth=1.3; glass(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx,bot+6); ctx.lineTo(cx,H*.9); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx,H*.9,hw*.95,5,0,0,7); ctx.stroke();
      if(lvl<FILL-.01){ctx.strokeStyle='rgba(214,166,70,.9)';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(cx-hw*.2,0);ctx.lineTo(cx-hw*.2,s);ctx.stroke();}
    }};
});

/* 5 ---- the tower: macarons stacking ---- */
F.macaron=((ctx,W,H)=>{
  const cx=W*.7, baseY=H*.64, mw=34, mh=24, CYC=11; let T=0;
  const PAST=['#f6b8c4','#f3dfa8','#bcd9a6','#cdbff0'];
  const rows=[]; let left=STREAK, n=Math.ceil((-1+Math.sqrt(1+8*STREAK))/2); while(left>0){const k=Math.min(n,left); rows.push(k); left-=k; n--;}
  const M=[]; rows.forEach((k,r)=>{for(let i=0;i<k;i++) M.push({x:cx+(i-(k-1)/2)*(mw+3),y:baseY-10-r*(mh+2)-mh/2,c:PAST[(M.length+r)%4]})});
  const mac=(x,y,c,a)=>{ctx.globalAlpha=a; ctx.fillStyle=c; ctx.beginPath(); ctx.ellipse(x,y-6,mw/2,7,0,0,7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x,y+6,mw/2,7,0,0,7); ctx.fill();
    ctx.fillStyle='#fffaf3'; ctx.fillRect(x-mw/2+3,y-2,mw-6,4); ctx.fillStyle='rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(x-6,y-9,6,2,0,0,7); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.06)'; ctx.beginPath(); ctx.moveTo(x-mw/2+2,y-1); for(let k=0;k<=8;k++) ctx.lineTo(x-mw/2+2+k*(mw-4)/8,y-1+(k%2?1.5:0)); ctx.stroke(); ctx.globalAlpha=1;};
  return {still:480,step(dt){T=(T+dt)%CYC},
    draw(){
      const p=T/CYC, fade=p>.9?1-(p-.9)/.1:1;
      const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#fbf3f4'); g.addColorStop(1,'#f3e4e7'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      shadow(ctx,cx,baseY+20,rows[0]*(mw+3)/2+18,6,.1);
      ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.roundRect(cx-rows[0]*(mw+3)/2-14,baseY-6,rows[0]*(mw+3)+28,6,3); ctx.fill(); ctx.strokeStyle='rgba(180,150,160,.4)'; ctx.stroke();
      ctx.fillStyle='#fff'; ctx.fillRect(cx-3,baseY,6,18); ctx.beginPath(); ctx.ellipse(cx,baseY+19,22,4,0,0,7); ctx.fill(); ctx.stroke();
      M.forEach((m,i)=>{const t=(p-.04-i*.045)/.09; if(t<=0) return; const y=m.y-(1-ease(t))*H*.9+(t>1?0:Math.sin(clamp(t)*Math.PI)*0); mac(m.x,y,m.c,fade);});
    }};
});


const fadeOf=p=>p>.92?1-(p-.92)/.08:1;
const grad=(ctx,x0,y0,x1,y1,stops)=>{const g=ctx.createLinearGradient(x0,y0,x1,y1); stops.forEach((c,i)=>g.addColorStop(i/(stops.length-1),c)); return g;};
const bgv=(ctx,W,H,a,b)=>{ctx.fillStyle=grad(ctx,0,0,0,H,[a,b]); ctx.fillRect(0,0,W,H);};

/* ---- Champagne tower ---- */
F.tower=((ctx,W,H)=>{
  const CYC=11, cx=W*.68, cw=Math.min(W*.115,46), bh=cw*.3, st=cw*.42, rowH=bh+st+7, top=H*.24; let T=0;
  const C=[]; [1,2,3,4].forEach((n,r)=>{for(let i=0;i<n;i++) C.push({x:cx+(i-(n-1)/2)*cw*1.06,y:top+r*rowH,r,b:[...Array(4)].map(()=>({u:rnd(-.6,.6),v:rnd(.2,.9),ph:rnd(0,6)}))})});
  const fillAt=(r,p)=>clamp((p-.08-r*.15)/.15);
  const mouth={x:cx-cw*.25,y:top-34};
  function coupe(c,f){const {x,y}=c, rx=cw/2;
    ctx.fillStyle='rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(x,y,rx,bh,0,0,Math.PI); ctx.fill();
    if(f>0){ctx.save(); ctx.beginPath(); ctx.ellipse(x,y,rx,bh,0,0,Math.PI); ctx.clip(); const ly=y+bh*(1-f);
      ctx.fillStyle=grad(ctx,x-rx,0,x+rx,0,['#d6a548','#f7dc8f','#cf9b3d']); ctx.fillRect(x-rx,ly,cw,bh*2);
      c.b.forEach(b=>{ctx.fillStyle=`rgba(255,252,236,${.5+.5*Math.sin(T*6+b.ph)})`; ctx.beginPath(); ctx.arc(x+b.u*rx*.7,ly+(y+bh-ly)*b.v,1,0,7); ctx.fill();});
      ctx.restore(); const w=rx*Math.sqrt(Math.max(0,1-Math.pow((ly-y)/bh,2))); ctx.fillStyle='rgba(255,248,226,.95)'; ctx.beginPath(); ctx.ellipse(x,ly,w,1.6,0,0,7); ctx.fill();}
    ctx.strokeStyle='rgba(150,125,90,.45)'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(x,y,rx,bh,0,0,Math.PI); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x,y,rx,1.4,0,0,7); ctx.stroke();
    ctx.fillStyle='rgba(225,215,200,.9)'; ctx.fillRect(x-1.2,y+bh,2.4,st); ctx.beginPath(); ctx.ellipse(x,y+bh+st,cw*.27,2.4,0,0,7); ctx.fill();}
  return {still:560,step(dt){T=(T+dt)%CYC},
    draw(){const p=T/CYC; bgv(ctx,W,H,'#fdf7f2','#f5e5de');
      shadow(ctx,cx,top+4*rowH-2,cw*2.5,7,.1);
      ctx.globalAlpha=fadeOf(p);
      const pour=p>.04&&p<.7;
      ctx.save(); ctx.translate(mouth.x,mouth.y); ctx.rotate(Math.PI+.62);
      ctx.fillStyle=grad(ctx,0,-14,0,14,['#3d5c48','#22382b','#3d5c48']); ctx.beginPath(); ctx.roundRect(36,-15,92,30,10); ctx.fill(); ctx.beginPath(); ctx.moveTo(4,-5); ctx.lineTo(36,-11); ctx.lineTo(36,11); ctx.lineTo(4,5); ctx.fill();
      ctx.fillStyle=grad(ctx,0,-6,0,6,['#e8cf8a','#b8913f']); ctx.fillRect(0,-5.5,30,11); ctx.fillStyle='#f4ecdc'; ctx.fillRect(60,-11,40,22); ctx.restore();
      if(pour){ctx.strokeStyle='rgba(226,180,80,.9)'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(mouth.x,mouth.y); ctx.quadraticCurveTo(mouth.x+6,mouth.y+12,C[0].x-2,C[0].y+bh*.4); ctx.stroke();}
      C.forEach(c=>coupe(c,fillAt(c.r,p)));
      for(let r=1;r<4;r++){const f=fillAt(r,p); if(f<=0||f>=1) continue; C.filter(c=>c.r===r-1).forEach(c=>[-1,1].forEach(sd=>{for(let k=0;k<2;k++){const yy=c.y+((T*140+k*rowH/2)%rowH); ctx.fillStyle='rgba(230,186,90,.85)'; ctx.beginPath(); ctx.arc(c.x+sd*cw*.52,yy,1.6,0,7); ctx.fill();}}));}
      ctx.globalAlpha=1;}};
});

/* ---- Pancake stack (brunch) ---- */
F.pancake=((ctx,W,H)=>{
  const CYC=11, cx=W*.67, base=H*.62, pw=H*.27, ph=H*.032, N=Math.max(3,Math.min(6,Math.round(STREAK/2))); let T=0;
  const drips=[...Array(3)].map((_,i)=>({x:cx-pw*.6+i*pw*.6,len:rnd(.35,.7),d:rnd(0,.05)}));
  const berries=[...Array(6)].map((_,i)=>({x:cx-pw*1.25+i*pw*.5+rnd(-6,6),y:base+rnd(2,10)}));
  return {still:600,step(dt){T=(T+dt)%CYC},
    draw(){const p=T/CYC; bgv(ctx,W,H,'#f1f6fa','#e3ecf3');
      shadow(ctx,cx,base+10,pw*1.55,10,.1); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(cx,base+2,pw*1.5,14,0,0,7); ctx.fill();
      ctx.globalAlpha=fadeOf(p);
      let topY=base;
      for(let i=0;i<N;i++){const t=ease((p-.03-i*.06)/.09); if(t<=0) break; const y=base-6-i*ph*1.15-(1-t)*H*.7;
        ctx.fillStyle='#c98c45'; ctx.beginPath(); ctx.ellipse(cx,y+ph*.5,pw,ph*.75,0,0,Math.PI); ctx.fill(); ctx.fillRect(cx-pw,y-ph*.25,pw*2,ph*.75);
        ctx.fillStyle=grad(ctx,0,y-ph,0,y+ph*.2,['#f2c57a','#e2a85e']); ctx.beginPath(); ctx.ellipse(cx,y-ph*.25,pw,ph*.75,0,0,7); ctx.fill(); topY=y-ph*.25;}
      const syr=ease((p-.5)/.12); if(syr>0){ctx.fillStyle='rgba(178,98,28,.85)'; ctx.beginPath(); ctx.ellipse(cx,topY,pw*.85*syr,ph*.6*syr,0,0,7); ctx.fill();
        drips.forEach(d=>{const l=ease((p-.58-d.d)/.18)*d.len*(base-topY-6); if(l>0){ctx.beginPath(); ctx.roundRect(d.x-3,topY,6,l,3); ctx.fill(); ctx.beginPath(); ctx.arc(d.x,topY+l,4,0,7); ctx.fill();}});}
      if(p>.44&&p<.62){ctx.strokeStyle='rgba(178,98,28,.85)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx+4,0); ctx.lineTo(cx+4,topY); ctx.stroke();}
      const b=pop((p-.44)/.08); if(b>0){ctx.fillStyle='#fbe79a'; ctx.beginPath(); ctx.roundRect(cx-12*b,topY-14*b,24*b,12*b,3); ctx.fill(); ctx.fillStyle='#fff6c9'; ctx.fillRect(cx-12*b,topY-14*b,24*b,3*b);}
      berries.forEach((bb,i)=>{const s=pop((p-.7-i*.02)/.08); if(s<=0) return; const r=6*s; const g=ctx.createRadialGradient(bb.x-2,bb.y-2,1,bb.x,bb.y,r); g.addColorStop(0,'#7182c4'); g.addColorStop(1,'#33407e'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(bb.x,bb.y,r,0,7); ctx.fill();});
      ctx.globalAlpha=1;}};
});

/* ---- Gelato ---- */
F.gelato=((ctx,W,H)=>{
  const CYC=10, cx=W*.68, tipY=H*.74, topY=H*.5, cwid=H*.17, r=H*.105; let T=0;
  const S=[{c:'#b9d79b',y:topY-r*.35},{c:'#f4a7b4',y:topY-r*1.35},{c:'#f6e7bf',y:topY-r*2.3}];
  const scoop=(x,y,c,sq)=>{ctx.save(); ctx.translate(x,y); ctx.scale(1+sq*.12,1-sq*.12); const g=ctx.createRadialGradient(-r*.35,-r*.4,2,0,0,r*1.1); g.addColorStop(0,'#fff'); g.addColorStop(.25,c); g.addColorStop(1,c); ctx.fillStyle=g;
    ctx.beginPath(); ctx.arc(0,0,r,0,7); ctx.fill(); for(let i=0;i<7;i++){ctx.beginPath(); ctx.arc(-r+i*r/3,r*.72,r*.24,0,7); ctx.fill();} ctx.restore();};
  return {still:520,step(dt){T=(T+dt)%CYC},
    draw(){const p=T/CYC; bgv(ctx,W,H,'#fdf4ee','#f6e6db');
      shadow(ctx,cx+4,tipY+12,cwid*.9,6,.12);
      ctx.globalAlpha=fadeOf(p);
      [2,1,0].forEach(i=>{const s=S[i], t=(p-.05-i*.13)/.12; if(t<=0) return; const e=ease(t), y=s.y-(1-e)*H*.8, sq=t>1?Math.max(0,Math.sin((t-1)*14)*Math.exp(-(t-1)*6)):0; scoop(cx+(i===1?-3:i===2?3:0),y,s.c,sq);});
      ctx.globalAlpha=1;
      ctx.fillStyle=grad(ctx,cx-cwid,0,cx+cwid,0,['#d79a52','#f0c27e','#cf8f47']); ctx.beginPath(); ctx.moveTo(cx-cwid,topY); ctx.lineTo(cx+cwid,topY); ctx.lineTo(cx,tipY); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(160,98,40,.35)'; for(let i=0;i<5;i++) for(let j=0;j<=i;j++){const y=topY+12+i*((tipY-topY-20)/5), w=cwid*(1-(y-topY)/(tipY-topY)); const x=cx-w+((j+.5)/(i+1))*2*w; ctx.beginPath(); ctx.arc(x,y+6,2,0,7); ctx.fill();}
      ctx.fillStyle=grad(ctx,cx-cwid,0,cx+cwid,0,['#cf8f47','#f5cd8d','#c98940']); ctx.beginPath(); ctx.roundRect(cx-cwid-3,topY-5,cwid*2+6,10,5); ctx.fill();
      ctx.globalAlpha=fadeOf(p);
      const w=pop((p-.5)/.08); if(w>0){ctx.save(); ctx.translate(cx+r*.5,S[2].y-r*.7); ctx.rotate(.5); ctx.scale(w,w); ctx.fillStyle=grad(ctx,-4,0,4,0,['#e9c58a','#f7dfb2']); ctx.beginPath(); ctx.roundRect(-5,-34,10,40,3); ctx.fill(); ctx.restore();}
      const c=pop((p-.56)/.08); if(c>0){const x=cx-4, y=S[2].y-r*1.05; ctx.fillStyle='#c4213a'; ctx.beginPath(); ctx.arc(x,y,9*c,0,7); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(x-3,y-3,2.5*c,0,7); ctx.fill();}
      ctx.globalAlpha=1;}};
});

/* ---- Red wine ---- */
F.redwine=((ctx,W,H)=>{
  const CYC=11, cx=W*.68, top=H*.16, bot=H*.56, hw=H*.15, FILL=.3+.35*DAY/TOTAL; let T=0;
  const glass=()=>{ctx.beginPath(); ctx.moveTo(cx-hw*.62,top); ctx.bezierCurveTo(cx-hw*1.15,top+(bot-top)*.45,cx-hw*.9,bot,cx,bot); ctx.bezierCurveTo(cx+hw*.9,bot,cx+hw*1.15,top+(bot-top)*.45,cx+hw*.62,top);};
  return {still:420,step(dt){T=(T+dt)%CYC},
    draw(){const p=T/CYC, f=FILL*ease((p-.05)/.3), sw=p>.4?Math.sin((p-.4)*30)*.16*Math.exp(-(p-.4)*5):0; bgv(ctx,W,H,'#f7f3f2','#ede5e3');
      ctx.fillStyle=`rgba(150,30,60,${.12*f/FILL})`; ctx.beginPath(); ctx.ellipse(cx+16,H*.84,hw*1.1,8,0,0,7); ctx.fill(); shadow(ctx,cx+3,H*.83,hw*.8,5,.12);
      const s=bot-(bot-top)*f;
      ctx.save(); glass(); ctx.closePath(); ctx.fillStyle='rgba(255,255,255,.5)'; ctx.fill(); ctx.clip(); ctx.globalAlpha=fadeOf(p);
      ctx.save(); ctx.translate(cx,s); ctx.rotate(sw); ctx.fillStyle=grad(ctx,-hw,0,hw,0,['#5a0c20','#a3243f','#5f0d22']); ctx.fillRect(-W,0,W*2,H); ctx.fillStyle='rgba(255,190,200,.35)'; ctx.beginPath(); ctx.ellipse(0,0,hw*.95,3,0,0,7); ctx.fill(); ctx.restore();
      ctx.globalAlpha=1; ctx.fillStyle='rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(cx-hw*.55,top+(bot-top)*.45,hw*.08,(bot-top)*.3,.1,0,7); ctx.fill(); ctx.restore();
      ctx.strokeStyle='rgba(120,100,105,.45)'; ctx.lineWidth=1.3; glass(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx,bot); ctx.lineTo(cx,H*.82); ctx.stroke(); ctx.beginPath(); ctx.ellipse(cx,H*.82,hw*.62,4.5,0,0,7); ctx.stroke();
      if(p>.04&&p<.35){ctx.strokeStyle='rgba(130,24,50,.9)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx+hw*.15,0); ctx.lineTo(cx+hw*.15,s); ctx.stroke();}}};
});

/* ---- Afternoon tea ---- */
F.tea=((ctx,W,H)=>{
  const CYC=11, cup={x:W*.74,y:H*.6}, pot={x:W*.52,y:H*.3}; let T=0;
  const steam=[...Array(10)].map(()=>({o:rnd(0,1),x:rnd(-12,12),s:rnd(5,10)}));
  return {still:440,step(dt){T=(T+dt)%CYC},
    draw(){const p=T/CYC, tilt=.55*ease((p-.08)/.12)*(1-ease((p-.6)/.12)), level=ease((p-.15)/.45); bgv(ctx,W,H,'#f2f7f4','#e2ece6');
      shadow(ctx,cup.x+4,cup.y+30,62,10,.12); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(cup.x,cup.y+26,60,11,0,0,7); ctx.fill(); ctx.fillStyle='#eef3f1'; ctx.beginPath(); ctx.ellipse(cup.x,cup.y+24,30,5,0,0,7); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=7; ctx.beginPath(); ctx.ellipse(cup.x+40,cup.y-2,11,13,0,-1.3,1.3); ctx.stroke(); ctx.strokeStyle='#e3ebe7'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(cup.x+40,cup.y-2,11,13,0,-1.3,1.3); ctx.stroke();
      ctx.fillStyle=grad(ctx,cup.x-40,0,cup.x+40,0,['#d3ded8','#ffffff','#cfdbd4']); ctx.beginPath(); ctx.moveTo(cup.x-42,cup.y-22); ctx.bezierCurveTo(cup.x-40,cup.y+18,cup.x-20,cup.y+24,cup.x,cup.y+24); ctx.bezierCurveTo(cup.x+20,cup.y+24,cup.x+40,cup.y+18,cup.x+42,cup.y-22); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#8fb3a4'; ctx.fillRect(cup.x-41,cup.y-14,82,3);
      ctx.fillStyle='#f4f7f5'; ctx.beginPath(); ctx.ellipse(cup.x,cup.y-22,42,9,0,0,7); ctx.fill();
      ctx.globalAlpha=fadeOf(p);
      if(level>0){ctx.fillStyle=grad(ctx,cup.x-38,0,cup.x+38,0,['#8a4518','#c06f2c','#8a4518']); ctx.beginPath(); ctx.ellipse(cup.x,cup.y-21+(1-level)*5,38*(.7+.3*level),7*(.7+.3*level),0,0,7); ctx.fill();}
      const sp={x:pot.x+Math.cos(tilt)*58-Math.sin(tilt)*-10,y:pot.y+Math.sin(tilt)*58+Math.cos(tilt)*-10};
      if(tilt>.4){ctx.strokeStyle='rgba(176,96,38,.85)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(sp.x,sp.y); ctx.quadraticCurveTo(sp.x+14,sp.y+8,cup.x-6,cup.y-20); ctx.stroke();}
      ctx.save(); ctx.translate(pot.x,pot.y); ctx.rotate(tilt);
      shadow(ctx,0,40,40,5,.06);
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(30,4); ctx.quadraticCurveTo(52,0,60,-12); ctx.lineTo(56,-14); ctx.quadraticCurveTo(46,-6,30,-8); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=7; ctx.beginPath(); ctx.ellipse(-40,2,13,16,0,1.8,4.5); ctx.stroke();
      ctx.fillStyle=grad(ctx,-40,0,40,0,['#cdd9d2','#ffffff','#c9d6ce']); ctx.beginPath(); ctx.ellipse(0,4,40,32,0,0,7); ctx.fill();
      ctx.fillStyle='#8fb3a4'; ctx.fillRect(-39,6,78,3); ctx.fillStyle='#f4f7f5'; ctx.beginPath(); ctx.ellipse(0,-26,20,6,0,0,7); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0,-33,5,0,7); ctx.fill();
      ctx.restore();
      if(level>.6) steam.forEach(s=>{const t=(T*.25+s.o)%1; ctx.fillStyle=`rgba(255,255,255,${.5*(1-t)*(level-.6)/.4})`; ctx.beginPath(); ctx.arc(cup.x+s.x+Math.sin(t*6+s.o*6)*6,cup.y-30-t*60,s.s*(.6+t),0,7); ctx.fill();});
      ctx.globalAlpha=1;}};
});

/* ---- Eggs Benedict (brunch) ---- */
F.benny=((ctx,W,H)=>{
  const CYC=12, cx=W*.67, base=H*.62, mw=H*.17; let T=0;
  const nooks=[...Array(16)].map(()=>({a:rnd(0,6.28),d:Math.sqrt(Math.random())*.85,r:rnd(1.2,2.6)}));
  const chives=[...Array(11)].map(()=>({x:rnd(-.45,.45),y:rnd(-.15,.12),a:rnd(0,3.14),d:rnd(0,.08)}));
  const dust=[...Array(70)].map(()=>{const u=rnd(-1,1); return {x:u*.4+rnd(-.06,.06),y:u*.08+rnd(-.05,.05)}});
  return {still:640,step(dt){T=(T+dt)%CYC},
    draw(){const p=T/CYC; bgv(ctx,W,H,'#fdf8ea','#f5ecd2');
      shadow(ctx,cx,base+18,mw*2.2,12,.1); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(cx,base+10,mw*2.1,22,0,0,7); ctx.fill(); ctx.fillStyle='#f6f4ef'; ctx.beginPath(); ctx.ellipse(cx,base+10,mw*1.5,14,0,0,7); ctx.fill();
      ctx.globalAlpha=fadeOf(p);
      const m=ease((p-.03)/.09); let my=base;
      if(m>0){const y=base-(1-m)*H*.6; my=y; ctx.fillStyle=grad(ctx,cx-mw,0,cx+mw,0,['#b8783a','#d99a55','#b26f33']); ctx.beginPath(); ctx.ellipse(cx,y,mw,mw*.3,0,0,Math.PI); ctx.fill(); ctx.fillRect(cx-mw,y-14,mw*2,14);
        ctx.fillStyle=grad(ctx,0,y-24,0,y-6,['#f6e2b8','#ecd09a']); ctx.beginPath(); ctx.ellipse(cx,y-14,mw,mw*.3,0,0,7); ctx.fill();
        ctx.fillStyle='rgba(200,150,90,.45)'; nooks.forEach(n=>{ctx.beginPath(); ctx.ellipse(cx+Math.cos(n.a)*n.d*mw,y-14+Math.sin(n.a)*n.d*mw*.3,n.r*1.3,n.r*.6,0,0,7); ctx.fill();});}
      const hm=ease((p-.13)/.09); const hy=base-19;
      if(hm>0){const y=hy-(1-hm)*H*.6; ctx.fillStyle='#d98d86'; ctx.beginPath(); ctx.ellipse(cx+2,y+3,mw*1.04,mw*.31,0,0,7); ctx.fill();
        ctx.fillStyle=grad(ctx,cx-mw,0,cx+mw,0,['#efb3ab','#f7cdc6','#eeb0a8']); for(let k=0;k<14;k++){const a=k/14*6.283; ctx.beginPath(); ctx.arc(cx+2+Math.cos(a)*mw*.92,y+Math.sin(a)*mw*.26,mw*.12,0,7); ctx.fill();} ctx.beginPath(); ctx.ellipse(cx+2,y,mw*.95,mw*.27,0,0,7); ctx.fill();}
      const ey=hy-6, et=(p-.24)/.11;
      if(et>0){const e=ease(et), sq=et>1?Math.sin((et-1)*12)*Math.exp(-(et-1)*5):0, y=ey-(1-e)*H*.7;
        ctx.save(); ctx.translate(cx,y); ctx.scale(1+sq*.08,1-sq*.08);
        ctx.fillStyle='rgba(255,255,255,.75)'; [[-.85,.02,.22],[.8,.04,.2],[-.3,.1,.25],[.35,.09,.22]].forEach(([a,b,s])=>{ctx.beginPath(); ctx.ellipse(a*mw,b*mw,mw*s,mw*.08,0,0,7); ctx.fill();});
        const g=ctx.createRadialGradient(-mw*.25,-mw*.4,2,0,-mw*.15,mw*.8); g.addColorStop(0,'#ffffff'); g.addColorStop(.7,'#f7f4ee'); g.addColorStop(1,'#ebe5da'); ctx.fillStyle=g;
        ctx.beginPath(); ctx.moveTo(-mw*.72,0); ctx.bezierCurveTo(-mw*.8,-mw*.55,-mw*.25,-mw*.68,0,-mw*.66); ctx.bezierCurveTo(mw*.3,-mw*.68,mw*.82,-mw*.5,mw*.72,0); ctx.quadraticCurveTo(0,mw*.14,-mw*.72,0); ctx.fill();
        const yg=ctx.createRadialGradient(0,-mw*.3,1,0,-mw*.3,mw*.32); yg.addColorStop(0,'rgba(255,170,40,.35)'); yg.addColorStop(1,'rgba(255,170,40,0)'); ctx.fillStyle=yg; ctx.beginPath(); ctx.arc(0,-mw*.3,mw*.32,0,7); ctx.fill();
        ctx.restore();}
      const h=ease((p-.46)/.14);
      if(p>.42&&p<.6){ctx.strokeStyle='rgba(244,206,98,.95)'; ctx.lineWidth=5; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(cx-8,0); ctx.lineTo(cx-8,ey-mw*.6); ctx.stroke(); ctx.lineCap='butt';}
      if(h>0){ctx.save(); ctx.translate(cx,ey); const hg=ctx.createLinearGradient(0,-mw*.7,0,mw*.1); hg.addColorStop(0,'#fbe08a'); hg.addColorStop(1,'#f1c85a'); ctx.fillStyle=hg;
        ctx.beginPath(); ctx.moveTo(-mw*.62*h,-mw*.2); ctx.bezierCurveTo(-mw*.7*h,-mw*.62,-mw*.2,-mw*.74,0,-mw*.72); ctx.bezierCurveTo(mw*.25,-mw*.74,mw*.72*h,-mw*.6,mw*.64*h,-mw*.2); ctx.quadraticCurveTo(0,-mw*.05,-mw*.62*h,-mw*.2); ctx.fill();
        [[-.5,.9],[-.12,1.25],[.3,1],[.58,.7]].forEach(([u,l],i)=>{const len=ease((p-.52-i*.025)/.14)*mw*.32*l; if(len>0){ctx.beginPath(); ctx.roundRect(u*mw-5,-mw*.26,10,len,5); ctx.fill(); ctx.beginPath(); ctx.arc(u*mw,-mw*.26+len,5.5,0,7); ctx.fill();}});
        ctx.fillStyle='rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-mw*.22,-mw*.58,mw*.18,mw*.05,-.2,0,7); ctx.fill(); ctx.restore();}
      const y2=ease((p-.8)/.1); if(y2>0){ctx.save(); ctx.translate(cx+mw*.1,ey-mw*.18); const yg=ctx.createLinearGradient(0,0,0,mw*.5); yg.addColorStop(0,'#ffb52e'); yg.addColorStop(1,'#f39c12'); ctx.fillStyle=yg; ctx.beginPath(); ctx.ellipse(0,0,mw*.14,mw*.08,0,0,7); ctx.fill(); ctx.beginPath(); ctx.roundRect(-mw*.07,0,mw*.14,mw*.45*y2,mw*.07); ctx.fill(); ctx.beginPath(); ctx.arc(0,mw*.45*y2,mw*.08,0,7); ctx.fill(); ctx.restore();}
      const dp=ease((p-.66)/.08); if(dp>0){ctx.fillStyle=`rgba(200,64,36,${.55*dp})`; dust.forEach(d=>{ctx.beginPath(); ctx.arc(cx+d.x*mw,ey-mw*.62+d.y*mw,.8,0,7); ctx.fill();});}
      chives.forEach(c=>{const t=ease((p-.7-c.d)/.08); if(t<=0) return; ctx.save(); ctx.translate(cx+c.x*mw,ey-mw*.6+c.y*mw-(1-t)*40); ctx.rotate(c.a); ctx.fillStyle='#3f8a34'; ctx.beginPath(); ctx.roundRect(-4,-1.3,8,2.6,1.3); ctx.fill(); ctx.fillStyle='#6fb35a'; ctx.fillRect(-3.5,-1,7,.8); ctx.restore();});
      ctx.globalAlpha=1;}};
});

/* ---- Iced matcha latte ---- */
F.matcha=((ctx,W,H)=>{
  const CYC=12, cx=W*.68, top=H*.13, bot=H*.74, hw=H*.15, lvl=top+(bot-top)*.14; let T=0;
  const ice=[[-.4,.08,.2],[.35,.05,-.25],[-.05,.2,.5],[.4,.3,.15]].map(([x,y,a])=>({x,y,a,ph:rnd(0,6)}));
  const blobs=[...Array(14)].map(()=>({x:rnd(-.8,.8),d:rnd(0,1),r:rnd(10,22),s:rnd(.6,1.2)}));
  const glass=()=>{ctx.beginPath(); ctx.moveTo(cx-hw,top); ctx.lineTo(cx+hw,top); ctx.lineTo(cx+hw*.84,bot); ctx.quadraticCurveTo(cx,bot+8,cx-hw*.84,bot); ctx.closePath();};
  return {still:620,step(dt){T=(T+dt)%CYC},
    draw(){const p=T/CYC; bgv(ctx,W,H,'#f4f7ef','#e5ecdb');
      shadow(ctx,cx+4,bot+10,hw*1.05,7,.12); ctx.fillStyle=`rgba(127,166,80,${.15*ease((p-.2)/.3)})`; ctx.beginPath(); ctx.ellipse(cx+20,bot+12,hw*1.2,8,0,0,7); ctx.fill();
      ctx.save(); glass(); ctx.fillStyle='rgba(255,255,255,.5)'; ctx.fill(); ctx.clip(); ctx.globalAlpha=fadeOf(p);
      ctx.fillStyle=grad(ctx,0,lvl,0,bot,['#fbfaf4','#f3f1e6']); ctx.fillRect(cx-hw,lvl,hw*2,bot-lvl+10);
      const g=ease((p-.12)/.3), depth=(bot-lvl)*(.18+.5*g), mix=ease((p-.3)/.45);
      if(g>0){ctx.fillStyle=grad(ctx,0,lvl,0,lvl+depth,['#6f9a3e','#86ad52','rgba(150,190,110,0)']); ctx.fillRect(cx-hw,lvl,hw*2,depth);
        blobs.forEach(b=>{const y=lvl+depth*.6+b.d*(bot-lvl-depth*.6)*mix, r=b.r*(.5+mix*b.s); ctx.fillStyle=`rgba(140,180,96,${.32*g*(1-b.d*.5)})`; ctx.beginPath(); ctx.ellipse(cx+b.x*hw*.8,y,r*1.4,r,0,0,7); ctx.fill();});}
      ice.forEach(c=>{const x=cx+c.x*hw, y=lvl+c.y*(bot-lvl)+Math.sin(T*1.3+c.ph)*2, s=hw*.36; ctx.save(); ctx.translate(x,y); ctx.rotate(c.a+Math.sin(T+c.ph)*.04);
        ctx.fillStyle='rgba(255,255,255,.55)'; ctx.beginPath(); ctx.roundRect(-s/2,-s/2,s,s,7); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.8)'; ctx.beginPath(); ctx.roundRect(-s/2+4,-s/2+4,s*.35,s*.16,3); ctx.fill(); ctx.restore();});
      ctx.globalAlpha=1; ctx.fillStyle='rgba(255,255,255,.4)'; ctx.fillRect(cx-hw*.82,top+6,6,bot-top-20); ctx.restore();
      ctx.strokeStyle='rgba(120,140,110,.45)'; ctx.lineWidth=1.3; glass(); ctx.stroke();
      ctx.save(); ctx.translate(cx+hw*.35,top-26); ctx.rotate(.18); ctx.fillStyle=grad(ctx,-5,0,5,0,['#c9dcae','#e4eed5']); ctx.beginPath(); ctx.roundRect(-5,0,10,(bot-top)*.75,5); ctx.fill(); ctx.restore();
      if(p>.1&&p<.38){ctx.strokeStyle='rgba(111,154,62,.95)'; ctx.lineWidth=4; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(cx-hw*.3,0); ctx.lineTo(cx-hw*.3,lvl+4); ctx.stroke(); ctx.lineCap='butt';}
    }};
});
const ORDER=['plate','pour','macaron','tower','pancake','gelato','redwine','tea','matcha','benny'];
function startHero(cv,id,data){
  DAY=data.day; TOTAL=data.total; STREAK=Math.max(1,Math.min(15,data.streak|0));
  AREA=data.areas.map(c=>({c})); while(AREA.length<3) AREA.push(AREA[AREA.length-1]||{c:'#b48a3c'});
  const make=F[id]||F.plate, ctx=cv.getContext('2d'); let W=0,H=0,api=null,on=false,raf=0,last=0;
  function size(){const r=cv.getBoundingClientRect(), d=Math.min(devicePixelRatio||1,2); W=r.width; H=r.height; if(!W) return; cv.width=W*d; cv.height=H*d; ctx.setTransform(d,0,0,d,0,0); api=make(ctx,W,H);
    if(REDUCED){for(let i=0;i<(api.still||260);i++) api.step(1/60); api.draw();}}
  function loop(t){ if(!on||!api) return; const dt=Math.min((t-last)/1000||.016,.05); last=t; api.step(dt); api.draw(); raf=requestAnimationFrame(loop);}
  new ResizeObserver(size).observe(cv);
  if(!REDUCED) new IntersectionObserver(es=>es.forEach(e=>{on=e.isIntersecting; if(on){last=performance.now(); raf=requestAnimationFrame(loop);} else cancelAnimationFrame(raf);}),{threshold:.05}).observe(cv);
}
window.HEROES={ORDER,startHero,forDay:d=>ORDER[(d-1)%ORDER.length]};
})();
