const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const br=await chromium.launch();const p=await br.newPage();await p.goto('http://127.0.0.1:8811/index.html');await p.waitForFunction(()=>window.BD);
for(const [name,sz] of [['icon-512.png',512],['icon-192.png',192],['apple-touch-icon.png',180]]){
 const data=await p.evaluate(sz=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  for(let y=0;y<64;y++){const t=y/63;g.fillStyle=t<0.62?(t<0.3?'#5aa8ff':'#8ccfff'):'#2f8a44';g.fillRect(0,y,64,1)}
  g.fillStyle='#52b868';g.fillRect(0,40,64,2);
  const T=BD._T.over;for(let x=0;x<4;x++){g.drawImage(T.Gt,x*16,48)}
  g.drawImage(T.B,40,10);g.drawImage(T.Q[0],24,10);
  g.drawImage(BD._H.normal.b.jump[0],14,16);
  const o=document.createElement('canvas');o.width=o.height=sz;const og=o.getContext('2d');og.imageSmoothingEnabled=false;og.drawImage(c,0,0,sz,sz);return o.toDataURL('image/png')},sz);
 fs.writeFileSync('/workspace/platformer/'+name,Buffer.from(data.split(',')[1],'base64'))}
await br.close()})();
