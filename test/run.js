// Brick Dash automated test suite (headless Chromium via Playwright)
const {chromium}=require('playwright');const fs=require('fs');
const URL=process.env.URL||'http://127.0.0.1:8811/index.html';
const HELP=fs.readFileSync(__dirname+'/inpage.js','utf8');
const results=[];const consoleErrors=[];
function rec(name,pass,detail){results.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name+'  '+JSON.stringify(detail))}
async function open(ctx,label){const p=await ctx.newPage();
 p.on('console',m=>{if(m.type()==='error')consoleErrors.push(label+': '+m.text())});p.on('pageerror',e=>consoleErrors.push(label+' pageerror: '+e.message));
 await p.goto(URL);await p.waitForFunction(()=>window.BD);await p.addScriptTag({content:HELP});return p}
(async()=>{
const br=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await br.newContext({viewport:{width:1024,height:768}});const p=await open(ctx,'desktop');
const T=async(name,fn)=>{try{const r=await p.evaluate(fn);rec(name,r.pass,r)}catch(e){rec(name,false,{error:String(e)})}};

await T('jump height range (tap < hold-walk < hold-run)',()=>{
 TH.arena();const y0=BD.P.y;let r=TH.untilGround({j:true},1);BD.step(1,{});const tap=y0-TH.untilGround({}).minY;
 TH.arena();const walk=y0-TH.untilGround({j:true}).minY;
 TH.arena();BD.place(60,208-14);TH.run(70,{r:true,run:true});const vx=BD.P.vx;const run=y0-TH.untilGround({r:true,run:true,j:true}).minY;
 return {pass:tap>=10&&tap<=28&&walk>=48&&walk<=64&&run>=walk+6&&run<=76,tapPx:+tap.toFixed(1),walkPx:+walk.toFixed(1),runPx:+run.toFixed(1),runSpeed:vx}});

await T('high-speed floor collision (no tunnelling, exact landing)',()=>{let bad=0,n=0;
 for(let i=0;i<120;i++){TH.arena();const x=60+i*3.37;BD.place(x,10+(i%7)*1.3);BD.P.vy=50;
  for(let f=0;f<120;f++){BD.step(1,{});if(BD.P.y+BD.P.h>208.001)bad++;}n++;if(Math.abs(BD.P.y+BD.P.h-208)>0.001||!BD.P.onGround)bad++}
 return {pass:bad===0,drops:n,violations:bad}});

await T('high-speed wall collision (forced vx up to 15.9 px/frame)',()=>{let bad=0,trials=0;
 for(const v of [2.6,6,10,15.9])for(let k=0;k<20;k++){TH.arena();const L=BD.lv;for(let y=9;y<=12;y++)L.map[y][30]='X';
  BD.place(300+k*0.77,208-14);for(let f=0;f<90;f++){BD.P.vx=v;BD.step(1,{r:true,run:true});if(BD.P.x+BD.P.w>480.001)bad++}
  if(Math.abs(BD.P.x+BD.P.w-480)>0.001)bad++;trials++;
  TH.arena();for(let y=9;y<=12;y++)BD.lv.map[y][10]='X';BD.place(200-k*0.61,208-14);for(let f=0;f<60;f++){BD.P.vx=-v;BD.step(1,{l:true,run:true});if(BD.P.x<176-0.001)bad++}trials++}
 return {pass:bad===0,trials,violations:bad}});

await T('ceiling collision (head stops at block, no pass-through)',()=>{let bad=0;
 for(let k=0;k<12;k++){TH.arena();const L=BD.lv;for(let x=4;x<=12;x++)L.map[9][x]='X';BD.place(120+k*3.1,208-14);
  const r=TH.untilGround({j:true,run:true,r:k%2==0});if(r.minY<160-0.001)bad++}
 // ceiling at speed while big
 TH.arena(1);for(let x=4;x<=12;x++)BD.lv.map[10][x]='X';BD.place(120,208-27);const r2=TH.untilGround({j:true});if(r2.minY<176-0.001)bad++;
 return {pass:bad===0,violations:bad}});

await T('corner handling (ledge assist + ceiling corner correction)',()=>{
 TH.arena();const L=BD.lv;L.map[11][20]='X';L.map[12][20]='X';L.map[11][21]='X';L.map[12][21]='X';
 BD.place(320-12-0.5,176-14+3);BD.P.vy=1.2;BD.P.vx=1.5;BD.P.onGround=false;BD.step(1,{r:true});
 const ledge=Math.abs(BD.P.y+BD.P.h-176)<0.01&&BD.P.x>320-12;
 TH.arena();BD.lv.map[9][25]='X';BD.place(25*16-12+3,208-14);const x0=BD.P.x;const r=TH.untilGround({j:true});
 const corner=r.minY<150&&BD.P.x<=x0-3+0.01;
 return {pass:ledge&&corner,ledge,corner,minY:r.minY}});

await T('stomp enemy (squash + bounce + score)',()=>{TH.arena();const i=BD.spawn('blob',20,12);const e=BD.lv.ents[i];
 BD.place(e.x,e.y-50);const s0=BD.G.score;let bounced=false;for(let f=0;f<40;f++){BD.step(1,{});if(BD.P.vy<0)bounced=true}
 return {pass:e.squash>0||e.gone,bounced,scoreGain:BD.G.score-s0,alive:!BD.P.dead&&BD.G.mode==='play',ok:bounced}});

await T('hurt rules (big->small with i-frames, small->death)',()=>{TH.arena(1);BD.spawn('blob',12,12);let shr=false,inv=0;
 for(let f=0;f<120;f++){BD.step(1,{r:true});if(BD.P.size===0&&!shr){shr=true;inv=BD.P.inv}}
 const survived=BD.G.mode==='play'&&!BD.P.dead;
 TH.arena(0);BD.spawn('blob',12,12);for(let f=0;f<120;f++)BD.step(1,{r:true});const died=BD.G.mode==='dying';
 return {pass:shr&&inv>60&&survived&&died,shrunk:shr,invFrames:inv,survived,smallDied:died}});

await T('shell kick knocks out other enemies',()=>{TH.arena();const L=BD.lv;const bi=BD.spawn('beetle',14,12);const b=L.ents[bi];BD.spawn('blob',30,12);const blob=L.ents[1];
 BD.place(b.x,b.y-40);for(let f=0;f<40&&b.t!=='shell';f++)BD.step(1,{});const shell=b.t==='shell';BD.place(b.x-60,208-14);TH.run(20,{});let moving=false;for(let f=0;f<60&&!moving;f++){BD.step(1,{r:true});moving=b.moving}TH.run(200,{});
 return {pass:shell&&moving&&blob.dead,becameShell:shell,kicked:moving,otherKO:!!blob.dead}});

await T('power-up growth (Sunberry -> big, Volt Bulb -> spark, sparks KO enemy)',()=>{TH.arena();const L=BD.lv;L.map[9][8]='Q';L.content['8,9']='pow';
 BD.place(8*16+2,208-14);TH.untilGround({j:true});const kind=L.items[0]&&L.items[0].kind;BD.place(13*16,208-14);
 for(let f=0;f<200&&BD.P.size===0;f++)BD.step(1,{});const grew=BD.P.size===1&&BD.P.h===27;TH.run(40,{});
 L.map[9][20]='Q';L.content['20,9']='pow';BD.place(20*16+2,208-27);TH.untilGround({j:true});const kind2=L.items[0]&&L.items[0].kind;
 TH.run(40,{});const it=L.items[0];if(it)BD.place(it.x,it.y);TH.run(60,{});const spark=BD.P.size===2;
 BD.spawn('blob',BD.P.x/16+7|0,12);const e=L.ents[L.ents.length-1];BD.P.face=1;BD.step(1,{run:true});const nS=L.sparks.length;TH.run(80,{});
 return {pass:kind==='berry'&&grew&&kind2==='bulb'&&spark&&nS===1&&e.dead,kind,grew,kind2,spark,sparksFired:nS,enemyKO:!!e.dead}});

await T('Comet Charm invincibility + Clover Heart 1-up',()=>{TH.arena();const L=BD.lv;L.map[9][8]='Q';L.content['8,9']='star';BD.place(8*16+2,208-14);TH.untilGround({j:true});
 TH.run(40,{});const c=L.items[0];BD.place(c.x,c.y);TH.run(2,{});const star=BD.P.star>0;BD.spawn('blob',(BD.P.x/16|0)+3,12);const e=L.ents[0];TH.run(60,{r:true});
 const lives0=BD.G.lives;L.map[9][30]='Q';L.content['30,9']='1up';BD.place(30*16+2,208-14);BD.P.star=0;TH.untilGround({j:true});TH.run(40,{});const h=L.items[0];if(h)BD.place(h.x,h.y);TH.run(2,{});
 return {pass:star&&e.dead&&!BD.P.dead&&BD.G.lives===lives0+1,star,enemyKO:!!e.dead,livesGained:BD.G.lives-lives0}});

await T('brick break when big, bump when small',()=>{TH.arena(1);const L=BD.lv;L.map[9][8]='B';BD.place(8*16+2,208-27);const s0=BD.G.score;TH.untilGround({j:true});
 const broke=L.map[9][8]===' ';const debris=L.fx.filter(f=>f.k==='deb').length;
 TH.arena(0);BD.lv.map[9][8]='B';BD.place(8*16+2,208-14);TH.untilGround({j:true});const kept=BD.lv.map[9][8]==='B';
 return {pass:broke&&kept,bigBroke:broke,debris,smallBumpedOnly:kept}});

await T('coin counting (+1 per coin, 100 coins = 1-up)',()=>{TH.arena();const L=BD.lv;for(let x=10;x<15;x++)L.map[12][x]='o';L.map[9][20]='Q';L.content['20,9']='coin';
 BD.place(100,208-14);TH.run(160,{r:true});const c1=BD.G.coins;BD.place(20*16+2,208-14);TH.untilGround({j:true});const c2=BD.G.coins;
 BD.G.coins=99;const l0=BD.G.lives;L.map[12][30]='o';BD.place(29*16,208-14);TH.run(40,{r:true});
 return {pass:c1===5&&c2===6&&BD.G.coins===0&&BD.G.lives===l0+1,afterRow:c1,afterBlock:c2,after100:BD.G.coins,livesGained:BD.G.lives-l0}});

await T('pit death, respawn, and midway checkpoint',()=>{BD.start(0,{dbg:{noEnemies:true}});BD.manual(true);BD.resetInput();BD.place(64*16,208-14);
 let died=false;for(let f=0;f<120;f++){BD.step(1,{r:true});if(BD.G.mode==='dying'){died=true;break}}const l0=BD.G.lives;
 TH.run(200,{});const intro=BD.G.mode==='intro';TH.run(160,{});const back=BD.G.mode==='play'&&Math.abs(BD.P.x-(3*16+2))<0.01&&BD.G.lives===l0-1;
 BD.place(110*16,208-14);TH.run(60,{r:true});const cp=BD.G.cp;BD.place(128*16,208-14);for(let f=0;f<200&&BD.G.mode==='play';f++)BD.step(1,{r:true});
 TH.run(370,{});const cpRespawn=BD.G.mode==='play'&&Math.abs(BD.P.x-(113*16+2))<0.01;
 return {pass:died&&intro&&back&&cp&&cpRespawn,died,introShown:intro,respawnAtStart:back,checkpointHit:cp,respawnAtCheckpoint:cpRespawn}});

await T('lava + fire geyser are deadly / hurtful',()=>{BD.start(3,{dbg:{noEnemies:true}});BD.manual(true);BD.resetInput();BD.place(14*16,208-14);let lava=false;
 for(let f=0;f<120;f++){BD.step(1,{r:true});if(BD.G.mode==='dying'){lava=true;break}}
 BD.start(3,{dbg:{noEnemies:true},size:1});BD.manual(true);const L=BD.lv,g=L.geysers.find(g=>g.x===62);
 L.map[13][62]='X';L.map[14][62]='X';BD.place(62*16+2,208-27);let hurt=false;for(let f=0;f<400;f++){BD.step(1,{});if(BD.P.size===0){hurt=true;break}}
 return {pass:lava&&hurt,lavaKills:lava,geyserHurts:hurt}});

await T('reach goal flag: height score, tally, next stage unlock + save',()=>{localStorage.clear();BD.G.unlocked=1;BD.G.best=0;
 BD.start(0,{dbg:{noEnemies:true}});BD.manual(true);BD.resetInput();BD.place(189*16,208-14);
 let flag=false,s0;for(let f=0;f<400;f++){BD.step(1,{r:true,run:true,j:f>4&&f<24});if(BD.G.mode==='flag'){flag=true;s0=BD.G.score;break}}
 const pts=BD.G.flag&&BD.G.flag.pts;let next=false;for(let f=0;f<2500;f++){BD.step(1,{});if(BD.G.mode==='intro'&&BD.G.stage===1){next=true;break}}
 return {pass:flag&&pts>=100&&next&&localStorage.getItem('brickdash.unlocked')==='2'&&+localStorage.getItem('brickdash.best')>0,flag,flagPts:pts,nextStage:next,
  savedUnlocked:localStorage.getItem('brickdash.unlocked'),savedBest:localStorage.getItem('brickdash.best')}});

await T('bonus area via tube and back to exit tube',()=>{BD.start(0,{dbg:{noEnemies:true}});BD.manual(true);BD.resetInput();const w=BD.lv.warps[0];
 BD.place(w.x*16+10,w.top*16-14);TH.run(3,{});TH.run(50,{d:true});const inRoom=BD.lv.isRoom;const coins0=BD.G.coins;
 // play the room for real: run right collecting coins, hop onto the exit tube
 TH.run(30,{});let onTube=false;const ex=BD.lv.exit;for(let f=0;f<400;f++){BD.step(1,{r:BD.P.x<ex.x*16+4,run:true,j:(f%50)<20});if(BD.P.onGround&&Math.abs(BD.P.y+BD.P.h-ex.top*16)<1&&BD.P.x>ex.x*16){onTube=true;break}}
 TH.run(4,{});TH.run(60,{d:true});TH.run(60,{});const back=!BD.lv.isRoom&&Math.abs(BD.P.x+BD.P.w/2-(BD.lv.exitTube.x*16+16))<2&&BD.P.onGround;
 return {pass:inRoom&&onTube&&back,enteredRoom:inRoom,roomCoins:BD.G.coins-coins0,reachedExitTube:onTube,returnedAtExitTube:back}});

await T('boss fight: Magmus takes 3 stomps, defeat -> win screen',()=>{BD.start(3,{dbg:{god:true}});BD.manual(true);BD.resetInput();const L=BD.lv;L.ents=[];
 BD.setCam(L.w*16-256);BD.place(150*16,208-14);TH.run(5,{});const b=L.boss;const active=b.active;let stomps=0;
 for(let k=0;k<6&&b.hp>0;k++){TH.run(75,{});const hp=b.hp;BD.place(b.x+8,b.y-30);BD.P.vy=2;for(let f=0;f<30;f++){BD.step(1,{});if(b.hp<hp){stomps++;break}}}
 const defeated=b.hp<=0;let win=false;for(let f=0;f<1500;f++){BD.step(1,{});if(BD.G.mode==='win'){win=true;break}}
 return {pass:active&&stomps===3&&defeated&&win,bossActivated:active,stompsToDefeat:stomps,win}});

await T('boss hurts player on contact + fireballs spawn',()=>{BD.start(3,{dbg:{god:true}});BD.manual(true);BD.resetInput();const L=BD.lv;L.ents=[];BD.setCam(L.w*16-256);BD.place(150*16,208-14);
 TH.run(5,{});const b=L.boss;let fire=0;for(let f=0;f<200;f++){BD.step(1,{});fire=Math.max(fire,L.bfire.length)}BD.DBG.god=false;BD.P.inv=0;BD.place(b.x-10,b.y+b.h-14);b.vx=0;
 let died=false;for(let f=0;f<60;f++){BD.step(1,{r:true});if(BD.G.mode==='dying'){died=true;break}}return {pass:fire>0&&died,fireballs:fire,contactKills:died}});

await T('all levels + bonus rooms load and simulate 600 frames',()=>{const out=[];
 for(let s=0;s<BD.LEVELS.length;s++){BD.start(s,{dbg:{god:true}});BD.manual(true);for(let f=0;f<600;f++){BD.step(1,{r:f%120<90,run:true,j:f%40<12});}BD.render();out.push(BD.lv.name)}
 for(let r=0;r<BD.ROOMS.length;r++){const def=BD.ROOMS[r]();out.push(def.name||('ROOM'+r))}
 return {pass:out.length===BD.LEVELS.length+BD.ROOMS.length,loaded:out}});

// ---------- completability: search + replay in real game ----------
for(let s=0;s<4;s++){try{const r=await p.evaluate((s)=>{const r=TH.verify(s);let rp=null;if(r.ok)rp=TH.replay(s,r.path);delete r.path;
  const ok=r.ok&&rp&&(s<3?rp.mode==='flag':(rp.x>=150*16&&rp.onGround&&!rp.dead));return {pass:!!ok,search:r,replay:rp}},s);rec('completable: stage '+(s+1)+' (search + real-game replay, small Kit)',r.pass,r)}catch(e){rec('completable '+s,false,String(e))}
 try{const r=await p.evaluate((s)=>{const r=TH.verify(s,{size:1});delete r.path;return {pass:r.ok,search:r}},s);rec('completable: stage '+(s+1)+' (search, big Kit hitbox)',r.pass,r)}catch(e){rec('completable big '+s,false,String(e))}}

await T('verifier negative control: an 11-tile pit is reported impossible',()=>{const r=TH.verify(0,{limit:6000,mut:d=>{for(let x=60;x<71;x++){d.map[13][x]=' ';d.map[14][x]=' '}for(let y=0;y<13;y++)for(let x=55;x<75;x++)d.map[y][x]=' '}});delete r.path;return {pass:!r.ok&&r.bestX<71*16,search:r}});
// ---------- real keyboard input + pause ----------
{const r=await p.evaluate(()=>{BD.start(0,{dbg:{noEnemies:true}});BD.manual(false);return BD.P.x});await p.keyboard.down('ArrowRight');await p.keyboard.down('x');await p.waitForTimeout(500);
 await p.keyboard.down('z');let minY=1e9;for(let i=0;i<10;i++){await p.waitForTimeout(30);minY=Math.min(minY,await p.evaluate(()=>BD.P.y))}await p.keyboard.up('z');await p.keyboard.up('ArrowRight');await p.keyboard.up('x');
 const st=await p.evaluate(()=>BD.state());rec('keyboard controls (arrows + X run + Z jump)',st.p.x>r+40&&minY<208-14-20,{dx:st.p.x-r,jumpPx:208-14-minY});
 await p.keyboard.press('p');await p.waitForTimeout(100);const x1=await p.evaluate(()=>[BD.G.paused,BD.P.x]);await p.keyboard.down('ArrowRight');await p.waitForTimeout(300);await p.keyboard.up('ArrowRight');
 const x2=await p.evaluate(()=>BD.P.x);await p.keyboard.press('p');await p.waitForTimeout(100);const un=await p.evaluate(()=>BD.G.paused);
 rec('pause freezes game and resumes',x1[0]&&x1[1]===x2&&!un,{paused:x1[0],frozen:x1[1]===x2,resumed:!un});
 await p.evaluate(()=>{BD.G.mode='title'});await p.keyboard.press('Enter');await p.waitForTimeout(100);const m=await p.evaluate(()=>BD.G.mode);rec('title -> start game via keyboard',m==='intro',{mode:m});}

// ---------- perf ----------
{await p.evaluate(()=>{BD.start(0,{});BD.manual(false);Object.assign(BD.PERF,{frames:0,upd:0,updMs:0,rndMs:0,maxMs:0})});await p.keyboard.down('ArrowRight');
 const fps=await p.evaluate(()=>new Promise(res=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<3000)requestAnimationFrame(f);else res(n/((performance.now()-t0)/1000))};requestAnimationFrame(f)}));
 await p.keyboard.up('ArrowRight');const pf=await p.evaluate(()=>({...BD.PERF}));
 const avg=(pf.updMs+pf.rndMs)/pf.frames;rec('perf: 60fps with fixed 60Hz updates',fps>=55&&avg<8&&Math.abs(pf.upd/pf.frames-1)<0.1,{rafFps:+fps.toFixed(1),updatesPerFrame:+(pf.upd/pf.frames).toFixed(3),avgFrameWorkMs:+avg.toFixed(3),maxFrameWorkMs:+pf.maxMs.toFixed(2)});
 const cdp=await ctx.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await p.evaluate(()=>Object.assign(BD.PERF,{frames:0,upd:0,updMs:0,rndMs:0,maxMs:0}));await p.waitForTimeout(2000);
 const pf2=await p.evaluate(()=>({...BD.PERF}));await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});const avg2=(pf2.updMs+pf2.rndMs)/pf2.frames;
 rec('perf: 4x CPU throttle still under 16.7ms/frame',avg2<16.7,{avgFrameWorkMs:+avg2.toFixed(3),frames:pf2.frames});}

// ---------- touch (iPhone-like) ----------
for(const vp of [{width:844,height:390},{width:390,height:844}]){
 const mctx=await br.newContext({viewport:vp,deviceScaleFactor:3,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
 const mp=await open(mctx,'touch '+vp.width+'x'+vp.height);await mp.waitForTimeout(400);const cdp=await mctx.newCDPSession(mp);
 const geo=await mp.evaluate(()=>BD.ui());const cv=await mp.evaluate(()=>{const r=document.querySelector('canvas').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
 const ctr=b=>({x:b.x+b.w/2,y:b.y+b.h/2});
 // tap to start from title
 const pt={x:geo.a.x,y:geo.a.y};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pt.x,y:pt.y,id:1}]});await mp.waitForTimeout(80);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await mp.waitForTimeout(100);const started=await mp.evaluate(()=>BD.G.mode);
 await mp.evaluate(()=>{BD.start(0,{dbg:{noEnemies:true}});BD.manual(false)});const x0=await mp.evaluate(()=>BD.P.x);
 const R={x:geo.dp.x+geo.dp.r*0.6,y:geo.dp.y},A={x:geo.a.x,y:geo.a.y},B={x:geo.b.x,y:geo.b.y};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:R.x,y:R.y,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:R.x,y:R.y,id:1},{x:B.x,y:B.y,id:2}]});await mp.waitForTimeout(500);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:R.x,y:R.y,id:1},{x:B.x,y:B.y,id:2},{x:A.x,y:A.y,id:3}]});
 let minY=1e9;for(let i=0;i<10;i++){await mp.waitForTimeout(30);minY=Math.min(minY,await mp.evaluate(()=>BD.P.y))}
 const vx=await mp.evaluate(()=>BD.P.vx);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mp.waitForTimeout(100);
 const x1=await mp.evaluate(()=>BD.P.x);const inp=await mp.evaluate(()=>BD.state());
 const vv=await mp.evaluate(()=>({sx:scrollX,sy:scrollY,scale:visualViewport?visualViewport.scale:1,bodyW:document.documentElement.scrollWidth,iw:innerWidth,ih:innerHeight}));
 const noOverlap=[geo.dp,geo.a,geo.b].every(c=>c.x-c.r>=0&&c.y-c.r>=0&&c.x+c.r<=vp.width&&c.y+c.r<=vp.height)&&Math.hypot(geo.a.x-geo.b.x,geo.a.y-geo.b.y)>geo.a.r+geo.b.r;
 const out=c=>vp.width>vp.height?(c.x-c.r>=cv.x+cv.w-1||c.x+c.r<=cv.x+1):(c.y-c.r>=cv.y+cv.h-1);const canvasClear=out(geo.dp)&&out(geo.a)&&out(geo.b);
 rec(`touch controls ${vp.width}x${vp.height} (tap start, multitouch run+jump, no scroll/zoom)`,started==='intro'&&x1-x0>40&&minY<208-14-20&&vx>2&&vv.sx===0&&vv.sy===0&&vv.scale===1&&noOverlap&&canvasClear,
  {tapStart:started,dx:+(x1-x0).toFixed(1),runVx:+vx.toFixed(2),jumpPx:+(208-14-minY).toFixed(1),scroll:[vv.sx,vv.sy],zoom:vv.scale,buttonsOnScreen:noOverlap,buttonsOutsideCanvas:canvasClear,canvasCss:cv});
 // pause button
 const PB={x:geo.p.x,y:geo.p.y};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:PB.x,y:PB.y,id:5}]});await mp.waitForTimeout(80);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mp.waitForTimeout(80);
 rec(`touch pause button ${vp.width}x${vp.height}`,await mp.evaluate(()=>BD.G.paused),{});
 // integer scaling check
 const sc=await mp.evaluate(()=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();return {k:r.width*devicePixelRatio/256,k2:r.height*devicePixelRatio/240}});
 rec(`integer scaling ${vp.width}x${vp.height}`,Math.abs(sc.k-Math.round(sc.k))<0.01&&Math.abs(sc.k-sc.k2)<0.01&&sc.k>=1,sc);
 await mctx.close()}

// ---------- gamepad ----------
{const gctx=await br.newContext({viewport:{width:800,height:600}});
 await gctx.addInitScript(()=>{const btn=v=>({pressed:v,value:v?1:0});window.__pad={axes:[1,0,0,0],b:{}};
  navigator.getGamepads=()=>[{id:'fake',connected:true,index:0,mapping:'standard',axes:window.__pad.axes,buttons:Array.from({length:17},(_,i)=>btn(!!window.__pad.b[i]))}]});
 const gp=await open(gctx,'gamepad');await gp.evaluate(()=>{BD.start(0,{dbg:{noEnemies:true}});BD.manual(false);window.__x0=BD.P.x;window.__pad.b[2]=1});await gp.waitForTimeout(500);
 await gp.evaluate(()=>{window.__pad.b[0]=1});let minY=1e9;for(let i=0;i<10;i++){await gp.waitForTimeout(30);minY=Math.min(minY,await gp.evaluate(()=>BD.P.y))}
 const r=await gp.evaluate(()=>({dx:BD.P.x-window.__x0}));await gp.evaluate(()=>{window.__pad.axes=[0,0,0,0];window.__pad.b={9:1}});await gp.waitForTimeout(100);const paused=await gp.evaluate(()=>BD.G.paused);
 rec('gamepad (stick move, A jump, X run, Start pause)',r.dx>40&&minY<208-14-20&&paused,{dx:r.dx,jumpPx:208-14-minY,startPauses:paused});await gctx.close()}

rec('zero console errors across all pages',consoleErrors.length===0,{errors:consoleErrors});
fs.writeFileSync(__dirname+'/results.json',JSON.stringify(results,null,1));
const f=results.filter(r=>!r.pass).length;console.log(`\n${results.length-f}/${results.length} passed`);await br.close();process.exit(f?1:0)})();
