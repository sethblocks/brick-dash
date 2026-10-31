// Helpers injected into the page for the automated suite.
window.TH={
 arena(size=0){BD.start(0,{dbg:{noEnemies:true,noTimer:true},size});BD.manual(true);BD.resetInput();const L=BD.lv;
  for(let y=0;y<15;y++)for(let x=0;x<70;x++)L.map[y][x]=y>=13?'G':' ';L.plats.length=0;L.ents=[];L.items=[];L.checkpoint=null;L.warps=[];L.decor=[];
  BD.setCam(0);BD.place(100,208-BD.P.h);BD.step(3,{});return BD.state()},
 run(n,inp,fn){const out=[];for(let i=0;i<n;i++){BD.step(1,inp);if(fn){const r=fn(i);if(r!==undefined)out.push(r)}}return out},
 untilGround(inp,max=300,track){let minY=1e9,i=0;for(;i<max;i++){BD.step(1,inp);minY=Math.min(minY,BD.P.y);if(track)track();if(BD.P.onGround&&i>2)break}return {minY,frames:i}},
 // -------- level verifier: best-first search over input macros using the game's own physics --------
 verify(stage,opt={}){
  const S=BD.sim,def=S.buildLevel(stage);if(opt.mut)opt.mut(def);const Wd=def.w,SOL=BD.SOLID,size=opt.size||0;
  const map=def.map.map(r=>r.slice());if(def.flag)map[12][def.flag]='X';
  const plats=def.plats.map(p=>{const o=Object.assign({},p,{bx:p.x*16,by:p.y*16,w:p.w*16,h:8});const q=S.platPos(o,0);o.x=o.px=q[0];o.y=o.py=q[1];return o});
  const geys=def.geysers;let rev=null;
  const wd={w:Wd,plats,solid:(tx,ty)=>{if(ty>=15||ty<0)return false;if(tx<0||tx>=Wd)return true;const c=map[ty][tx];return SOL[c]===1||(c==='h'&&rev.has(tx*16+ty))},
   hidden:(tx,ty)=>ty>=0&&ty<15&&tx>=0&&tx<Wd&&map[ty][tx]==='h'&&!rev.has(tx*16+ty),headHit:(tx,ty)=>{if(map[ty][tx]==='h'&&!rev.has(tx*16+ty)){rev=new Set(rev);rev.add(tx*16+ty)}}};
  const setPl=t=>{for(const pl of plats){const a=S.platPos(pl,t-1),b=S.platPos(pl,t);pl.px=a[0];pl.py=a[1];pl.x=b[0];pl.y=b[1]}};
  const goal=def.flag?(p=>p.x+p.w>=def.flag*16-0.5):(p=>p.x>=def.boss.minX*16&&p.onGround);
  const dyn=[...def.plats.map(p=>p.x*16),...geys.map(g=>g.x*16)];
  const near=x=>dyn.some(d=>Math.abs(d-x)<200);
  const MAC=[];for(const d of [1,-1])for(const r of [1,4,10,20,40])for(const h of [0,1,4,8,12,16,24]){for(const rel of (h?[999,6,14,22]:[0]))MAC.push({d,r,h,rel})}
  for(const w of [8,16,30,50,80])MAC.push({wait:w});
  const inpFor=(m,f)=>{if(m.wait)return {};const hold=m.h?f<m.r+m.rel:f<m.r;return {l:m.d<0&&hold,r:m.d>0&&hold,run:true,j:m.h>0&&f>=m.r&&f<m.r+m.h}};
  function sim(s,m){const p=Object.assign({},s.p),cam={x:s.cx,dead:112};let t=s.t,pj=s.pj,air=false;rev=s.rev;
   const maxF=m.wait?m.wait:m.r+(m.h||0)+240;
   for(let f=0;f<maxF;f++){const inp=inpFor(m,f);inp.jp=inp.j&&!pj;pj=inp.j;t++;setPl(t);S.stepPlayer(p,inp,wd,cam);
    if(S.hazardOf(p,map,Wd,geys,t))return null;
    const st={p,cx:cam.x,t,pj,rev,n:f+1};
    if(goal(p)){st.win=true;return st}
    if(!p.onGround)air=true;
    if(m.wait)continue;
    if(f>=m.r+(m.h||0)&&p.onGround&&(air||f>=m.r+(m.h||0)+(m.h?2:24)||Math.abs(p.vx)<0.01))return st}
   return m.wait&&p.onGround?{p,cx:cam.x,t,pj,rev,n:maxF}:null}
  const p0=S.newPlayer(size);p0.x=def.start*16+2;p0.y=S.columnTop(map,def.start,3)*16-p0.h;p0.onGround=true;p0.face=1;
  const root={p:p0,cx:0,t:0,pj:false,rev:new Set(),par:null,m:null,depth:0};
  const key=s=>{const p=s.p;return [Math.round(p.x/3),Math.round(p.y/3),Math.round(p.vx*2),p.plat,near(p.x)?Math.floor(s.t/10):0,s.rev.size].join(',')};
  // binary heap on priority
  const heap=[];const push=(n,pr)=>{heap.push([pr,n]);let i=heap.length-1;while(i>0){const j=(i-1)>>1;if(heap[j][0]>=heap[i][0])break;[heap[i],heap[j]]=[heap[j],heap[i]];i=j}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<heap.length&&heap[l][0]>heap[m][0])m=l;if(r<heap.length&&heap[r][0]>heap[m][0])m=r;if(m===i)break;[heap[i],heap[m]]=[heap[m],heap[i]];i=m}}return top[1]};
  const seen=new Set([key(root)]);push(root,0);let expanded=0,best=root,win=null;const limit=opt.limit||40000;
  while(heap.length&&expanded<limit&&!win){const s=pop();expanded++;if(s.p.x>best.p.x)best=s;
   for(const m of MAC){if(m.wait&&!near(s.p.x))continue;const r=sim(s,m);if(!r)continue;const n=Object.assign(r,{par:s,m,depth:s.depth+1});
    if(r.win){win=n;break}const k=key(n);if(seen.has(k))continue;seen.add(k);push(n,n.p.x-n.depth*2-(n.t*0.05))}}
  const res={stage,size,ok:!!win,expanded,bestX:Math.round(best.p.x),goalX:def.flag?def.flag*16:def.boss.minX*16,frames:0,path:[]};
  if(win){const path=[];for(let n=win;n.par;n=n.par)path.unshift([n.m,n.n]);res.path=path;res.frames=win.t;res.macros=path.length}
  return res},
 // replay a verifier path in the REAL game loop (enemies/items disabled) and report where the player ends up
 replay(stage,path,size=0){BD.start(stage,{dbg:{noEnemies:true,noItems:true},size});BD.manual(true);BD.resetInput();
  const inpFor=(m,f)=>{if(m.wait)return {};const hold=m.h?f<m.r+m.rel:f<m.r;return {l:m.d<0&&hold,r:m.d>0&&hold,run:true,j:m.h>0&&f>=m.r&&f<m.r+m.h}};
  let frames=0;for(const [m,n] of path)for(let f=0;f<n;f++){BD.step(1,inpFor(m,f));frames++;if(BD.G.mode!=='play')break}
  const s=BD.state();return {mode:s.mode,x:s.p.x,onGround:s.p.onGround,dead:s.p.dead,frames,time:s.time}}
};
