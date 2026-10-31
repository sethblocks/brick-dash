// =====================================================================
//  CORE PHYSICS (shared by the game and the automated level verifier)
// =====================================================================
const PH={walk:1.5,run:2.6,accW:0.055,accR:0.085,fric:0.07,skid:0.2,airAcc:0.07,jv:4.4,jvRun:4.9,gHold:0.17,g:0.6,maxFall:4.6,coyote:6,buffer:7,stomp:4.9,stompLo:3.4};
const SMALL_H=14,BIG_H=27;
function newPlayer(size){return {x:0,y:0,w:12,h:size?BIG_H:SMALL_H,vx:0,vy:0,size:size||0,onGround:false,face:1,skid:false,jumping:false,coyote:0,buffer:0,plat:-1,runJump:false,anim:0,inv:0,star:0,dead:false,combo:0,hidden:false}}
function boxHits(wd,x,y,w,h){const x0=Math.floor(x/16),x1=Math.floor((x+w-0.01)/16),y0=Math.floor(y/16),y1=Math.floor((y+h-0.01)/16);
 for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)if(wd.solid(tx,ty))return true;return false}
function moveX(p,dx,wd,carry){if(!dx)return false;p.x+=dx;
 const y0=Math.floor(p.y/16),y1=Math.floor((p.y+p.h-0.01)/16);
 const tx=dx>0?Math.floor((p.x+p.w-0.01)/16):Math.floor(p.x/16);
 for(let ty=y0;ty<=y1;ty++)if(wd.solid(tx,ty)){
  const ov=p.y+p.h-ty*16;  // ledge assist: clipping a ledge corner by a few px while falling pops you on top
  if(!carry&&ty===y1&&p.vy>0&&ov<=Math.min(6,p.vy+2)&&!boxHits(wd,p.x,ty*16-p.h,p.w,p.h)){p.y=ty*16-p.h;continue}
  if(dx>0)p.x=tx*16-p.w;else p.x=(tx+1)*16;if(p.vx*dx>0)p.vx=0;return true}
 return false}
function moveY(p,dy,wd){p.onGround=false;if(!dy)return;p.y+=dy;
 const x0=Math.floor(p.x/16),x1=Math.floor((p.x+p.w-0.01)/16);
 if(dy>0){const ty=Math.floor((p.y+p.h-0.01)/16);
  for(let tx=x0;tx<=x1;tx++)if(wd.solid(tx,ty)){p.y=ty*16-p.h;p.vy=0;p.onGround=true;p.jumping=false;return}
 } else {const ty=Math.floor(p.y/16),prevTop=p.y-dy,fromBelow=prevTop>=(ty+1)*16-0.01;
  const up=tx=>wd.solid(tx,ty)||(fromBelow&&wd.hidden(tx,ty));
  const hA=up(x0),hB=x1!==x0&&up(x1);
  if(!hA&&!hB)return;
  if(x1!==x0&&hA!==hB){ // corner correction: slide around a ceiling corner clipped by <=5px
   if(hA){const nx=(x0+1)*16;if(nx-p.x<=5&&!boxHits(wd,nx,p.y,p.w,p.h)){p.x=nx;return}}
   else{const nx=x1*16-p.w;if(p.x-nx<=5&&!boxHits(wd,nx,p.y,p.w,p.h)){p.x=nx;return}}}
  const cx=Math.floor((p.x+p.w/2)/16);const btx=(cx===x0&&hA)||(cx===x1&&hB)?cx:(hA?x0:x1);
  p.y=(ty+1)*16;p.vy=0;p.jumping=false;wd.headHit(btx,ty,p)}}
function physStep(p,inp,wd){
 const dir=(inp.r?1:0)-(inp.l?1:0),max=inp.run?PH.run:PH.walk;
 if(p.onGround){
  if(dir){if(p.vx*dir<0){p.vx+=dir*PH.skid;p.skid=true;if(p.vx*dir>0)p.vx=0}
   else{p.skid=false;const s=p.vx*dir,acc=inp.run?PH.accR:PH.accW;if(s<max)p.vx=dir*Math.min(max,s+acc);else if(s>max)p.vx=dir*Math.max(max,s-PH.fric)}
   p.face=dir}
  else{p.skid=false;p.vx=Math.abs(p.vx)<=PH.fric?0:p.vx-sign(p.vx)*PH.fric}
 } else if(dir){const cap=(inp.run||p.runJump)?PH.run:PH.walk,s=p.vx*dir;if(s<cap)p.vx=dir*Math.min(cap,s+PH.airAcc)}
 if(inp.jp)p.buffer=PH.buffer;else if(p.buffer>0)p.buffer--;
 if(p.onGround)p.coyote=PH.coyote;else if(p.coyote>0)p.coyote--;
 let jumped=false;
 if(p.buffer>0&&p.coyote>0){p.vy=-(Math.abs(p.vx)>=2.0?PH.jvRun:PH.jv);p.buffer=0;p.coyote=0;p.onGround=false;p.jumping=true;p.skid=false;
  p.runJump=Math.abs(p.vx)>PH.walk+0.05;p.plat=-1;jumped=true}
 if(!inp.j)p.jumping=false;
 p.vy+=(p.vy<0&&p.jumping)?PH.gHold:PH.g;if(p.vy>PH.maxFall)p.vy=PH.maxFall;
 moveX(p,p.vx,wd,false);
 const dy=p.vy,prevBottom=p.y+p.h;moveY(p,dy,wd);
 p.plat=-1;
 if(!p.onGround&&dy>=0){for(let i=0;i<wd.plats.length;i++){const pl=wd.plats[i];
  if(p.x+p.w>pl.x+1&&p.x<pl.x+pl.w-1&&prevBottom<=Math.max(pl.py,pl.y)+0.5&&p.y+p.h>=pl.y){p.y=pl.y-p.h;p.vy=0;p.onGround=true;p.jumping=false;p.plat=i;break}}}
 return jumped}
function stepPlayer(p,inp,wd,cam){
 if(p.plat>=0){const pl=wd.plats[p.plat];const dx=pl.x-pl.px;if(dx)moveX(p,dx,wd,true);p.y=pl.y-p.h}
 const j=physStep(p,inp,wd);
 if(p.x<cam.x){p.x=cam.x;if(p.vx<0)p.vx=0}
 const mx=wd.w*16-p.w;if(p.x>mx){p.x=mx;if(p.vx>0)p.vx=0}
 if(p.x+p.w/2-cam.x>cam.dead)cam.x=Math.min(p.x+p.w/2-cam.dead,wd.w*16-W);
 return j}
function platPos(pl,t){const s=0.5-0.5*Math.cos(2*Math.PI*((t+pl.phase)/pl.period));return pl.axis==='x'?[pl.bx+pl.range*s,pl.by]:[pl.bx,pl.by-pl.range*s]}
function updatePlats(plats,t){for(const pl of plats){pl.px=pl.x;pl.py=pl.y;const q=platPos(pl,t);pl.x=q[0];pl.y=q[1]}}
function geyserState(g,t){const ph=(t+g.offset)%g.period;return ph>=g.period-g.on?2:ph>=g.period-g.on-40?1:0}
function geyserBox(g){return {x:g.x*16+3,y:208-g.height*16,w:10,h:g.height*16}}
function hazardOf(p,map,w,geysers,t){
 if(p.y>H+4)return 'pit';
 const x0=Math.floor((p.x+1)/16),x1=Math.floor((p.x+p.w-1)/16),y0=Math.max(0,Math.floor(p.y/16)),y1=Math.min(ROWS-1,Math.floor((p.y+p.h-1)/16));
 for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){if(tx<0||tx>=w)continue;const c=map[ty][tx];if(c==='l'||(c==='L'&&p.y+p.h>ty*16+6))return 'lava'}
 for(const g of geysers)if(geyserState(g,t)===2&&overlap(p,geyserBox(g)))return 'fire';
 return null}
function columnTop(map,tx,from){const sol=ty=>SOLID[map[ty][tx]]||SOLID[map[ty][tx+1]];let ty=from||3;while(ty<ROWS&&sol(ty))ty++;for(;ty<ROWS;ty++)if(sol(ty))return ty;return 13}

// =====================================================================
//  GAME STATE
// =====================================================================
var G={mode:'title',frame:0,paused:false,pauseSel:0,score:0,coins:0,lives:3,stage:0,best:0,unlocked:1,sel:0,timer:0,freeze:0,sizeAnim:null,cp:false,carry:0,main:null,pipe:null,flag:null,newBest:false,manual:false};
const DBG={noEnemies:false,noItems:false,noTimer:false,god:false};
let lv=null,P=newPlayer(0),WD=null;const cam={x:0,dead:112};
function loadSave(){try{G.best=+localStorage.getItem('brickdash.best')||0;G.unlocked=clamp(+localStorage.getItem('brickdash.unlocked')||1,1,LEVELS.length)}catch(e){}G.sel=G.unlocked-1}
function saveProgress(){if(G.score>G.best){G.best=G.score;G.newBest=true}try{localStorage.setItem('brickdash.best',String(G.best));localStorage.setItem('brickdash.unlocked',String(G.unlocked))}catch(e){}}
function tileAt(L,tx,ty){if(ty<0||ty>=ROWS)return ' ';if(tx<0||tx>=L.w)return 'X';return L.map[ty][tx]}
function tileSolid(L,tx,ty){if(ty>=ROWS||ty<0)return false;if(tx<0||tx>=L.w)return true;return SOLID[L.map[ty][tx]]===1}
const ENT_SIZE={blob:[12,13],beetle:[12,14],flyer:[12,12],hopper:[12,12]};
function makeEnt(d){const [w,h]=ENT_SIZE[d.t];const e={t:d.t,x:d.x*16+2,y:(d.y+1)*16-h,w,h,vx:0,vy:0,dir:-1,active:false,dead:false,squash:0,anim:0,moving:false,wake:0,kickGrace:0,timer:60,ph:0,onGround:false};
 if(d.t==='flyer'){e.bx=e.x;e.by=e.y}return e}
function buildLevel(def){
 const L={def,w:def.w,theme:THEMES[def.theme],ts:TILESETS[def.theme],name:def.name,map:def.map.map(r=>r.slice()),content:Object.assign({},def.content),
  plats:def.plats.map(p=>{const o=Object.assign({},p,{bx:p.x*16,by:p.y*16,w:p.w*16,h:8});const q=platPos(o,0);o.x=o.px=q[0];o.y=o.py=q[1];return o}),
  geysers:def.geysers.map(g=>Object.assign({},g)),ents:DBG.noEnemies?[]:def.ents.map(makeEnt),items:[],fx:[],pops:[],bumps:[],sparks:[],bfire:[],t:0,time:def.time,tick:0,multi:{},
  warps:def.warps,exitTube:def.exitTube,exit:def.exit,isRoom:!!def.exit,flag:def.flag,hut:def.hut,checkpoint:def.checkpoint,decor:def.decor,boss:null,music:def.music};
 if(L.flag){L.map[12][L.flag]='X';L.flagY=56}
 if(def.boss&&!DBG.noEnemies)L.boss={x:def.boss.x*16,y:13*16-28,w:28,h:28,vx:0,vy:0,hp:6,state:'idle',t:0,inv:0,minX:def.boss.minX*16,maxX:(def.boss.maxX+1)*16,dir:-1,fireT:100,jumpT:160,onGround:false,active:false,anim:0};
 L.wd={w:L.w,plats:L.plats,solid:(tx,ty)=>tileSolid(L,tx,ty),hidden:(tx,ty)=>tileAt(L,tx,ty)==='h',headHit:(tx,ty,p)=>headHit(L,tx,ty,p)};
 return L}
function setLevel(L){lv=L;WD=L.wd}
function placeAt(p,tx){p.x=tx*16+2;const ty=columnTop(lv.map,tx,3);p.y=ty*16-p.h;p.vx=p.vy=0;p.onGround=true;p.plat=-1}
function startStage(stage,fromCp){G.stage=stage;G.pipe=null;G.flag=null;G.freeze=0;G.sizeAnim=null;G.main=null;setLevel(buildLevel(LEVELS[stage]()));
 P=newPlayer(G.carry);placeAt(P,fromCp&&lv.checkpoint?lv.checkpoint:lv.def.start);P.face=1;
 cam.x=clamp(P.x+P.w/2-cam.dead,0,lv.w*16-W);if(!fromCp)cam.x=0;Music.tempo=1}
function newGame(stage){G.score=0;G.coins=0;G.lives=3;G.carry=0;G.cp=false;G.newBest=false;goIntro(stage)}
function goIntro(stage){G.stage=stage;G.mode='intro';G.timer=0;Music.stop();startStage(stage,G.cp)}
function addScore(n,x,y){G.score+=n;if(x!==undefined)lv.pops.push({x,y,txt:String(n),t:0})}
function oneUp(x,y){G.lives=Math.min(99,G.lives+1);sfx('oneup');if(x!==undefined)lv.pops.push({x,y,txt:'1UP',t:0,col:'#7aff7a'})}
function addCoin(){G.coins++;G.score+=200;sfx('coin');if(G.coins>=100){G.coins-=100;oneUp(P.x,P.y-8)}}
const COMBO=[100,200,400,500,800,1000,2000,4000,5000,8000];
function comboScore(n,x,y){if(n>=COMBO.length)oneUp(x,y);else addScore(COMBO[n],x,y)}
// ---------- blocks ----------
function bump(L,tx,ty){L.bumps.push({tx,ty,t:0});
 for(const e of L.ents)if(e.active&&!e.dead&&!e.squash&&e.x+e.w>tx*16&&e.x<tx*16+16&&Math.abs(e.y+e.h-ty*16)<=3){killFlip(e);addScore(100,e.x,e.y)}
 for(const it of L.items)if(!it.emerge&&it.x+it.w>tx*16&&it.x<tx*16+16&&Math.abs(it.y+it.h-ty*16)<=3){it.vy=-3.5;it.dir=it.x+it.w/2<tx*16+8?-1:1}
 if(ty>0&&L.map[ty-1][tx]==='o'){L.map[ty-1][tx]=' ';coinPop(L,tx,ty-1);addCoin()}}
function coinPop(L,tx,ty){L.fx.push({k:'coin',x:tx*16,y:ty*16,vy:-4.5,t:0})}
function giveContent(L,tx,ty,c,p){
 if(c==='coin'||c==='coins'||DBG.noItems){coinPop(L,tx,ty-1);addCoin();return}
 let kind=c==='pow'?(p.size===0?'berry':'bulb'):c==='star'?'comet':c==='1up'?'heart':'berry';
 L.items.push({kind,x:tx*16+1,y:ty*16,w:14,h:14,vx:0,vy:0,dir:1,emerge:32,t:0,baseY:ty*16-14,onGround:false});sfx('appear')}
function headHit(L,tx,ty,p){if(ty<0||ty>=ROWS)return;const ch=L.map[ty][tx],key=tx+','+ty;
 if(ch==='h'||ch==='Q'){L.map[ty][tx]='E';giveContent(L,tx,ty,L.content[key]||'coin',p);bump(L,tx,ty);return}
 if(ch==='B'){const c=L.content[key];
  if(c==='coins'){if(L.multi[key]===undefined)L.multi[key]=8;giveContent(L,tx,ty,'coin',p);if(--L.multi[key]<=0)L.map[ty][tx]='E';bump(L,tx,ty);return}
  if(c){L.map[ty][tx]='E';giveContent(L,tx,ty,c,p);bump(L,tx,ty);return}
  if(p.size>0){L.map[ty][tx]=' ';for(let i=0;i<4;i++)L.fx.push({k:'deb',x:tx*16+4+(i&1)*8,y:ty*16+4+(i>>1)*8,vx:(i&1?1.2:-1.2),vy:i>>1?-3:-5,t:0});
   addScore(50);sfx('break');bump(L,tx,ty);L.bumps.pop();return}
  bump(L,tx,ty);sfx('bump');return}
 sfx('bump')}
// ---------- player state changes ----------
function setSize(p,s){const oh=p.h;p.size=s;p.h=s?BIG_H:SMALL_H;p.y+=oh-p.h}
function powerUp(kind,it){const p=P;
 if(kind==='berry'){addScore(1000,it.x,it.y);if(p.size===0){G.sizeAnim={from:0,to:1};G.freeze=36;setSize(p,1);sfx('power')}else sfx('power')}
 else if(kind==='bulb'){addScore(1000,it.x,it.y);if(p.size!==2){G.sizeAnim={from:p.size,to:2};G.freeze=36;setSize(p,2)}sfx('power')}
 else if(kind==='comet'){addScore(1000,it.x,it.y);p.star=600;Music.play('star');sfx('power')}
 else if(kind==='heart'){oneUp(it.x,it.y)}}
function hurtPlayer(){const p=P;if(p.dead||p.inv>0||p.star>0||DBG.god||G.mode!=='play')return;
 if(p.size>0){const from=p.size;setSize(p,p.size===2?1:0);p.inv=120;G.freeze=30;G.sizeAnim={from,to:p.size};sfx('hurt')}else killPlayer()}
function killPlayer(){if(P.dead)return;P.dead=true;P.vx=0;P.vy=0;P.star=0;G.mode='dying';G.timer=0;Music.play('die',true);G.carry=0}
function killFlip(e){e.dead=true;e.vy=-3;e.vx=e.vx>0?0.6:-0.6;e.flip=true}
// ---------- entities ----------
function entPhys(L,e,grav,maxf){e.vy=Math.min(e.vy+grav,maxf);let hitX=false;e.x+=e.vx;
 const y0=Math.floor(e.y/16),y1=Math.floor((e.y+e.h-0.01)/16);
 if(e.vx){const tx=e.vx>0?Math.floor((e.x+e.w-0.01)/16):Math.floor(e.x/16);for(let ty=y0;ty<=y1;ty++)if(tileSolid(L,tx,ty)){e.x=e.vx>0?tx*16-e.w:(tx+1)*16;hitX=true;break}}
 e.onGround=false;e.y+=e.vy;const x0=Math.floor(e.x/16),x1=Math.floor((e.x+e.w-0.01)/16);
 if(e.vy>0){const ty=Math.floor((e.y+e.h-0.01)/16);for(let tx=x0;tx<=x1;tx++)if(tileSolid(L,tx,ty)){e.y=ty*16-e.h;e.vy=0;e.onGround=true;break}}
 else if(e.vy<0){const ty=Math.floor(e.y/16);for(let tx=x0;tx<=x1;tx++)if(tileSolid(L,tx,ty)){e.y=(ty+1)*16;e.vy=0;break}}
 return hitX}
const SPEED={blob:0.5,beetle:0.45};
function updateEnemies(L){const cx=cam.x;
 for(const e of L.ents){
  if(!e.active){if(e.x<cx+W+24&&e.x>cx-40)e.active=true;else continue}
  e.anim++;
  if(e.dead){e.vy+=0.25;e.x+=e.vx;e.y+=e.vy;if(e.y>H+20)e.gone=true;continue}
  if(e.squash){if(--e.squash<=0)e.gone=true;continue}
  if(e.kickGrace>0)e.kickGrace--;
  switch(e.t){
   case 'blob':case 'beetle':e.vx=e.dir*SPEED[e.t];if(entPhys(L,e,0.3,4))e.dir=-e.dir;break;
   case 'shell':if(e.moving){e.vx=e.dir*3.6;if(entPhys(L,e,0.3,4)){e.dir=-e.dir;if(e.x>cx-16&&e.x<cx+W)sfx('bump')}
     for(const o of L.ents){if(o===e||!o.active||o.dead||o.squash||!overlap(e,o))continue;
      if(o.t==='shell'&&o.moving){killFlip(o);killFlip(e);addScore(500,e.x,e.y);break}
      killFlip(o);comboScore(e.chain||0,o.x,o.y);e.chain=(e.chain||0)+1;sfx('kick')}}
    else{e.vx=0;entPhys(L,e,0.3,4);if(--e.wake<=0){e.t='beetle';e.h=14;e.dir=P.x<e.x?-1:1}}break;
   case 'flyer':e.ph++;e.x=e.bx+Math.sin(e.ph*0.022)*44;e.y=e.by+Math.sin(e.ph*0.044)*12;e.dir=Math.cos(e.ph*0.022)>0?1:-1;break;
   case 'hopper':{entPhys(L,e,0.25,4);if(e.onGround){e.vx=0;if(--e.timer<=0){e.vy=-4.6;e.dir=P.x<e.x?-1:1;e.vx=e.dir*1.0;e.timer=80}}break}}
  if(e.y>H+20)e.gone=true;
  if(e.x<cx-96||e.x>cx+W+320)e.gone=true;}
 // walkers turn when they bump into each other
 const ws=L.ents.filter(e=>e.active&&!e.dead&&!e.squash&&(e.t==='blob'||e.t==='beetle'||(e.t==='hopper'&&e.onGround)));
 for(let i=0;i<ws.length;i++)for(let j=i+1;j<ws.length;j++){const a=ws[i],b=ws[j];if(overlap(a,b)){const d=sign((a.x-b.x)||1);a.dir=d;b.dir=-d}}
 if(L.ents.some(e=>e.gone))L.ents=L.ents.filter(e=>!e.gone)}
function stompOK(p,o){return p.vy>0&&(p.y+p.h)-o.y<=Math.max(7,p.vy+5)}
function playerVsEnemies(L,inp){const p=P;if(p.dead)return;
 for(const e of L.ents){if(!e.active||e.dead||e.squash||!overlap(p,e))continue;
  if(p.star>0){killFlip(e);comboScore(p.combo++,e.x,e.y);sfx('kick');continue}
  if(e.t==='shell'&&!e.moving){e.moving=true;e.dir=(p.x+p.w/2<e.x+e.w/2)?1:-1;e.kickGrace=14;e.chain=0;addScore(400,e.x,e.y);sfx('kick');
   if(stompOK(p,e)){p.y=e.y-p.h;p.vy=-PH.stompLo;p.jumping=false}continue}
  if(e.t==='shell'&&e.kickGrace>0)continue;
  if(stompOK(p,e)){
   comboScore(p.combo++,e.x,e.y);sfx('stomp');
   if(e.t==='blob'){e.squash=30}
   else if(e.t==='beetle'){e.t='shell';e.moving=false;e.vx=0;e.wake=480}
   else if(e.t==='shell'){e.moving=false;e.vx=0;e.wake=480}
   else{killFlip(e);e.vy=0}
   p.y=e.y-p.h;p.vy=-(inp.j?PH.stomp:PH.stompLo);p.jumping=!!inp.j;p.onGround=false;
  } else hurtPlayer()}}
function updateItems(L){
 for(const it of L.items){it.t++;
  if(it.emerge>0){it.emerge--;it.y=it.baseY+it.emerge*0.5;if(!it.emerge){it.dir=1;if(it.kind==='comet')it.vy=-4}continue}
  if(it.kind==='bulb'){continue}
  it.vx=(it.dir||1)*(it.kind==='comet'?1.3:1);
  if(entPhys(L,it,it.kind==='comet'?0.22:0.3,4)){it.dir=-(it.dir||1)}
  if(it.kind==='comet'&&it.onGround)it.vy=-4;
  if(it.y>H+20)it.gone=true}
 for(const it of L.items){if(!it.gone&&it.emerge<20&&overlap(P,it)&&!P.dead){it.gone=true;powerUp(it.kind,it)}}
 if(L.items.some(i=>i.gone))L.items=L.items.filter(i=>!i.gone)}
function updateSparks(L){
 for(const s of L.sparks){s.t++;s.vx=s.dir*4.2;const hit=entPhys(L,s,0.35,4);if(hit||s.y>H||s.x<cam.x-16||s.x>cam.x+W+16){s.gone=true;L.fx.push({k:'poof',x:s.x,y:s.y,t:0});continue}
  if(s.onGround)s.vy=-3.2;
  for(const e of L.ents){if(e.active&&!e.dead&&!e.squash&&overlap(s,e)){killFlip(e);addScore(200,e.x,e.y);s.gone=true;sfx('kick');L.fx.push({k:'poof',x:s.x,y:s.y,t:0});break}}
  const b=L.boss;if(!s.gone&&b&&b.active&&b.state==='fight'&&overlap(s,b)){s.gone=true;L.fx.push({k:'poof',x:s.x,y:s.y,t:0});if(b.inv<=0)bossHit(1)}}
 if(L.sparks.some(s=>s.gone))L.sparks=L.sparks.filter(s=>!s.gone)}
function bossHit(n){const b=lv.boss;b.hp-=n;b.inv=n>1?70:24;sfx('bosshit');addScore(n>1?1000:200,b.x,b.y);
 if(b.hp<=0){b.state='defeat';b.t=0;lv.bfire=[];addScore(10000,b.x,b.y-10);Music.stop();sfx('bossdie')}}
function updateBoss(L){const b=L.boss;if(!b)return;
 if(!b.active){if(cam.x>=L.w*16-W-1&&P.x>b.minX-180){b.active=true;b.state='fight';Music.play('boss')}return}
 b.anim++;if(b.inv>0)b.inv--;
 if(b.state==='fight'){const rage=6-b.hp;const sp=0.55+rage*0.13;
  b.vx=b.dir*sp;entPhys(L,b,0.25,5);if(b.x<b.minX){b.x=b.minX;b.dir=1}if(b.x+b.w>b.maxX){b.x=b.maxX-b.w;b.dir=-1}
  if(b.onGround&&--b.jumpT<=0){b.vy=-5.2;b.jumpT=110+b.hp*12}
  if(--b.fireT<=0){const d=P.x<b.x?-1:1;L.bfire.push({x:b.x+(d<0?0:b.w-10),y:b.y+6,w:10,h:10,vx:d*(1.5+rage*0.12),vy:-3.4,t:0});b.fireT=80+b.hp*10;sfx('bossfire')}
  if(!P.dead&&overlap(P,b)){
   if(P.star>0&&b.inv<=0)bossHit(2);
   else if(stompOK(P,b)){if(b.inv<=0)bossHit(2);P.y=b.y-P.h;P.vy=-5.4;P.jumping=false;P.onGround=false}
   else hurtPlayer()}}
 else if(b.state==='defeat'){b.t++;if(b.t>70){b.vy=Math.min(b.vy+0.15,3);b.y+=b.vy}if(b.t%12===0)L.fx.push({k:'poof',x:b.x+hash(b.t,1)*28,y:b.y+hash(b.t,2)*28,t:0});
  if(b.t===200){startTally(true)}}
 for(const f of L.bfire){f.t++;f.vy+=0.11;f.x+=f.vx;f.y+=f.vy;if(f.y>H+10)f.gone=true;if(!P.dead&&overlap(P,{x:f.x+2,y:f.y+2,w:6,h:6}))hurtPlayer()}
 if(L.bfire.some(f=>f.gone))L.bfire=L.bfire.filter(f=>!f.gone)}
// ---------- tubes ----------
function tryTube(inp){if(!inp.d||!P.onGround||P.plat>=0)return false;
 const list=lv.isRoom?[{x:lv.exit.x,top:lv.exit.top,back:true}]:lv.warps;const cx=P.x+P.w/2;
 for(const w of list){if(Math.abs(P.y+P.h-w.top*16)<1&&cx>=w.x*16+7&&cx<=w.x*16+25){
  P.vx=0;G.pipe={dir:'down',t:0,w};sfx('pipe');return true}}return false}
function updatePipe(){const pp=G.pipe;pp.t++;
 if(pp.dir==='down'){P.y+=0.8;if(pp.t>=40){
   if(pp.w.back){const room=lv;setLevel(G.main.L);cam.x=G.main.camX;lv.time=room.time;lv.tick=room.tick;G.main=null;
    const et=lv.exitTube;P.x=et.x*16+16-P.w/2;P.y=et.top*16;cam.x=clamp(Math.max(cam.x,P.x-100),0,lv.w*16-W);G.pipe={dir:'up',t:0,top:et.top};sfx('pipe')}
   else{G.main={L:lv,camX:cam.x};const room=buildLevel(ROOMS[pp.w.room]());room.time=lv.time;room.tick=lv.tick;setLevel(room);cam.x=0;
    P.x=room.def.start*16+2;P.y=3*16;P.vx=P.vy=0;P.plat=-1;G.pipe=null}}}
 else{P.y-=0.8;if(P.y+P.h<=pp.top*16){P.y=pp.top*16-P.h;P.vy=0;G.pipe=null}}}
// ---------- flag & tally ----------
function startFlag(){const L=lv,p=P;G.mode='flag';const bottom=p.y+p.h,frac=(bottom-48)/(192-48);
 const pts=frac<0.15?5000:frac<0.35?2000:frac<0.55?800:frac<0.8?400:100;addScore(pts,L.flag*16+12,Math.max(40,p.y));
 G.flag={phase:0,t:0,pts};p.x=L.flag*16+8-p.w;p.vx=0;p.vy=0;p.star=0;Music.stop();sfx('flag')}
function startTally(boss){G.mode='flag';if(!G.flag)G.flag={phase:2,t:0,pts:0};G.flag.phase=2;G.flag.t=0;G.flag.boss=!!boss;Music.play('clear',true)}
function updateFlag(){const f=G.flag,L=lv,p=P;f.t++;
 if(f.phase===0){let done=true;if(p.y+p.h<192){p.y=Math.min(p.y+2,192-p.h);done=false}if(L.flagY<176){L.flagY+=2;done=false}
  if(done&&f.t>36){f.phase=1;f.t=0;p.x=L.flag*16+9;p.face=1;Music.play('clear',true)}}
 else if(f.phase===1){stepPlayer(p,{r:true},WD,cam);p.anim+=Math.abs(p.vx)*0.2;if(p.x>=(L.hut+2)*16-p.w/2){p.hidden=true;f.phase=2;f.t=0}}
 else if(f.phase===2){if(f.t>40){if(lv.time>0){const n=Math.min(2,lv.time);lv.time-=n;G.score+=50*n;if(f.t%3===0)sfx('tick')}else{f.phase=3;f.t=0}}}
 else if(f.phase===3){if(f.t>100)stageCleared()}}
function stageCleared(){G.carry=P.size;G.cp=false;const next=G.stage+1;
 if(next>=LEVELS.length){G.unlocked=LEVELS.length;saveProgress();G.mode='win';G.timer=0;Music.play('win',true);return}
 G.unlocked=Math.max(G.unlocked,next+1);saveProgress();goIntro(next)}
// ---------- pause ----------
function setPause(v){if(G.mode!=='play'&&G.mode!=='dying'&&G.mode!=='flag')return;G.paused=v;G.pauseSel=0;sfx('pause');
 if(v){G.pausedSong=Music.name;Music.stop()}else if(G.pausedSong)Music.play(G.pausedSong,true)}
// ---------- main play update ----------
function playUpdate(inp){const L=lv,p=P;
 if(G.freeze>0){G.freeze--;if(!G.freeze)G.sizeAnim=null;return}
 if(G.pipe){updatePipe();return}
 L.t++;updatePlats(L.plats,L.t);
 if(!DBG.noTimer){if(++L.tick>=24){L.tick=0;if(L.time>0){L.time--;if(L.time===100){sfx('hurry');Music.tempo=1.2}if(L.time===0){killPlayer();return}}}}
 if(tryTube(inp))return;
 const jumped=stepPlayer(p,inp,WD,cam);if(jumped)sfx(p.size?'bigjump':'jump');
 if(p.onGround)p.combo=0;
 p.anim+=p.onGround?Math.abs(p.vx)*0.18:0;
 if(p.inv>0)p.inv--;
 if(p.star>0){if(--p.star===0)Music.play(L.music)}
 if(p.size===2&&inp.runp&&L.sparks.length<2){L.sparks.push({x:p.face>0?p.x+p.w-2:p.x-4,y:p.y+8,w:6,h:6,vx:0,vy:1.5,dir:p.face,t:0});sfx('spark')}
 // coins
 {const x0=Math.floor(p.x/16),x1=Math.floor((p.x+p.w-0.01)/16),y0=Math.floor(p.y/16),y1=Math.floor((p.y+p.h-0.01)/16);
  for(let ty=Math.max(0,y0);ty<=Math.min(ROWS-1,y1);ty++)for(let tx=x0;tx<=x1;tx++)if(tileAt(L,tx,ty)==='o'){L.map[ty][tx]=' ';addCoin()}}
 const hz=hazardOf(p,L.map,L.w,L.geysers,L.t);
 if(hz==='pit'||hz==='lava'){killPlayer();return}if(hz==='fire')hurtPlayer();
 if(L.checkpoint&&!G.cp&&p.x>=L.checkpoint*16){G.cp=true;sfx('checkpoint')}
 if(L.flag&&p.x+p.w>=L.flag*16-0.5){startFlag();return}
 updateItems(L);updateEnemies(L);playerVsEnemies(L,inp);updateSparks(L);updateBoss(L);
 for(const g of L.geysers)if(geyserState(g,L.t)===2&&(L.t+g.offset)%g.period===g.period-g.on&&Math.abs(g.x*16-cam.x-128)<200)sfx('geyser');}
function updateFx(){if(!lv)return;const L=lv;
 for(const f of L.fx){f.t++;if(f.k==='coin'){f.y+=f.vy;f.vy+=0.32;if(f.t>=26){f.gone=true;addScore(0);L.pops.push({x:f.x+2,y:f.y,txt:'200',t:0})}}
  else if(f.k==='deb'){f.x+=f.vx;f.y+=f.vy;f.vy+=0.3;if(f.y>H)f.gone=true}else if(f.t>16)f.gone=true}
 L.fx=L.fx.filter(f=>!f.gone);for(const s of L.pops){s.t++;s.y-=0.6}L.pops=L.pops.filter(s=>s.t<44);
 for(const b of L.bumps)b.t++;L.bumps=L.bumps.filter(b=>b.t<10)}
function update(){G.frame++;const inp=pollInput();
 if(G.paused){if(inp.startp){setPause(false);return}
  if(inp.up||inp.dp||inp.lp||inp.rp){G.pauseSel^=1;sfx('select')}
  if(inp.jp){if(G.pauseSel===0)setPause(false);else{G.paused=false;saveProgress();G.mode='title';Music.play('title',true)}}return}
 switch(G.mode){
  case 'title':if(inp.lp&&G.sel>0){G.sel--;sfx('select')}if(inp.rp&&G.sel<G.unlocked-1){G.sel++;sfx('select')}
   if(Music.name!=='title'&&AU.ok())Music.play('title');
   if(inp.jp||inp.startp||inp.tapp){AU.unlock();newGame(G.sel)}break;
  case 'intro':if(++G.timer>=150||(G.timer>30&&(inp.jp||inp.startp))){G.mode='play';Music.play(lv.music,true)}break;
  case 'play':if(inp.startp){setPause(true);break}playUpdate(inp);break;
  case 'dying':G.timer++;if(G.timer===34)P.vy=-5;if(G.timer>34){P.vy=Math.min(P.vy+0.24,5);P.y+=P.vy}
   if(G.timer>=190){G.lives--;if(G.lives<=0){G.mode='gameover';G.timer=0;saveProgress();Music.play('over_g',true)}else goIntro(G.stage)}break;
  case 'flag':updateFlag();updatePlats(lv.plats,++lv.t);if(lv.boss)updateBoss(lv);break;
  case 'gameover':if(++G.timer>90&&(inp.jp||inp.startp||inp.tapp)||G.timer>600){G.mode='title';G.sel=G.unlocked-1;Music.play('title',true)}break;
  case 'win':G.timer++;if(G.timer%40===0)spawnFirework();if(G.timer>150&&(inp.jp||inp.startp||inp.tapp)){G.mode='title';G.sel=G.unlocked-1;G.cp=false;Music.play('title',true)}break}
 if(G.mode!=='title')updateFx();updateFireworks()}
// ---------- fireworks for the win screen ----------
let FW=[];
function spawnFirework(){const x=40+hash(G.timer,3)*176,y=40+hash(G.timer,5)*70,c=['#ff5a8a','#ffd040','#50f080','#60b0ff','#c070ff'][(G.timer/40|0)%5];
 for(let i=0;i<24;i++){const a=i/24*Math.PI*2;FW.push({x,y,vx:Math.cos(a)*1.6,vy:Math.sin(a)*1.6,t:0,c})}sfx('break')}
function updateFireworks(){for(const f of FW){f.t++;f.x+=f.vx;f.y+=f.vy;f.vy+=0.03;f.vx*=0.98}FW=FW.filter(f=>f.t<60)}
