const {chromium}=require('playwright');const fs=require('fs');
const URL=process.env.URL||'http://127.0.0.1:8811/index.html';
(async()=>{const br=await chromium.launch();const errs=[];
for(const [tag,vp] of [['landscape',{width:844,height:390}],['portrait',{width:390,height:844}]]){
 const ctx=await br.newContext({viewport:vp,deviceScaleFactor:3,isMobile:true,hasTouch:true});const p=await ctx.newPage();
 p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL);await p.waitForFunction(()=>window.BD);await p.addScriptTag({content:fs.readFileSync(__dirname+'/inpage.js','utf8')});await p.waitForTimeout(500);
 const shot=async(n)=>{await p.waitForTimeout(120);await p.screenshot({path:`/workspace/platformer/shots/${tag}-${n}.png`})};
 await p.evaluate(()=>{BD.manual(true);for(let i=0;i<40;i++)BD.step(1,{})});await shot('01-title');
 const scenes=[
  ['02-stage1-start',()=>{BD.start(0);BD.manual(true);BD.step(30,{})}],
  ['03-stage1-blocks',()=>{BD.start(0);BD.manual(true);BD.place(14*16,194);BD.step(40,{r:true});BD.step(8,{j:true})}],
  ['04-stage2-mines',()=>{BD.start(1,{size:1});BD.manual(true);BD.place(43*16,208-27);BD.step(24,{});}],
  ['05-stage3-sky',()=>{BD.start(2);BD.manual(true);BD.place(29*16,160-14);BD.step(20,{r:true})}],
  ['06-stage4-castle',()=>{BD.start(3,{size:2});BD.manual(true);BD.place(44*16,208-27);BD.step(60,{});BD.step(1,{run:true});BD.step(6,{})}],
  ['07-powerup-grow',()=>{BD.start(0);BD.manual(true);BD.place(19*16+2,194);BD.step(2,{});TH.untilGround({j:true});BD.step(34,{});}],
  ['08-spark-power',()=>{BD.start(0,{size:2});BD.manual(true);BD.place(31*16,208-27);BD.step(4,{});BD.step(1,{run:true});BD.step(8,{});BD.step(1,{run:true});BD.step(5,{})}],
  ['09-boss',()=>{BD.start(3,{dbg:{god:true}});BD.manual(true);BD.lv.ents=[];BD.setCam(BD.lv.w*16-256);BD.place(150*16,194);BD.step(150,{});BD.DBG.god=false}],
  ['10-bonus-room',()=>{BD.start(0,{dbg:{noEnemies:true}});BD.manual(true);const w=BD.lv.warps[0];BD.place(w.x*16+10,w.top*16-14);BD.step(3,{});BD.step(50,{d:true});BD.step(30,{})}],
  ['11-stage-clear',()=>{BD.start(0,{dbg:{noEnemies:true}});BD.manual(true);BD.place(189*16,194);for(let f=0;f<600&&!(BD.G.flag&&BD.G.flag.phase===2&&BD.G.flag.t>60);f++)BD.step(1,{r:true,run:true,j:f>4&&f<24})}],
  ['12-pause',()=>{BD.start(1);BD.manual(true);BD.step(20,{});BD.step(1,{start:true})}],
  ['13-intro',()=>{BD.G.paused=false;BD.G.mode='title';BD.step(1,{});BD.step(1,{j:true});BD.step(2,{})}],
  ['14-gameover',()=>{BD.start(0,{lives:1});BD.manual(true);BD.place(64*16,194);for(let f=0;f<400&&BD.G.mode!=='gameover';f++)BD.step(1,{r:true});BD.step(120,{})}],
  ['15-win',()=>{BD.start(3,{dbg:{god:true}});BD.manual(true);const L=BD.lv;L.ents=[];BD.setCam(L.w*16-256);BD.place(150*16,194);BD.step(5,{});L.boss.hp=1;L.boss.inv=0;
    for(let i=0;i<200&&L.boss.hp>0;i++){BD.place(L.boss.x+8,L.boss.y-30);BD.P.vy=2;BD.step(1,{})}for(let f=0;f<1500&&BD.G.mode!=='win';f++)BD.step(1,{});BD.step(200,{})}],
 ];
 for(const [n,fn] of scenes){await p.evaluate(fn);await shot(n)}
 // touch controls highlighted while pressed
 await p.evaluate(()=>{BD.start(0,{dbg:{noEnemies:true}});BD.manual(false)});const geo=await p.evaluate(()=>BD.ui());const cdp=await ctx.newCDPSession(p);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:geo.dp.x+geo.dp.r*0.6,y:geo.dp.y,id:1},{x:geo.a.x,y:geo.a.y,id:2}]});await p.waitForTimeout(250);
 await p.screenshot({path:`/workspace/platformer/shots/${tag}-16-touch-pressed.png`});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await ctx.close()}
console.log('errors',errs);await br.close()})();
