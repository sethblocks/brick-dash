// =====================================================================
//  LEVELS - handcrafted with a small builder (tile rows 0..14, ground top row 13)
// =====================================================================
function Builder(w,theme,name){
 const map=[];for(let y=0;y<ROWS;y++)map.push(new Array(w).fill(' '));
 const b={w,theme,name,map,ents:[],content:{},plats:[],warps:[],geysers:[],decor:[],start:3,checkpoint:null,flag:null,hut:null,boss:null,exitTube:null,music:theme,time:400,
  set(x,y,c){if(x>=0&&x<w&&y>=0&&y<ROWS)map[y][x]=c;return b},
  fill(x0,x1,y0,y1,c){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)b.set(x,y,c);return b},
  ground(x0,x1,top=13){return b.fill(x0,x1,top,14,'G')},
  lava(x0,x1){b.fill(x0,x1,13,13,'L');return b.fill(x0,x1,14,14,'l')},
  row(x,y,s){[...s].forEach((c,i)=>{if(c!=='.')b.set(x+i,y,c)});return b},
  q(x,y,c='coin'){b.set(x,y,'Q');b.content[x+','+y]=c;return b},
  br(x,y,c){b.set(x,y,'B');if(c)b.content[x+','+y]=c;return b},
  hid(x,y,c='coin'){b.set(x,y,'h');b.content[x+','+y]=c;return b},
  coins(x,y,n){for(let i=0;i<n;i++)b.set(x+i,y,'o');return b},
  tube(x,h,base=13){const top=base-h;b.set(x,top,'[');b.set(x+1,top,']');for(let y=top+1;y<base;y++){b.set(x,y,'{');b.set(x+1,y,'}')}return top},
  stairs(x,n,dir=1,base=13){for(let i=0;i<n;i++){const cx=dir>0?x+i:x-i;b.fill(cx,cx,base-1-i,base-1,'X')}return b},
  e(t,x,y=12,o={}){b.ents.push(Object.assign({t,x,y},o));return b},
  plat(x,y,o={}){b.plats.push(Object.assign({x,y,w:3,axis:'x',range:64,period:240,phase:0},o));return b},
  geyser(x,o={}){b.geysers.push(Object.assign({x,period:150,on:50,offset:0,height:4},o));return b},
  deco(t,x,y){b.decor.push({t,x,y});return b}};
 return b}
const LEVELS=[
 // ---------------- STAGE 1 : MEADOW RUN (overworld) ----------------
 function(){const b=Builder(212,'over','MEADOW RUN');
  b.ground(0,69).ground(72,90).ground(94,130).ground(135,170).ground(173,211);
  b.deco('sign',5,12);
  b.q(12,9,'coin');
  b.br(18,9).q(19,9,'pow').br(20,9).q(21,9,'coin').br(22,9).q(20,5,'coin');
  b.e('blob',25);
  b.tube(28,2);b.e('blob',33);b.tube(37,3);b.e('blob',42).e('blob',44);
  const t1=b.tube(48,3);b.warps.push({x:48,top:t1,room:0});
  b.hid(56,9,'1up');b.coins(59,10,3);b.e('beetle',64);
  b.coins(70,9,2);
  b.row(76,9,'BBB').q(79,9,'coin').br(80,9,'coins');
  b.row(83,6,'BBBBBB').q(85,6,'coin');b.coins(83,5,6);
  b.e('beetle',86).e('blob',89);
  b.coins(91,9,3);
  b.stairs(98,4,1);b.stairs(105,4,-1);
  b.e('blob',109).e('blob',111);
  b.checkpoint=113;
  b.e('hopper',117);
  b.row(119,9,'BB').br(121,9,'star').row(122,9,'BB');b.coins(120,6,3);
  b.hid(127,9,'coin');
  b.set(131,9,'o').set(132,8,'o').set(133,8,'o').set(134,9,'o');
  b.e('flyer',142,8);b.e('blob',146).e('blob',148);
  b.exitTube={x:152,top:b.tube(152,2)};
  b.e('beetle',158);b.row(159,9,'BB').br(161,9,'coins').row(162,9,'BB');
  b.tube(166,3);
  b.coins(171,10,2);
  b.e('hopper',176);
  b.stairs(180,8,1);
  b.flag=196;b.hut=200;
  return b},
 // ---------------- STAGE 2 : CRYSTAL MINES (underground) ----------------
 function(){const b=Builder(205,'under','CRYSTAL MINES');b.music='under';
  b.fill(0,179,2,2,'B');b.fill(0,0,3,12,'X');
  b.ground(0,39).ground(42,63).ground(72,118).ground(121,150).ground(153,204);
  b.q(10,9,'coin').q(11,9,'pow').q(12,9,'coin');
  b.e('blob',16).e('blob',18);
  b.fill(24,24,10,12,'X');b.e('beetle',28);
  b.row(29,9,'BBBBBB').br(31,9,'coins');b.coins(29,8,6);
  b.hid(36,9,'1up');b.e('hopper',38);
  b.fill(46,54,4,9,"B");b.q(50,9,"pow");
  b.e('beetle',52).e('blob',57).e('blob',60);
  b.plat(64,13,{axis:'x',range:80,period:260,w:3});
  b.coins(66,10,4);
  b.row(76,9,'BBQBB');b.content['78,9']='star';
  b.e('beetle',81).e('beetle',84);
  b.fill(87,88,11,12,'X');
  b.row(91,9,'BBBBBBBB').br(94,9,'coins');b.coins(91,8,8);
  b.checkpoint=101;
  b.e('hopper',106).e('hopper',111);
  const t1=b.tube(114,2);b.warps.push({x:114,top:t1,room:1});
  b.e('blob',124).e('blob',126).e('beetle',130);
  b.row(132,9,'BBQB');b.content['134,9']='coin';
  b.exitTube={x:137,top:b.tube(137,2)};
  b.plat(141,12,{axis:'y',range:64,period:220,w:2});
  b.fill(144,149,9,12,'X');b.coins(145,8,4);
  b.e('blob',147,8);
  b.stairs(160,4,1);b.e('beetle',168).e('blob',172);
  b.hid(176,9,'coin');
  for(let x=180;x<205;x+=6)b.deco('crystal',x,12);
  b.flag=191;b.hut=195;
  return b},
 // ---------------- STAGE 3 : SKYBRIDGE HEIGHTS ----------------
 function(){const b=Builder(212,'sky','SKYBRIDGE HEIGHTS');b.music='sky';
  b.ground(0,14);
  b.fill(15,24,11,11,'=');b.e('blob',21,10);
  b.fill(28,40,10,10,'=');b.q(32,6,'pow');b.e('hopper',37,9);b.coins(29,7,3);
  b.plat(41,10,{axis:'x',range:96,period:300});
  b.fill(51,58,9,9,'C');b.e('flyer',56,5);
  b.fill(63,75,10,10,'=');b.row(66,6,'BQB');b.e('beetle',71,9);
  b.plat(77,11,{axis:'y',range:48,period:200});b.plat(81,8,{axis:'y',range:40,period:200,phase:100});
  b.fill(85,95,8,8,'C');b.checkpoint=89;b.coins(86,5,3);
  b.fill(100,112,10,10,'=');b.e('flyer',106,6).e('blob',109,9);b.hid(103,6,'1up');
  b.plat(113,10,{axis:'x',range:64,period:240});b.plat(119,9,{axis:'x',range:64,period:240,phase:120});
  b.fill(125,140,10,10,'=');b.row(128,6,'BBB').br(129,6,'star');b.e('beetle',134,9).e('hopper',138,9);
  b.fill(143,145,9,9,'C');b.fill(148,150,8,8,'C');b.fill(153,155,7,7,'C');b.e('flyer',150,4);
  b.coins(148,6,3);b.coins(153,5,3);
  b.fill(158,176,10,10,'=');b.e('blob',162,9).e('blob',166,9);b.q(170,6,'coin');
  b.ground(181,211);b.stairs(186,4,1);
  b.flag=196;b.hut=200;
  return b},
 // ---------------- STAGE 4 : CINDER KEEP (castle + boss) ----------------
 function(){const b=Builder(157,'castle','CINDER KEEP');b.music='castle';b.time=300;
  b.fill(0,156,2,3,'G');b.fill(156,156,4,14,'G');
  b.ground(0,15).lava(16,19).ground(20,34).lava(35,42).ground(43,60).lava(61,63).ground(64,84).lava(85,96).ground(97,112).lava(113,115).ground(116,143).lava(144,149).ground(150,155);
  b.q(8,9,'pow');
  b.fill(24,30,4,7,'G');b.e('blob',26).e('beetle',31);
  b.plat(35,11,{axis:'x',range:80,period:240});
  b.row(46,9,'BB').q(48,9,'pow').row(49,9,'BB');b.e('blob',52).e('blob',55).e('beetle',58);
  b.geyser(62,{offset:0});
  b.checkpoint=70;b.e('hopper',76);b.row(78,9,'BBBB').br(79,9,'coins');
  b.plat(85,11,{axis:'x',range:48,period:200});b.plat(90,10,{axis:'x',range:48,period:200,phase:100});
  b.fill(100,110,4,8,'G');b.e('beetle',104).e('blob',108);
  b.geyser(114,{offset:75});
  b.e('flyer',124,7);b.e('hopper',130);b.hid(128,8,'1up');b.q(122,9,'coin');
  b.plat(144,11,{axis:'x',range:48,period:180});
  b.boss={x:152,minX:150,maxX:155};
  return b}];
// Bonus rooms reached through tubes
const ROOMS=[
 function(){const b=Builder(16,'under','BONUS ROOM');b.ground(0,15);b.fill(0,0,2,12,'B');b.fill(15,15,2,12,'B');b.fill(1,14,2,2,'B');
  b.coins(3,6,9);b.coins(3,8,9);b.coins(3,10,9);b.row(3,11,'XXXXXXXX');b.start=2;b.exit={x:12,top:b.tube(12,2)};return b},
 function(){const b=Builder(16,'under','BONUS ROOM');b.ground(0,15);b.fill(0,0,2,12,'B');b.fill(15,15,2,12,'B');b.fill(1,14,2,2,'B');
  b.coins(2,9,8);b.coins(4,7,6);b.coins(5,5,4);b.row(2,10,'BBBBBBBB');b.br(5,10,'coins');b.start=2;b.exit={x:12,top:b.tube(12,2)};return b}];
