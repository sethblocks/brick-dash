// Tiles -------------------------------------------------------------
const THEMES={
 over:{name:'over',sky:['#6cb8ff','#a8dcff'],dirt:['#c97a3a','#a65a26','#e3a465'],grass:['#5cd04a','#2f9a3a','#9af07a'],brick:['#d46a3c','#ffb080','#5a2414'],hard:['#b0a090','#e8dcc8','#5a4a3a'],cloud:true},
 under:{name:'under',sky:['#0b0a1d','#1a1534'],dirt:['#4c5a8c','#323d66','#7484b8'],grass:null,brick:['#3d7ec4','#8cc4ff','#0c1838'],hard:['#5a6a9a','#9aaad8','#202a48']},
 sky:{name:'sky',sky:['#ff9e8a','#ffd8a8'],dirt:['#e8dcc4','#bfae90','#fff6e4'],grass:['#7ad8a0','#3aa070','#c0ffd8'],brick:['#c0508a','#ffa0d0','#4a1030'],hard:['#a090c0','#e0d4ff','#40305a'],cloud:true},
 castle:{name:'castle',sky:['#170812','#2a0c18'],dirt:['#5e5670','#3a3448','#8a82a0'],grass:null,brick:['#7a4a5a','#b07a8a','#2a1018'],hard:['#6a6078','#a098b8','#2a2438']}};
function tileSet(th){
 const T={};const [d0,d1,d2]=th.dirt,[b0,b1,b2]=th.brick,[h0,h1,h2]=th.hard;
 const stone=(x,y)=>{const bx=(y>>3)&1?(x+4)&15:x;if(y%8===7||bx%8===7)return d1;if(y%8===0||bx%8===0)return d2;return hash(x,y)<0.08?d1:d0};
 if(th.grass){const [g0,g1,g2]=th.grass;
  T.Gt=pix(16,16,(x,y)=>{const edge=4+((x*5)%3===0?1:0);if(y<edge){if(y===0)return g2;return y>=edge-1?g1:g0}
   const n=hash(x,y);return n<0.07?d1:n>0.95?d2:d0});
  T.G=pix(16,16,(x,y)=>{const n=hash(x+3,y+7);return n<0.07?d1:n>0.95?d2:d0});
 } else {T.Gt=pix(16,16,stone);T.G=T.Gt}
 T.B=pix(16,16,(x,y)=>{const bx=(y>>3)&1?(x+8)&15:x;if(y%8===7||bx===15)return b2;if(y%8===0||bx===0)return b1;return hash(x,y)<0.06?b1:b0});
 T.X=pix(16,16,(x,y)=>{if(x===15||y===15)return h2;if(x===0||y===0)return h1;if(x===1||y===1)return h1;if(x===14||y===14)return h2;return ((x===3||x===12)&&(y===3||y===12))?h2:h0});
 T.E=pix(16,16,(x,y)=>{if(x===0||y===0||x===15||y===15)return '#2a1a14';if(((x===2||x===13)&&(y===2||y===13)))return '#2a1a14';return y<3||x<3?'#a07a5a':'#7a5a44'});
 T.Q=[0,1,2,3].map(f=>pix(16,16,(x,y)=>{ // glowing gem block
  if(x===0||y===0||x===15||y===15)return '#1c0c3a';
  const dx=Math.abs(x-7.5),dy=Math.abs(y-7.5),g=dx*1.1+dy;
  if(g<=4.6){const facet=(x<8)!==(y<8);const lv=[['#7af0ff','#c0faff'],['#9af6ff','#e0ffff'],['#c0fbff','#ffffff'],['#9af6ff','#e0ffff']][f];return facet?lv[0]:lv[1]}
  if(g<=5.6)return '#2a1060';
  if(x===1||y===1)return '#c898ff';if(x===14||y===14)return '#3a1470';
  if((x===2||x===13)&&(y===2||y===13))return '#ffe9a0';return ['#7a3ad0','#8a48e0','#9a58f0','#8a48e0'][f]}));
 // post chutes (square riveted mail-chute columns with a hatch on top; enter by pressing down)
 const chuteBody=(xx,y)=>{if(xx===0||xx===31)return '#14204a';if(xx===1)return '#7aa8ff';if(xx===30)return '#22347a';
  if(xx===15||xx===16)return '#22347a';if((xx===4||xx===27)&&(y%8===3))return '#cfe0ff';return xx<6?'#4a7ae0':xx<24?'#3a62c8':'#2c4ca0'};
 const chuteTop=(xx,y)=>{if(y===0||y===15||xx===0||xx===31)return '#14204a';if(y===1||xx===1)return '#a8c8ff';if(y===14||xx===30)return '#22347a';
  if(y>=4&&y<=11&&xx>=5&&xx<=26){if(y===4||y===11||xx===5||xx===26)return '#0a1030';const cy=y-5,dx=Math.abs(xx-15.5);if(dx<=7-cy*1.1&&dx>=5-cy*1.1)return '#ffd040';return '#1a2450'}
  if((xx===3||xx===28)&&(y===3||y===12))return '#ffe9a0';return '#4a7ae0'};
 T['[']=pix(16,16,(x,y)=>chuteTop(x,y));T[']']=pix(16,16,(x,y)=>chuteTop(x+16,y));
 T['{']=pix(16,16,(x,y)=>chuteBody(x,y));T['}']=pix(16,16,(x,y)=>chuteBody(x+16,y));
 T['=']=pix(16,16,(x,y)=>{if(y<2){return (x===2||x===13)?'#5a3a1a':null}if(y===2)return '#e8c080';if(y<7)return x%8===7?'#5a3a1a':(y===3?'#d0a060':'#b07a40');if(y===7)return '#5a3a1a';
  if((x===2||x===13)&&y<12)return '#6a4a24';return null});
 T.C=pix(16,16,(x,y)=>{const b=Math.min(Math.hypot(x-4,y-6),Math.hypot(x-11,y-5),Math.hypot(x-8,y-9)*1.1);if(y>13)return y===14?'#b8c8f0':null;if(b>6.2&&y<10)return null;
  if(y<10&&b>5.3)return '#b8c8f0';return y>10?'#dce6ff':'#ffffff'});
 T.L=[0,1,2,3].map(f=>pix(16,16,(x,y)=>{const wv=3+Math.round(Math.sin((x+f*4)*Math.PI/8)*1.5);if(y<wv)return null;if(y<wv+2)return '#ffe070';return (hash(x,y+f)<0.1)?'#ffb030':'#ff6a10'}));
 T.l=[0,1].map(f=>pix(16,16,(x,y)=>{const n=hash(x+f*9,y);return n<0.12?'#ffb030':n>0.9?'#d03a08':'#ff5a0a'}));
 return T}
const TILESETS={};for(const k in THEMES)TILESETS[k]=tileSet(THEMES[k]);
const SOLID={G:1,B:1,Q:1,E:1,X:1,'[':1,']':1,'{':1,'}':1,'=':1,C:1};

// =====================================================================
//  AUDIO - synthesized chiptune (original compositions)
// =====================================================================
const AU={ctx:null,master:null,mus:null,sfx:null,muted:false,pulse:null,noiseBuf:null,
 init(){if(this.ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  try{this.ctx=new AC()}catch(e){return}
  const c=this.ctx;this.master=c.createGain();this.master.gain.value=this.muted?0:0.55;this.master.connect(c.destination);
  this.mus=c.createGain();this.mus.gain.value=0.32;this.mus.connect(this.master);this.sfx=c.createGain();this.sfx.gain.value=0.55;this.sfx.connect(this.master);
  const n=32,re=new Float32Array(n),im=new Float32Array(n);for(let i=1;i<n;i++){im[i]=0;re[i]=(2/(i*Math.PI))*Math.sin(i*Math.PI*0.25)}this.pulse=c.createPeriodicWave(re,im);
  const nb=c.createBuffer(1,c.sampleRate,c.sampleRate),d=nb.getChannelData(0);let s=1;for(let i=0;i<d.length;i++){s=(s*16807)%2147483647;d[i]=(s/1073741823.5)-1}this.noiseBuf=nb},
 unlock(){this.init();const c=this.ctx;if(!c)return;if(c.state==='suspended')c.resume().catch(()=>{});
  if(!this._unlocked){this._unlocked=true;try{const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0)}catch(e){}}},
 toggleMute(){this.muted=!this.muted;try{localStorage.setItem('brickdash.muted',this.muted?'1':'0')}catch(e){}if(this.master)this.master.gain.value=this.muted?0:0.55},
 ok(){return this.ctx&&this.ctx.state==='running'},
 tone(type,f0,f1,dur,vol,when,dest){const c=this.ctx;if(!c)return;const t=when||c.currentTime;const o=c.createOscillator(),g=c.createGain();
  if(type==='pulse')o.setPeriodicWave(this.pulse);else o.type=type;o.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+0.005);g.gain.setValueAtTime(vol,t+Math.max(0.006,dur*0.6));g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g);g.connect(dest||this.sfx);o.start(t);o.stop(t+dur+0.02)},
 noise(dur,vol,when,hp,dest){const c=this.ctx;if(!c)return;const t=when||c.currentTime;const s=c.createBufferSource();s.buffer=this.noiseBuf;const f=c.createBiquadFilter();f.type='highpass';f.frequency.value=hp||1000;
  const g=c.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(f);f.connect(g);g.connect(dest||this.sfx);s.start(t,Math.random()*0.5);s.stop(t+dur+0.02)}};
try{AU.muted=localStorage.getItem('brickdash.muted')==='1'}catch(e){}
function noteHz(n){const m=/^([A-G])([#b]?)(-?\d)$/.exec(n);if(!m)return 0;const base={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0);return 440*Math.pow(2,(base+(+m[3]+1)*12-69)/12)}
const SFX={
 jump(){AU.tone('pulse',300,620,0.13,0.22)},bigjump(){AU.tone('pulse',220,520,0.16,0.22)},
 stomp(){AU.tone('square',520,140,0.1,0.22);AU.noise(0.05,0.12,0,2000)},kick(){AU.tone('square',880,220,0.08,0.2);AU.noise(0.04,0.15,0,3000)},
 coin(){const t=AU.ctx.currentTime;AU.tone('pulse',1568,0,0.05,0.16,t);AU.tone('pulse',2093,0,0.06,0.16,t+0.05);AU.tone('pulse',2637,0,0.12,0.14,t+0.1)},
 bump(){AU.tone('triangle',160,90,0.09,0.4)},break(){AU.noise(0.25,0.35,0,400);AU.tone('square',200,60,0.15,0.12)},
 appear(){const t=AU.ctx.currentTime;for(let i=0;i<6;i++)AU.tone('pulse',300+i*90,0,0.05,0.13,t+i*0.04)},
 power(){const t=AU.ctx.currentTime;['C5','G5','C6','E5','A5','D6','G5','C6','F6'].forEach((n,i)=>AU.tone('pulse',noteHz(n),0,0.06,0.16,t+i*0.045))},
 oneup(){const t=AU.ctx.currentTime;['A5','C6','E6','A6','E6','A6'].forEach((n,i)=>AU.tone('pulse',noteHz(n),0,0.08,0.16,t+i*0.08))},
 hurt(){const t=AU.ctx.currentTime;for(let i=0;i<5;i++)AU.tone('pulse',700-i*110,0,0.06,0.16,t+i*0.06)},
 spark(){AU.tone('square',1200,500,0.07,0.12);AU.noise(0.03,0.08,0,5000)},pipe(){const t=AU.ctx.currentTime;for(let i=0;i<3;i++)AU.tone('square',180,90,0.12,0.16,t+i*0.14)},
 flag(){AU.tone('pulse',1800,300,0.9,0.12)},tick(){AU.tone('pulse',1900,0,0.02,0.06)},pause(){AU.tone('pulse',990,0,0.06,0.15);AU.tone('pulse',1320,0,0.08,0.15,AU.ctx.currentTime+0.07)},
 bosshit(){AU.noise(0.2,0.3,0,600);AU.tone('square',300,80,0.25,0.22)},bossfire(){AU.noise(0.15,0.15,0,900);AU.tone('sawtooth',260,120,0.15,0.08)},
 bossdie(){const t=AU.ctx.currentTime;for(let i=0;i<8;i++){AU.noise(0.18,0.25,t+i*0.13,300);AU.tone('square',300-i*25,60,0.15,0.12,t+i*0.13)}},
 hurry(){const t=AU.ctx.currentTime;['E6','C6','E6','C6'].forEach((n,i)=>AU.tone('pulse',noteHz(n),0,0.08,0.13,t+i*0.1))},
 checkpoint(){const t=AU.ctx.currentTime;['D5','A5','D6'].forEach((n,i)=>AU.tone('pulse',noteHz(n),0,0.1,0.15,t+i*0.09))},
 select(){AU.tone('pulse',880,0,0.05,0.12)},geyser(){AU.noise(0.4,0.08,0,300)}};
function sfx(n){if(!AU.ok()||!SFX[n])return;try{SFX[n]()}catch(e){}}

// Songs: 16th-note grids. Tokens: note (C5, F#4, Bb3), '-' sustain, '.' rest. Drums: k kick, s snare, h hat.
const SONGS={
 over:{bpm:132,loop:true,lead:"F5 . A5 . C6 . A5 . G5 - - . E5 . C5 . D5 . F5 . A5 - G5 . F5 - - - . . . . Bb5 . A5 . G5 . F5 . E5 . G5 . C6 - - . A5 . F5 . G5 . E5 . F5 - - - . . C5 D5 "+
  "A5 . A5 C6 . A5 G5 . F5 . D5 . F5 - - . G5 . G5 Bb5 . G5 F5 . E5 . C5 . E5 - - . D5 . F5 . A5 . D6 . C6 . Bb5 . A5 . G5 . A5 . F5 . G5 . E5 . F5 - - - - - . .",
  bass:"F3 . . . C4 . . . F3 . . . C4 . A3 . D3 . . . A3 . . . D3 . . . A3 . F3 . Bb2 . . . F3 . . . C3 . . . G3 . . . F3 . . . C3 . . . F3 . C3 . F3 . . . "+
  "F3 . . . C4 . . . D3 . . . A3 . . . C3 . . . G3 . . . C3 . . . E3 . G3 . Bb2 . . . F3 . . . A2 . . . D3 . . . Bb2 . . . C3 . . . F3 . . . . . . . ",
  drum:"k . h . s . h . k . h k s . h h k . h . s . h . k . h k s . h h k . h . s . h . k . h k s . h h k . h . s . h . k . k . s s s s "+
  "k . h . s . h . k . h k s . h h k . h . s . h . k . h k s . h h k . h . s . h . k . h k s . h h k . h . s . h . k . h . s . . ."},
 under:{bpm:112,loop:true,lead:"A4 . . . . . C5 . E5 . . . D5 . . . C5 . . . B4 . . . G4 . . . . . . . A4 . . . . . E5 . G5 . . . F5 . E5 . D5 . . . E5 . . . A4 - - - . . . . "+
  "C5 . . . E5 . . . A5 . . . G5 . E5 . F5 . . . D5 . . . B4 . . . . . . . C5 . D5 . E5 . . . G5 . F5 . E5 . D5 . B4 . . . G#4 . . . A4 - - - - - - .",
  bass:"A2 . A3 . E3 . A2 . G2 . G3 . D3 . G2 . F2 . F3 . C3 . F2 . E2 . E3 . B2 . E2 . A2 . A3 . E3 . A2 . G2 . G3 . D3 . G2 . F2 . F3 . C3 . F2 . E2 . E3 . G#2 . E2 . "+
  "A2 . A3 . E3 . A2 . C3 . C4 . G3 . C3 . D3 . D4 . A3 . D3 . E2 . E3 . B2 . E2 . F2 . F3 . C3 . F2 . D2 . D3 . A2 . D2 . E2 . E3 . B2 . E2 . A2 . E3 . A2 . . .",
  drum:"k . . h . . s . k . . h . . s . k . . h . . s . k . . h s . s . k . . h . . s . k . . h . . s . k . . h . . s . k . . h s . s s "+
  "k . . h . . s . k . . h . . s . k . . h . . s . k . . h s . s . k . . h . . s . k . . h . . s . k . . h . . s . k . k . s . . ."},
 sky:{bpm:144,loop:true,lead:"D5 . F#5 . A5 . D6 . C#6 . A5 . E5 . A5 . B5 . G5 . D5 . G5 . F#5 . E5 . D5 - - . D5 . F#5 . A5 . D6 . E6 . D6 . C#6 . A5 . B5 . D6 . G5 . B5 . A5 - - - . . . . "+
  "G5 . . . A5 . B5 . A5 . F#5 . D5 . . . E5 . . . F#5 . G5 . F#5 . D5 . A4 . . . B4 . C#5 . D5 . E5 . F#5 . G5 . A5 . B5 . C#6 . . . E6 . . . D6 - - - - - . .",
  bass:"D3 . A3 . D4 . A3 . A2 . E3 . A3 . E3 . G2 . D3 . G3 . D3 . D3 . A3 . D4 . A3 . D3 . A3 . D4 . A3 . A2 . E3 . A3 . E3 . G2 . D3 . G3 . D3 . A2 . E3 . A3 . C#3 . "+
  "G2 . D3 . G3 . D3 . D3 . A3 . D4 . A3 . A2 . E3 . A3 . E3 . F#2 . C#3 . F#3 . C#3 . G2 . D3 . G3 . D3 . A2 . E3 . A3 . E3 . A2 . E3 . A3 . C#3 . D3 . A3 . D3 . . .",
  drum:"k . h h s . h . k k h . s . h h k . h h s . h . k . h . s h s h k . h h s . h . k k h . s . h h k . h h s . h . k . s . s s s s "+
  "k . h h s . h . k k h . s . h h k . h h s . h . k . h . s h s h k . h h s . h . k k h . s . h h k . h h s . h . k . h . s . . ."},
 castle:{bpm:120,loop:true,lead:"D5 . . C#5 D5 . F5 . E5 . . D5 C#5 . A4 . Bb4 . . A4 Bb4 . D5 . C#5 - - - . . . . D5 . . C#5 D5 . G5 . F5 . . E5 D5 . A4 . Bb4 . G4 . A4 . C#5 . D5 - - - . . . . ",
  bass:"D2 D3 D2 D3 D2 D3 D2 D3 D2 D3 D2 D3 D2 D3 D2 D3 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 A1 A2 A1 A2 A1 A2 C#2 C#3 D2 D3 D2 D3 D2 D3 D2 D3 G1 G2 G1 G2 G1 G2 G1 G2 Bb1 Bb2 Bb1 Bb2 A1 A2 A1 A2 D2 D3 D2 D3 D2 . . . ",
  drum:"k . . . s . . . k . k . s . . . k . . . s . . . k . k . s . s . k . . . s . . . k . k . s . . . k . . . s . . . k . s s s . s ."},
 boss:{bpm:168,loop:true,lead:"D5 D5 . F5 . D5 G#5 . A5 . . G#5 . F5 . E5 D5 D5 . F5 . D5 A5 . Bb5 . . A5 . G#5 . A5 F5 F5 . G#5 . F5 B5 . C6 . . B5 . G#5 . F5 E5 . D5 . E5 . F5 . E5 . C#5 . A4 . . .",
  bass:"D2 . D3 . D2 . D3 . D2 . D3 . D2 . D3 . Bb1 . Bb2 . Bb1 . Bb2 . A1 . A2 . A1 . A2 . F2 . F3 . F2 . F3 . G#1 . G#2 . G#1 . G#2 . A1 . A2 . A1 . A2 . A1 . A2 . C#2 . E2 .",
  drum:"k h s h k h s h k h s h k k s s k h s h k h s h k h s h k k s s k h s h k h s h k h s h k k s s k h s h k h s h k s k s s s s s"},
 star:{bpm:176,loop:true,lead:"C6 . E6 G6 . E6 C6 . D6 . F6 A6 . F6 D6 . E6 . G6 B6 . G6 E6 . F6 . A6 C7 . A6 G6 . ",bass:"C3 C4 C3 C4 C3 C4 C3 C4 D3 D4 D3 D4 D3 D4 D3 D4 E3 E4 E3 E4 E3 E4 E3 E4 F3 F4 F3 F4 G3 G4 G3 G4",drum:"k h s h k h s h k h s h k h s s k h s h k h s h k h s h k s s s"},
 title:{bpm:120,loop:true,lead:"G5 . . . E5 . G5 . A5 . . . G5 . E5 . D5 . . . C5 . D5 . E5 - - - . . . . G5 . . . E5 . G5 . C6 . . . B5 . A5 . G5 . A5 . F5 . D5 . C5 - - - . . . . ",
  bass:"C3 . G3 . C4 . G3 . F3 . C4 . F3 . C4 . G2 . D3 . G3 . D3 . C3 . G3 . E3 . G3 . C3 . G3 . C4 . G3 . A2 . E3 . A3 . E3 . F2 . C3 . G2 . D3 . C3 . G3 . C3 . . . ",drum:"k . . . h . . . s . . . h . . . k . . . h . . . s . . . h . h h "},
 clear:{bpm:150,loop:false,lead:"E5 . G5 . D5 . F5 . A5 . G5 B5 C6 - - - - - . .",bass:"C3 . . . G2 . . . F2 . G2 . C3 - - - - - . .",drum:"k . . . s . . . k . s . . . . . . . . ."},
 die:{bpm:130,loop:false,lead:"B5 . A5 . F5 . . D5 . . C#5 - D5 - - - . . . .",bass:"G3 . F3 . D3 . . Bb2 . . A2 - D2 - - - . . . .",drum:". . . . . . . . . . . . . . . . . . . ."},
 over_g:{bpm:110,loop:false,lead:"A4 . . . G4 . . . F4 . . . E4 - - - D4 - - - . . . . . . . .",bass:"D3 . . . C3 . . . Bb2 . . . A2 - - - D2 - - - . . . . . . . .",drum:"k . . . . . . . k . . . . . . . s . . . . . . . . . . ."},
 win:{bpm:140,loop:false,lead:"C5 . E5 . G5 . C6 . A5 . F5 . A5 . C6 . D6 . B5 . G5 . D6 . E6 - - - G6 - - - E6 - - - C6 - - - - - - - . . . .",
  bass:"C3 . G3 . C3 . G3 . F3 . C4 . F3 . C4 . G2 . D3 . G2 . D3 . C3 - - - E3 - - - G3 - - - C3 - - - - - - - . . . .",drum:"k . h . s . h . k . h . s . h . k . h . s . h h k . . . s . . . k . . . s . . . k . . . . . . ."}};
for(const k in SONGS){const s=SONGS[k];s.ch=['lead','bass','drum'].map(c=>s[c].trim().split(/\s+/));s.len=Math.max(...s.ch.map(a=>a.length))}
const Music={song:null,name:'',step:0,next:0,tempo:1,
 play(name,force){if(this.name===name&&this.song&&!force)return;this.name=name;this.song=SONGS[name]||null;this.step=0;if(AU.ctx)this.next=AU.ctx.currentTime+0.06},
 stop(){this.song=null;this.name=''},
 tick(){const c=AU.ctx;if(!this.song||!c||c.state!=='running')return;const s=this.song;const spb=60/(s.bpm*this.tempo)/4;
  if(this.next<c.currentTime-0.25)this.next=c.currentTime+0.02;
  while(this.next<c.currentTime+0.14){
   for(let ci=0;ci<3;ci++){const arr=s.ch[ci];const tok=arr[this.step%arr.length];if(!tok||tok==='.'||tok==='-')continue;
    if(ci===2){if(tok==='k')AU.tone('sine',150,40,0.12,0.5,this.next,AU.mus);else if(tok==='s'){AU.noise(0.09,0.22,this.next,1500,AU.mus)}else if(tok==='h')AU.noise(0.03,0.09,this.next,7000,AU.mus);continue}
    let len=1;for(let j=this.step+1;j<this.step+16&&arr[j%arr.length]==='-';j++)len++;
    const f=noteHz(tok);if(f)AU.tone(ci===0?'pulse':'triangle',f,0,len*spb*0.92,ci===0?0.17:0.32,this.next,AU.mus)}
   this.step++;this.next+=spb;if(this.step>=s.len){if(s.loop)this.step=0;else{this.song=null;this.name='';break}}}}};

// =====================================================================
//  INPUT - keyboard, touch (multitouch), gamepad, test override
// =====================================================================
const KEYS={};
const KEYMAP={ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r',ArrowUp:'u',KeyW:'u',ArrowDown:'d',KeyS:'d',KeyZ:'j',Space:'j',KeyK:'j',KeyX:'run',ShiftLeft:'run',ShiftRight:'run',KeyJ:'run',Enter:'start',Escape:'start',KeyP:'start'};
const LATCH={};
addEventListener('keydown',e=>{const k=KEYMAP[e.code];AU.unlock();if(k){KEYS[k]=true;if(!e.repeat)LATCH[k]=true;e.preventDefault()}if(e.code==='KeyM'&&!e.repeat)AU.toggleMute()},{passive:false});
addEventListener('keyup',e=>{const k=KEYMAP[e.code];if(k){KEYS[k]=false;e.preventDefault()}},{passive:false});
addEventListener('blur',()=>{for(const k in KEYS)KEYS[k]=false;for(const k in TOUCH)TOUCH[k]=0;if(G&&G.mode==='play'&&!G.paused)setPause(true)});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G&&G.mode==='play'&&!G.paused)setPause(true)});
const TOUCH={l:0,r:0,d:0,j:0,run:0};let touchStartFlag=false,touchTapFlag=false;
const UI={el:document.getElementById('ui'),dpad:document.getElementById('dpad'),aL:document.getElementById('aL'),aR:document.getElementById('aR'),aD:document.getElementById('aD'),
 bA:document.getElementById('bA'),bB:document.getElementById('bB'),bP:document.getElementById('bP'),lA:document.getElementById('lA'),lB:document.getElementById('lB'),geo:null};
let touchMode=('ontouchstart' in window)||navigator.maxTouchPoints>0;
function handleTouches(e){if(e.cancelable)e.preventDefault();AU.unlock();if(!touchMode){touchMode=true;layout()}
 const g=UI.geo;if(!g)return;const st={l:0,r:0,d:0,j:0,run:0};
 for(const t of e.touches){const x=t.clientX,y=t.clientY;
  const dx=x-g.dp.x,dy=y-g.dp.y,dd=Math.hypot(dx,dy);
  if(dd<g.dp.r*1.45){if(dx<-g.dp.r*0.22)st.l=1;else if(dx>g.dp.r*0.22)st.r=1;if(dy>g.dp.r*0.42&&Math.abs(dx)<g.dp.r*0.9)st.d=1;continue}
  const da=Math.hypot(x-g.a.x,y-g.a.y),db=Math.hypot(x-g.b.x,y-g.b.y);
  if(da<g.a.r*1.35)st.j=1;if(db<g.b.r*1.35)st.run=1;}
 if(e.type==='touchstart'){for(const t of e.changedTouches){const x=t.clientX,y=t.clientY;
   if(Math.abs(x-g.p.x)<g.p.w*0.9&&Math.abs(y-g.p.y)<g.p.h*1.1)touchStartFlag=true;
   else if(x>=g.cv.x&&x<=g.cv.x+g.cv.w&&y>=g.cv.y&&y<=g.cv.y+g.cv.h)touchTapFlag=true}}
 Object.assign(TOUCH,st);for(const k in st)if(st[k])LATCH[k]=true;
 UI.aL.classList.toggle('on',!!st.l);UI.aR.classList.toggle('on',!!st.r);UI.aD.classList.toggle('on',!!st.d);UI.bA.classList.toggle('on',!!st.j);UI.bB.classList.toggle('on',!!st.run)}
for(const ev of ['touchstart','touchmove','touchend','touchcancel'])document.addEventListener(ev,handleTouches,{passive:false});
document.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});
document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
document.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousedown',()=>AU.unlock());
let inputOverride=null;
function rawInput(){const K=k=>!!(KEYS[k]||LATCH[k]);const s={l:K('l'),r:K('r'),u:K('u'),d:K('d'),j:K('j'),run:K('run'),start:K('start')};for(const k in LATCH)delete LATCH[k];
 s.l=s.l||!!TOUCH.l;s.r=s.r||!!TOUCH.r;s.d=s.d||!!TOUCH.d;s.j=s.j||!!TOUCH.j;s.run=s.run||!!TOUCH.run;
 if(touchStartFlag){s.start=true;touchStartFlag=false}if(touchTapFlag){s.tap=true;touchTapFlag=false}
 const gps=navigator.getGamepads?navigator.getGamepads():[];
 if(gps)for(const gp of gps){if(!gp||!gp.connected)continue;const b=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed);const ax=gp.axes[0]||0,ay=gp.axes[1]||0;
  s.l=s.l||ax<-0.45||b(14);s.r=s.r||ax>0.45||b(15);s.d=s.d||ay>0.55||b(13);s.u=s.u||ay<-0.55||b(12);s.j=s.j||b(0)||b(1);s.run=s.run||b(2)||b(3)||b(5)||b(7);s.start=s.start||b(9)}
 if(inputOverride)return Object.assign({l:false,r:false,u:false,d:false,j:false,run:false,start:false},inputOverride);
 return s}
let prevRaw={};
function pollInput(){const s=rawInput();const o=Object.assign({},s);for(const k of ['l','r','u','d','j','run','start'])o[k+'p']=s[k]&&!prevRaw[k];o.tapp=!!s.tap;prevRaw=s;return o}

// Layout: integer scaling in device pixels, touch controls placement
function readSafe(){const cs=getComputedStyle(document.getElementById('sa'));return{t:parseFloat(cs.paddingTop)||0,r:parseFloat(cs.paddingRight)||0,b:parseFloat(cs.paddingBottom)||0,l:parseFloat(cs.paddingLeft)||0}}
function layout(){
 const vw=window.innerWidth,vh=window.innerHeight,dpr=window.devicePixelRatio||1,sa=readSafe(),land=vw>vh,show=touchMode;
 UI.el.classList.toggle('show',show);
 let aw=vw-sa.l-sa.r,ah=vh-sa.t-sa.b;let gx,gy;
 const ctrlH=show&&!land?Math.min(260,ah*0.36):0;const sideW=show&&land?Math.min(170,aw*0.22):0;
 const availW=aw-sideW*2,availH=ah-ctrlH-(show&&!land?8:0);
 let k=Math.floor(Math.min(availW*dpr/W,availH*dpr/H));let cw,ch;
 if(k>=1){cw=W*k/dpr;ch=H*k/dpr}else{const s=Math.min(availW/W,availH/H);cw=W*s;ch=H*s}
 gx=sa.l+(aw-cw)/2;gy=land||!show?sa.t+(ah-ch)/2:sa.t+Math.max(4,(availH-ch)*0.3);
 Object.assign(cv.style,{width:cw+'px',height:ch+'px',left:gx+'px',top:gy+'px'});
 const geo={cv:{x:gx,y:gy,w:cw,h:ch}};
 if(land){const r=Math.min(64,ah*0.19,(gx-sa.l)*0.42||64);const R=Math.max(44,r);const br=Math.max(30,Math.min(40,R*0.62));
  geo.dp={x:sa.l+Math.max(R+14,(gx-sa.l)/2),y:vh-sa.b-R-22,r:R};
  const rx=vw-sa.r-Math.max(R+14,(vw-sa.r-(gx+cw))/2);
  geo.a={x:rx+br*0.95,y:vh-sa.b-br*2.5-18,r:br};geo.b={x:rx-br*1.15,y:vh-sa.b-br*1.25-14,r:br};
  geo.p={x:vw-sa.r-34,y:sa.t+24,w:44,h:30};
 } else {const top=gy+ch+8,bot=vh-sa.b-10,mid=(top+bot)/2;const R=Math.min(70,(bot-top)*0.36,vw*0.19);const br=Math.min(42,R*0.64);
  geo.dp={x:sa.l+R+26,y:mid+R*0.1,r:R};geo.a={x:vw-sa.r-br-22,y:mid-br*0.55,r:br};geo.b={x:vw-sa.r-br*3.3-22,y:mid+br*0.75,r:br};
  geo.p={x:vw/2,y:top+22,w:44,h:30};}
 UI.geo=geo;
 const place=(el,c,r)=>Object.assign(el.style,{left:(c.x-r)+'px',top:(c.y-r)+'px',width:r*2+'px',height:r*2+'px'});
 place(UI.dpad,geo.dp,geo.dp.r);place(UI.bA,geo.a,geo.a.r);place(UI.bB,geo.b,geo.b.r);
 Object.assign(UI.lA.style,{left:(geo.a.x-40)+'px',top:(geo.a.y+geo.a.r+3)+'px'});Object.assign(UI.lB.style,{left:(geo.b.x-40)+'px',top:(geo.b.y+geo.b.r+3)+'px'});
 Object.assign(UI.bP.style,{left:(geo.p.x-22)+'px',top:(geo.p.y-15)+'px'});
 const R=geo.dp.r,s=R*0.26;const tri=(el,dir,cx,cy)=>{el.style.borderWidth='0';Object.assign(el.style,{left:'',top:'',right:'',bottom:''});
  if(dir==='l'){el.style.borderWidth=`${s}px ${s*1.2}px ${s}px 0`;el.style.borderRightColor='#fff';el.style.left=(cx-s*1.2/2)+'px';el.style.top=(cy-s)+'px'}
  if(dir==='r'){el.style.borderWidth=`${s}px 0 ${s}px ${s*1.2}px`;el.style.borderLeftColor='#fff';el.style.left=(cx-s*1.2/2)+'px';el.style.top=(cy-s)+'px'}
  if(dir==='d'){el.style.borderWidth=`${s*1.0}px ${s*0.8}px 0 ${s*0.8}px`;el.style.borderTopColor='#fff';el.style.left=(cx-s*0.8)+'px';el.style.top=(cy-s*0.5)+'px'}};
 tri(UI.aL,'l',R*0.42,R);tri(UI.aR,'r',R*1.58,R);tri(UI.aD,'d',R,R*1.6);}
addEventListener('resize',layout);addEventListener('orientationchange',()=>setTimeout(layout,120));if(window.visualViewport)visualViewport.addEventListener('resize',layout);
