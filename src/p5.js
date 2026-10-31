// =====================================================================
//  RENDERING
// =====================================================================
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function skyCanvas(c0,c1){return pix(W,H,(x,y)=>{const t=y/(H-1);return (t*16)>BAYER[(y&3)*4+(x&3)]+((y>>4)&0)?c1:c0})}
function cloudLayer(w,h,n,seed,c0,c1){const c=mkC(w,h),g=c.getContext('2d');
 for(let i=0;i<n;i++){const cx=hash(i,seed)*w,cy=h*0.35+hash(seed,i)*h*0.4,s=10+hash(i+7,seed)*10;
  const blobs=[[0,0,s],[s*0.9,-s*0.35,s*0.8],[s*1.8,0,s*0.85],[-s*0.9,s*0.1,s*0.7]];
  for(const pass of [0,1])for(const [bx,by,r] of blobs){for(const ox of [-w,0,w]){g.fillStyle=pass?c0:c1;g.beginPath();g.arc(Math.round(cx+bx+ox),Math.round(cy+by+(pass?0:2)),Math.round(r),0,7);g.fill()}}}
 // posterize alpha edges to keep it pixel-crisp
 const d=g.getImageData(0,0,w,h);for(let i=3;i<d.data.length;i+=4)d.data[i]=d.data[i]>110?255:0;g.putImageData(d,0,0);return c}
function hillLayer(w,h,col,dark,amp,freq,base,seed){return pix(w,h,(x,y)=>{const hy=base-amp*(0.6*Math.sin(x*freq*2*Math.PI/w+seed)+0.4*Math.sin(x*freq*4.3*Math.PI/w+seed*2));
 if(y<hy)return null;if(y<hy+2)return dark;return (hash(x>>2,y>>2)<0.04)?dark:col})}
const BG={};
BG.over={sky:skyCanvas('#6cb8ff','#a8dcff'),layers:[{img:cloudLayer(512,110,6,1,'#ffffff','#d4ecff'),s:0.12,y:22},{img:hillLayer(512,120,'#8ad8a8','#5ab07a',22,2,60,1),s:0.25,y:120},{img:hillLayer(512,90,'#52b868','#2f8a44',14,3,40,4),s:0.45,y:150}]};
BG.sky={sky:skyCanvas('#ff9e8a','#ffd8a8'),sun:true,layers:[{img:cloudLayer(512,90,5,3,'#fff4f0','#ffc8c0'),s:0.08,y:30},{img:cloudLayer(512,120,10,5,'#ffffff','#f0d0e8'),s:0.3,y:150}]};
BG.under={sky:skyCanvas('#0b0a1d','#1a1534'),layers:[{img:pix(512,240,(x,y)=>{const cx=x%64,cy=y%80,k=(x>>6)*7+(y/80|0);const h=hash(k,9);const dx=Math.abs(cx-32-h*16+8),top=50+h*20;
   if(y<36&&dx<(36-y)*0.18*(1+h))return '#16122c';if(cy>top-14&&cy<top+6&&dx*2.2<(cy-top+14))return h>0.5?'#2a4a7a':'#3a2a6a';return null}),s:0.4,y:0}]};
BG.castle={sky:skyCanvas('#170812','#2a0c18'),layers:[{img:pix(512,240,(x,y)=>{const cx=x%96;if(cx<18){return (y%16===15||(cx===17))?'#1a0a12':'#2a1420'}
   if(cx>40&&cx<62&&y>70&&y<120){const ax=Math.abs(cx-51);if(y<80&&ax*ax>(y-70)*11)return null;return (y>100)?'#4a1a10':'#6a2810'}return null}),s:0.5,y:0}]};
function drawBG(theme,cx){const b=BG[theme.name];ctx.drawImage(b.sky,0,0);
 if(b.sun){ctx.fillStyle='#fff0c0';ctx.beginPath();ctx.arc(196-((cx*0.03)%40),70,18,0,7);ctx.fill();ctx.fillStyle='#ffe0a0';ctx.fillRect(170-((cx*0.03)%40),69,52,2)}
 for(const L of b.layers){const ox=-(Math.floor(cx*L.s)%L.img.width);ctx.drawImage(L.img,ox,L.y);if(ox+L.img.width<W)ctx.drawImage(L.img,ox+L.img.width,L.y)}}
function bumpOff(L,tx,ty){for(const b of L.bumps)if(b.tx===tx&&b.ty===ty)return Math.round(Math.sin(b.t/10*Math.PI)*5);return 0}
function drawTiles(L,cx){const ts=L.ts,x0=Math.floor(cx/16),x1=Math.min(L.w-1,Math.floor((cx+W)/16)),f=G.frame;
 const qf=[0,1,2,3,2,1][(f>>3)%6];
 for(let ty=0;ty<ROWS;ty++){const row=L.map[ty];for(let tx=Math.max(0,x0);tx<=x1;tx++){const ch=row[tx];if(ch===' '||ch==='h')continue;
  let img;const px=tx*16-cx,py=ty*16;
  switch(ch){case 'G':img=(ty===0||L.map[ty-1][tx]!=='G')?ts.Gt:ts.G;break;case 'Q':img=ts.Q[qf];break;case 'L':img=ts.L[(f>>3)&3];break;case 'l':img=ts.l[(f>>4)&1];break;
   case 'o':img=ART.coin[[0,1,2,1][(f>>3)&3]];break;default:img=ts[ch]}
  if(img)ctx.drawImage(img,px,py-(L.bumps.length?bumpOff(L,tx,ty):0))}}}
function drawPlats(L,cx){for(const pl of L.plats){const x=Math.round(pl.x-cx),y=Math.round(pl.y);if(x>W||x+pl.w<0)continue;
 const t=L.theme.name;const top=t==='sky'?'#ffffff':t==='castle'?'#a098b8':'#e0e6f0',mid=t==='sky'?'#d8c8f0':t==='castle'?'#6a6078':'#9aa4ba',dk=t==='castle'?'#2a2438':'#4a5068';
 ctx.fillStyle=dk;ctx.fillRect(x,y,pl.w,8);ctx.fillStyle=mid;ctx.fillRect(x+1,y+1,pl.w-2,6);ctx.fillStyle=top;ctx.fillRect(x+1,y+1,pl.w-2,2);
 ctx.fillStyle=dk;for(let i=6;i<pl.w-2;i+=12)ctx.fillRect(x+i,y+4,2,2)}}
function drawGeysers(L,cx){for(const g of L.geysers){const st=geyserState(g,L.t),x=g.x*16-cx;if(x<-16||x>W)continue;
 if(st===1){if((G.frame>>2)&1){ctx.fillStyle='#ffe070';ctx.fillRect(x+4,204-((G.frame>>1)%6),3,3);ctx.fillRect(x+10,205-((G.frame>>2)%5),2,2)}}
 else if(st===2){const b=geyserBox(g);for(let y=b.y;y<208;y+=2){const w=8+Math.round(Math.sin((y+G.frame*3)*0.3)*3);ctx.fillStyle=(y+G.frame)%6<2?'#fff4a0':(y%4<2?'#ffb030':'#ff5a0a');ctx.fillRect(x+8-w/2,y,w,2)}}}}
const PENNANT=pix(16,14,(x,y)=>{if(x>15-((y<7?y:13-y)*2+2)&&false)return null;const edge=Math.abs(y-6.5);if(x<edge*2.2)return null;if(x>=14)return '#a06010';
 const dx=x-9,dy=y-6.5;if(dx*dx+dy*dy<5)return '#7a3a10';if((x===6||x===12)&&(y===3||y===10))return '#7a3a10';if(x===9&&(y===2||y===11))return '#7a3a10';return y<3||y>10?'#ffd04a':'#ffe070'});
function drawFlag(L,cx){if(!L.flag)return;const x=L.flag*16+7-cx;if(x<-20||x>W+20)return;
 ctx.fillStyle='#2a4a3a';ctx.fillRect(x,56,3,136);ctx.fillStyle='#e8f0f0';ctx.fillRect(x,56,2,136);
 ctx.fillStyle='#1a3a2a';ctx.beginPath();ctx.arc(x+1,51,5,0,7);ctx.fill();ctx.fillStyle='#50e090';ctx.beginPath();ctx.arc(x+1,51,4,0,7);ctx.fill();ctx.fillStyle='#c0ffe0';ctx.fillRect(x-1,48,2,2);
 ctx.drawImage(PENNANT,x-14,Math.round(L.flagY))}
function drawHut(L,cx){if(!L.hut)return;const x=L.hut*16-cx,y=208-56;if(x>W||x<-80)return;
 ctx.fillStyle='#5a3a2a';ctx.fillRect(x-2,y,68,56);ctx.fillStyle='#f0dcb0';ctx.fillRect(x,y+2,64,54);
 for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#d04848':'#f06060';ctx.fillRect(x-6+i*2,y-6-i*4,76-i*4,4)}
 ctx.fillStyle='#3a2418';ctx.fillRect(x+22,y+24,22,32);ctx.fillStyle='#1a0e08';ctx.fillRect(x+24,y+26,18,30);
 ctx.fillStyle='#4aa0e0';ctx.fillRect(x+6,y+14,12,10);ctx.fillRect(x+48,y+14,12,10);ctx.fillStyle='#c0e8ff';ctx.fillRect(x+7,y+15,4,3);ctx.fillRect(x+49,y+15,4,3);
 ctx.fillStyle='#2f6fe0';ctx.fillRect(x+18,y+6,30,13);text('POST',x+21,y+9,'#fff',1,null)}
function drawDecor(L,cx){
 if(L.checkpoint){const x=L.checkpoint*16+4-cx;if(x>-10&&x<W+10){const ty=columnTop(L.map,L.checkpoint,3);const by=ty*16;
  ctx.fillStyle='#3a2a1a';ctx.fillRect(x+3,by-30,2,30);ctx.fillStyle='#5a4a3a';ctx.fillRect(x,by-38,8,9);const on=G.cp&&!lv.isRoom;
  ctx.fillStyle=on?((G.frame>>3)&1?'#fff6a0':'#ffd040'):'#5a6a7a';ctx.fillRect(x+1,by-37,6,7);if(on){ctx.fillStyle='rgba(255,230,120,0.25)';ctx.fillRect(x-4,by-42,16,16)}}}
 for(const d of L.decor){const x=d.x*16-cx,y=d.y*16;if(x<-20||x>W+20)continue;
  if(d.t==='sign'){ctx.fillStyle='#5a3a1a';ctx.fillRect(x+7,y+4,2,12);ctx.fillStyle='#c08a4a';ctx.fillRect(x+1,y,14,7);ctx.fillStyle='#5a3a1a';ctx.fillRect(x+4,y+3,6,1);ctx.fillRect(x+9,y+2,1,3);ctx.fillRect(x+10,y+3,1,1)}
  if(d.t==='crystal'){const c=(G.frame>>4)&1?'#9af6ff':'#7ae0ff';ctx.fillStyle='#3a6aa0';ctx.fillRect(x+3,y+6,4,10);ctx.fillRect(x+9,y+2,4,14);ctx.fillStyle=c;ctx.fillRect(x+4,y+7,2,8);ctx.fillRect(x+10,y+3,2,12)}}}
function spriteFor(e){switch(e.t){case 'blob':return e.squash?ART.blobFlat:ART.blob[(e.anim>>3)&1];case 'beetle':return ART.beetle[(e.anim>>3)&1];
 case 'shell':return ART.shell;case 'flyer':return ART.flyer[(e.anim>>2)&1];case 'hopper':return ART.hopper[e.onGround?0:1]}}
function drawEnt(e,cx){const s=spriteFor(e);const img=s[e.dir>0?0:1];let x=Math.round(e.x-2-cx),y=Math.round(e.y+e.h-16);
 if(e.t==='shell'&&!e.moving&&e.wake<90&&(e.anim>>1)&1)x+=1;
 if(e.flip){ctx.save();ctx.translate(x,y+16);ctx.scale(1,-1);ctx.drawImage(img,0,0);ctx.restore()}else ctx.drawImage(img,x,y)}
function heroFrame(p){if(p.dead)return 'dead';if(!p.onGround)return 'jump';if(p.skid)return 'skid';if(Math.abs(p.vx)>0.15){return ['w1','stand','w2','stand'][Math.floor(p.anim)%4]}return 'stand'}
function drawHero(p,cx,sizeOverride){if(p.hidden)return;const size=sizeOverride!==undefined?sizeOverride:p.size;
 if(p.inv>0&&!G.freeze&&(p.inv>>2)&1&&!p.dead)return;
 const pal=p.star>0?['st0','st1','st2'][(G.frame>>2)%3]:size===2?'spark':'normal';const set=HERO[pal][size?'b':'s'];
 let fr=heroFrame(p);if(size&&fr==='dead')fr='jump';const img=set[fr][p.face>0?0:1];const bottom=p.y+p.h;
 ctx.drawImage(img,Math.round(p.x-2-cx),Math.round(bottom-(size?32:16)))}
function drawItem(it,cx){let img;switch(it.kind){case 'berry':img=ART.berry;break;case 'bulb':img=ART.bulb[(G.frame>>3)&1];break;case 'comet':img=ART.comet[(G.frame>>2)%5];break;case 'heart':img=ART.heart}
 ctx.drawImage(img,Math.round(it.x-1-cx),Math.round(it.y-2))}
function drawBoss(b,cx){if(!b)return;const fr=b.inv>0&&(b.inv>>2)&1?2:(b.anim>>4)&1;const img=ART.boss[fr][P.x+P.w/2<b.x+b.w/2?1:0];
 if(b.state==='defeat'&&(b.t>>2)&1)return;ctx.drawImage(img,Math.round(b.x-2-cx),Math.round(b.y-4))}
function drawHUD(){const L=lv;ctx.fillStyle='rgba(10,6,24,0.55)';ctx.fillRect(0,0,W,24);
 text('KIT x'+String(G.lives),10,4,'#ffd870');text(String(G.score).padStart(6,'0'),10,14,'#fff');
 ctx.drawImage(ART.coin[[0,1,2,1][(G.frame>>3)&3]],78,8,10,10);text('x'+String(G.coins).padStart(2,'0'),90,10,'#fff');
 text('STAGE',132,4,'#ffd870');text(L.isRoom?'BONUS':(G.stage+1)+' OF '+LEVELS.length,132,14,'#fff');
 text('TIME',212,4,'#ffd870');text(String(L.time).padStart(3,'0'),212,14,L.time<=100&&(G.frame>>4)&1?'#ff6a6a':'#fff');
 const b=L.boss;if(b&&b.active&&b.state==='fight'){ctx.fillStyle='rgba(10,6,24,0.7)';ctx.fillRect(80,25,96,22);text('MAGMUS',110,27,'#ffb060');for(let i=0;i<6;i++){ctx.fillStyle='#2a0a0a';ctx.fillRect(84+i*15,38,13,6);ctx.fillStyle=i<b.hp?'#ff6a2a':'#4a2020';ctx.fillRect(85+i*15,39,11,4)}}}
function drawWorld(){const L=lv;const cx=Math.floor(cam.x);drawBG(L.theme,cx);
 for(const it of L.items)if(it.emerge>0)drawItem(it,cx);
 if(G.pipe&&!P.dead)drawHero(P,cx);
 drawDecor(L,cx);drawHut(L,cx);drawTiles(L,cx);drawFlag(L,cx);drawPlats(L,cx);drawGeysers(L,cx);
 for(const it of L.items)if(!it.emerge)drawItem(it,cx);
 for(const e of L.ents)if(e.active)drawEnt(e,cx);
 drawBoss(L.boss,cx);
 for(const s of L.sparks)ctx.drawImage(ART.spark[(s.t>>2)&1],Math.round(s.x-1-cx),Math.round(s.y-1));
 for(const f of L.bfire)ctx.drawImage(ART.fireball[(f.t>>2)&1],Math.round(f.x-cx),Math.round(f.y));
 if(!G.pipe){if(G.sizeAnim&&G.freeze>0){const sa=G.sizeAnim;drawHero(P,cx,((G.freeze>>2)&1)?sa.from:sa.to)}else drawHero(P,cx)}
 for(const f of L.fx){if(f.k==='coin')ctx.drawImage(ART.coin[(f.t>>2)&3],Math.round(f.x-cx),Math.round(f.y));
  else if(f.k==='deb'){ctx.fillStyle=L.theme.brick[0];ctx.fillRect(Math.round(f.x-cx),Math.round(f.y),6,6);ctx.fillStyle=L.theme.brick[2];ctx.fillRect(Math.round(f.x-cx)+4,Math.round(f.y),2,6)}
  else if(f.k==='poof'){ctx.fillStyle=f.t<8?'#ffffff':'#ffd040';const r=2+f.t/3;ctx.fillRect(Math.round(f.x-cx-r+3),Math.round(f.y+3),r*2,1);ctx.fillRect(Math.round(f.x-cx+3),Math.round(f.y-r+3),1,r*2)}}
 for(const s of L.pops)text(s.txt,Math.round(s.x-cx),Math.round(s.y),s.col||'#fff',1,'#000');
 drawHUD();
 if(G.mode==='flag'&&G.flag&&G.flag.phase>=2){ctx.fillStyle='rgba(10,6,24,0.7)';ctx.fillRect(48,70,160,74);ctx.fillStyle='#ffd870';ctx.fillRect(48,70,160,2);ctx.fillRect(48,142,160,2);
  textC(G.flag.boss?'MAGMUS DEFEATED!':'STAGE CLEAR!',78,'#ffd870');textC('TIME BONUS  '+String(lv.time*50).padStart(5,' '),96,'#fff');textC('COINS  x'+String(G.coins).padStart(2,'0'),108,'#fff');
  textC('SCORE  '+String(G.score).padStart(6,'0'),122,'#7affc0')}}
function drawTitle(){const t=G.frame;const cx=Math.floor(t*0.6);drawBG(THEMES.over,cx);
 const ts=TILESETS.over;for(let x=-1;x<18;x++){const px=x*16-(cx%16);ctx.drawImage(ts.Gt,px,208);ctx.drawImage(ts.G,px,224)}
 // logo
 const logo='BRICK DASH',sc=3,lw=textW(logo,sc),lx=(W-lw)/2;
 ctx.fillStyle='rgba(20,10,40,0.55)';ctx.fillRect(lx-10,30,lw+20,44);ctx.fillStyle='#ffd870';ctx.fillRect(lx-10,30,lw+20,2);ctx.fillRect(lx-10,72,lw+20,2);
 for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1],[2,2],[1,2],[2,1]])text(logo,lx+dx,40+dy,'#2a1240',sc,null);
 text(logo,lx,40,'#ff8a3a',sc,null);ctx.save();ctx.beginPath();ctx.rect(0,40,W,9);ctx.clip();text(logo,lx,40,'#ffd870',sc,null);ctx.restore();
 textC('A COURIER FOX ADVENTURE',80,'#ffffff');
 // hero runs across
 const hx=((t*1.4)%(W+60))-30;const fr=['w1','stand','w2','stand'][(t>>3)%4];ctx.drawImage(HERO.normal.s[fr][0],Math.round(hx),192);
 ctx.drawImage(ART.blob[(t>>3)&1][1],Math.round(((W+40)-(t*0.7)%(W+80))),192);
 const blink=(t>>5)&1;
 if(blink)textC(touchMode?'TAP A TO START':'PRESS JUMP TO START',106,'#ffffff');
 if(G.unlocked>1){const s=G.sel;textC('< STAGE '+(s+1)+' >',124,'#ffd870');textC(LEVEL_NAMES[s],134,'#c0e0ff')}
 else textC('STAGE 1  '+LEVEL_NAMES[0],128,'#c0e0ff');
 textC('BEST '+String(G.best).padStart(6,'0'),150,'#7affc0');
 textC(touchMode?'D-PAD MOVE   A JUMP   B RUN/FIRE':'ARROWS MOVE  Z JUMP  X RUN/FIRE',166,'#ffffff');
 if(!touchMode)textC('P PAUSE   M MUTE',176,'#d0d0e0')}
const LEVEL_NAMES=LEVELS.map(f=>f().name);
function drawIntro(){ctx.fillStyle='#0a0618';ctx.fillRect(0,0,W,H);textC('STAGE '+(G.stage+1),78,'#ffd870',2);textC(lv.name,104,'#ffffff');
 ctx.drawImage(HERO.normal.s.stand[0],104,126);text('x '+G.lives,126,131,'#fff');
 textC('SCORE '+String(G.score).padStart(6,'0'),160,'#c0c0d0');textC('BEST  '+String(G.best).padStart(6,'0'),172,'#7affc0');
 if(G.cp)textC('FROM CHECKPOINT',190,'#ffd870')}
function drawGameOver(){ctx.fillStyle='#0a0618';ctx.fillRect(0,0,W,H);textC('GAME OVER',90,'#ff6a5a',2);textC('SCORE '+String(G.score).padStart(6,'0'),122,'#fff');
 textC('BEST  '+String(G.best).padStart(6,'0'),134,'#7affc0');if(G.newBest)textC('NEW BEST!',148,'#ffd870');if(G.timer>90&&(G.frame>>5)&1)textC(touchMode?'TAP A':'PRESS JUMP',176,'#fff')}
function drawWin(){ctx.fillStyle='#120a2a';ctx.fillRect(0,0,W,H);for(let i=0;i<40;i++){ctx.fillStyle=(i+G.frame>>4)%5?'#8080c0':'#ffffff';ctx.fillRect((hash(i,1)*W)|0,(hash(i,2)*120)|0,1,1)}
 for(const f of FW){ctx.fillStyle=f.t<40?f.c:'#606080';ctx.fillRect(Math.round(f.x),Math.round(f.y),2,2)}
 const ts=TILESETS.over;for(let x=0;x<16;x++){ctx.drawImage(ts.Gt,x*16,208);ctx.drawImage(ts.G,x*16,224)}
 drawHut({hut:9},0);ctx.drawImage(HERO.normal.b[(G.frame>>4)&1?'stand':'jump'][0],100,176);
 textC('PARCELS DELIVERED!',40,'#ffd870',1);textC('CINDER KEEP IS QUIET AGAIN',54,'#ffffff');textC('FINAL SCORE '+String(G.score).padStart(6,'0'),74,'#fff');
 textC((G.newBest?'NEW BEST! ':'BEST ')+String(G.best).padStart(6,'0'),86,'#7affc0');textC('THANKS FOR PLAYING',104,'#c0e0ff');
 if(G.timer>150&&(G.frame>>5)&1)textC(touchMode?'TAP A':'PRESS JUMP',124,'#fff')}
function drawPause(){ctx.fillStyle='rgba(8,4,20,0.72)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ffd870';ctx.fillRect(64,72,128,2);ctx.fillRect(64,150,128,2);
 textC('PAUSED',84,'#ffd870',2);const o=['RESUME','QUIT TO TITLE'];o.forEach((s,i)=>textC((G.pauseSel===i?'> ':'  ')+s+(G.pauseSel===i?' <':'  '),112+i*14,G.pauseSel===i?'#fff':'#9090b0'));}
function render(){
 switch(G.mode){case 'title':drawTitle();break;case 'intro':drawIntro();break;case 'gameover':drawGameOver();break;case 'win':drawWin();break;default:drawWorld()}
 if(G.paused)drawPause();
 if(AU.muted&&G.mode==='title')text('MUTED',4,228,'#ff8080')}

// =====================================================================
//  MAIN LOOP - fixed 60Hz timestep with accumulator
// =====================================================================
let acc=0,last=performance.now(),PERF={frames:0,upd:0,updMs:0,rndMs:0,maxMs:0};
function frame(now){requestAnimationFrame(frame);let dt=now-last;last=now;if(dt>250)dt=250;if(Math.abs(dt-STEP_MS)<1.2)dt=STEP_MS;
 const t0=performance.now();
 if(!G.manual){acc+=dt;let n=0;while(acc>=STEP_MS-0.01&&n<5){try{update()}catch(e){console.error(e);throw e}acc-=STEP_MS;n++;PERF.upd++}if(n>=5)acc=0}
 const t1=performance.now();Music.tick();render();const t2=performance.now();
 PERF.frames++;PERF.updMs+=t1-t0;PERF.rndMs+=t2-t1;PERF.maxMs=Math.max(PERF.maxMs,t2-t0)}
loadSave();layout();setTimeout(layout,300);requestAnimationFrame(frame);
if('serviceWorker' in navigator&&location.protocol==='https:'){/* no SW needed; manifest provides Add to Home Screen */}

// =====================================================================
//  TEST / DEBUG API (used by the automated Playwright suite)
// =====================================================================
window.BD={G,DBG,PH,PERF,LEVELS,ROOMS,THEMES,SOLID,
 get lv(){return lv},get P(){return P},cam,
 manual(v){G.manual=v;acc=0},
 step(n,inp){inputOverride=inp||{};for(let i=0;i<(n||1);i++)update();inputOverride=null},
 render(){render()},
 resetInput(){prevRaw={}},ui(){return UI.geo},
 start(stage,o={}){Object.assign(DBG,{noEnemies:false,noItems:false,noTimer:false,god:false},o.dbg||{});G.score=0;G.coins=0;G.lives=o.lives||3;G.carry=o.size||0;G.cp=!!o.cp;startStage(stage,!!o.cp);G.mode='play';G.paused=false;Music.play(lv.music,true)},
 state(){return {mode:G.mode,stage:G.stage,paused:G.paused,score:G.score,coins:G.coins,lives:G.lives,cp:G.cp,time:lv&&lv.time,room:lv&&lv.isRoom,camX:cam.x,
  p:{x:P.x,y:P.y,w:P.w,h:P.h,vx:P.vx,vy:P.vy,size:P.size,onGround:P.onGround,dead:P.dead,star:P.star,inv:P.inv,plat:P.plat},
  ents:lv?lv.ents.map(e=>({t:e.t,x:e.x,y:e.y,dead:e.dead,squash:e.squash,moving:e.moving,active:e.active})):[],items:lv?lv.items.map(i=>({kind:i.kind,x:i.x,y:i.y})):[],
  boss:lv&&lv.boss?{hp:lv.boss.hp,state:lv.boss.state,active:lv.boss.active,x:lv.boss.x,y:lv.boss.y}:null}},
 tile(tx,ty){return lv.map[ty][tx]},setTile(tx,ty,c){lv.map[ty][tx]=c},
 place(x,y){P.x=x;P.y=y;P.vx=0;P.vy=0;P.plat=-1;cam.x=clamp(Math.max(cam.x,x+P.w/2-cam.dead),0,lv.w*16-W)},
 setCam(x){cam.x=x},
 setSize(s){setSize(P,s)},
 spawn(t,tx,ty){const e=makeEnt({t,x:tx,y:ty});e.active=true;lv.ents.push(e);return lv.ents.length-1},
 clearEnts(){lv.ents=[];lv.items=[]},
 // pure-physics hooks for the level verifier
 _H:HERO,_A:ART,_T:TILESETS,sim:{newPlayer,stepPlayer,physStep,updatePlats,platPos,hazardOf,geyserState,columnTop,buildLevel:(i)=>LEVELS[i]()}};
