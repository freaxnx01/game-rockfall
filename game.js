(function(){
'use strict';
if (customElements.get('boulder-game')) return;

const TILE=16, COLS=40, ROWS=22, HUD=24, TICK=140;
const CW=COLS*TILE, CH=ROWS*TILE+HUD;
const EMP=0, DIRT=1, BRICK=2, STEEL=3, ROCK=4, GEM=5, EXIT=6, MAGIC=7, FLY=8, BUG=9, MAN=10, BOOM=11;
const DX=[0,1,0,-1], DY=[-1,0,1,0];
const ccw=d=>(d+3)&3, cw=d=>(d+1)&3;
const MAGIC_TICKS=Math.round(45000/TICK);

const PALS=[
 {dirt:['#8a5a28','#6f4720','#a06c31'], brick:['#b0392f','#7d241d','#d55c45']},
 {dirt:['#6f6d2a','#565416','#8b8838'], brick:['#3f6fb5','#2a4c85','#6b96d6']},
 {dirt:['#6d4a63','#523548','#8a6280'], brick:['#2f8f7a','#1e6355','#4fb89e']},
 {dirt:['#4f5d75','#3a4457','#697b95'], brick:['#a5457e','#742f59','#c76ba0']},
 {dirt:['#4e7040','#39522d','#688f55'], brick:['#b57031','#7e4c1e','#d69350']},
];

const LEVELS=[
{name:'FIRST STEPS', quota:10, time:120, map:[
"#P.....o.......*..........o............#",
"#..*...o..............o............*...#",
"#......o..........................o....#",
"#..........====.====...................#",
"#...o..*...=...*...=.........o.o.o.....#",
"#..........=..o.o..=.........o.*.o.....#",
"#....o.....=...*...=.........o.o.o.....#",
"#..........====.====...................#",
"#..*....................*..............#",
"#...........o......................o...#",
"#....o.o........*..........*...........#",
"#....*.*..............o................#",
"#....o.o.........o.....................#",
"#..........*..........*.......o...*....#",
"#...............o......................#",
"#..o.....*.............o.o.............#",
"#........................*.........*...#",
"#..*..........o........................#",
"#..........................o.......*...#",
"#....................o.............E...#"]},
{name:'ROCKSLIDE', quota:12, time:130, map:[
"#P......................*..............#",
"#..o.o.o......o.o.o...........o.o.o....#",
"#..o.*.o......o.*.o...........o.*.o....#",
"#..o.o.o......o.o.o...........o.o.o....#",
"#......................................#",
"#...=========..........................#",
"#...=       =.....*.....o..o...........#",
"#...= ===== =...........*..*...........#",
"#...=q     *=...........o..o...........#",
"#...=========..........................#",
"#......................................#",
"#.....o..........*..........o..........#",
"#.....*......................*.........#",
"#.....o......====.====.......o.........#",
"#............=  *.*  =.................#",
"#............=  o.o  =......*..........#",
"#............=========.................#",
"#..*..............................o....#",
"#.........o.o.........*...........*....#",
"#....*................o...........E....#"]},
{name:'FIREFLY DEN', quota:11, time:140, map:[
"#P.....................................#",
"#...*.....o.......*.........o......*...#",
"#......................................#",
"#....=========......=========..........#",
"#....=       =......=       =....o.o...#",
"#....= ===== =......= ===== =....*.*...#",
"#....=q     =......=      q=....o.o...#",
"#....=========......=========..........#",
"#......................................#",
"#..o.....*.....o.o..........*..........#",
"#..*............*.*....................#",
"#..o...................................#",
"#.........================.............#",
"#.........=              =....*........#",
"#.........= ============ =.............#",
"#.........=q     *       =....o........#",
"#.........================.............#",
"#...*..................................#",
"#.........o......*............o....*...#",
"#..................................E...#"]},
{name:'THE MILL', quota:16, time:160, map:[
"#P.....................................#",
"#.......................*..............#",
"#..o.o.o.o.o.o.................o.o.....#",
"#..o.o.o.o.o.o.................*.......#",
"#...............................o.o....#",
"#..o.o.o.o.o.o.........................#",
"#......................*...............#",
"#..MMMMMMMMMMMMMM......................#",
"#                ......*...............#",
"#                .......................#",
"#                .......................#",
"#================.......................#",
"#.......................o..............#",
"#...*.........*.........o....*.........#",
"#........................o.............#",
"#..........=====........................#",
"#..........=*.*=........o.o............#",
"#..........==.==.......*...*...........#",
"#.......................................#",
"#..*...........................E.......#"]},
{name:'BUTTERFLY FARM', quota:16, time:160, map:[
"#P....oo..............oo...............#",
"#.....oo.......*......oo............*..#",
"#.....oo..............oo...............#",
"#.......................................#",
"#..====.====.......====.====...........#",
"#..=       =.......=       =....o.o....#",
"#..= == == =.......= == == =....*.*....#",
"#..=B      =.......=      B=....o.o....#",
"#..=========.......=========...........#",
"#.......................................#",
"#....*..........o.o...........*........#",
"#...............*.*....................#",
"#....=========.........................#",
"#....=       =........o................#",
"#....= ===== =........o......*.........#",
"#....=q     =.........o................#",
"#....=========.........................#",
"#..*.......................o...........#",
"#......*..........*............*.......#",
"#..............................E.......#"]},
];

const mf=m=>440*Math.pow(2,(m-69)/12);
const BASS=[36,48,51,48,43,48,55,48,36,48,51,48,41,48,53,50];

const AU={
 ctx:null, soundOn:true, musicOn:true, step:0, nextT:0, nbuf:null,
 ensure(){
  if(!this.ctx){
   const C=window.AudioContext||window.webkitAudioContext; if(!C) return;
   this.ctx=new C();
   this.master=this.ctx.createGain(); this.master.gain.value=.5; this.master.connect(this.ctx.destination);
   this.mus=this.ctx.createGain(); this.mus.gain.value=.13; this.mus.connect(this.master);
   this.sfx=this.ctx.createGain(); this.sfx.gain.value=.3; this.sfx.connect(this.master);
   const len=this.ctx.sampleRate; this.nbuf=this.ctx.createBuffer(1,len,len);
   const d=this.nbuf.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
  }
  if(this.ctx.state==='suspended') this.ctx.resume();
 },
 tone(f0,f1,dur,type,vol,dest,at){
  if(!this.ctx||!this.soundOn) return;
  const t0=at||this.ctx.currentTime;
  const o=this.ctx.createOscillator(); o.type=type;
  o.frequency.setValueAtTime(Math.max(f0,1),t0);
  o.frequency.exponentialRampToValueAtTime(Math.max(f1,1),t0+dur);
  const g=this.ctx.createGain();
  g.gain.setValueAtTime(vol,t0); g.gain.exponentialRampToValueAtTime(.001,t0+dur);
  o.connect(g); g.connect(dest||this.sfx); o.start(t0); o.stop(t0+dur+.02);
 },
 noise(dur,vol,freq,at){
  if(!this.ctx||!this.soundOn) return;
  const t0=at||this.ctx.currentTime;
  const s=this.ctx.createBufferSource(); s.buffer=this.nbuf; s.loop=true;
  const f=this.ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq; f.Q.value=.8;
  const g=this.ctx.createGain(); g.gain.setValueAtTime(vol,t0); g.gain.exponentialRampToValueAtTime(.001,t0+dur);
  s.connect(f); f.connect(g); g.connect(this.sfx); s.start(t0); s.stop(t0+dur+.02);
 },
 dig(){ this.noise(.05,.5,900); },
 gem(){ this.tone(1244,1244,.06,'square',.4); this.tone(1864,1864,.08,'square',.4,null,this.ctx?this.ctx.currentTime+.05:0); },
 thud(){ this.noise(.09,.55,180); this.tone(75,45,.09,'triangle',.5); },
 push(){ this.noise(.08,.35,240); },
 boom(){ this.noise(.5,.9,140); this.tone(120,30,.4,'sawtooth',.4); },
 open(){ [660,880,1320].forEach((f,i)=>this.tone(f,f,.09,'square',.4,null,this.ctx?this.ctx.currentTime+i*.07:0)); },
 done(){ [523,659,784,1046,1318].forEach((f,i)=>this.tone(f,f,.11,'square',.4,null,this.ctx?this.ctx.currentTime+i*.08:0)); },
 life(){ [1046,1568].forEach((f,i)=>this.tone(f,f,.09,'square',.45,null,this.ctx?this.ctx.currentTime+i*.08:0)); },
 over(){ [392,330,262,196].forEach((f,i)=>this.tone(f,f,.18,'triangle',.5,null,this.ctx?this.ctx.currentTime+i*.16:0)); },
 tick(){ this.tone(880,880,.03,'square',.25); },
 pump(){
  if(!this.ctx||!this.soundOn||!this.musicOn) return;
  const now=this.ctx.currentTime;
  if(this.nextT<now) this.nextT=now+.06;
  while(this.nextT<now+.18){
   const s=this.step&15, bar=(this.step>>4)&3, n=BASS[s];
   this.tone(mf(n),mf(n),.1,'square',.5,this.mus,this.nextT);
   if((s&1)===0) this.noiseArr(this.nextT);
   if(bar===3&&(s&3)===0){ const L=[75,72,70,67][s>>2]; this.tone(mf(L),mf(L),.34,'triangle',.3,this.mus,this.nextT); }
   this.step++; this.nextT+=.118;
  }
 },
 noiseArr(at){
  const s=this.ctx.createBufferSource(); s.buffer=this.nbuf; s.loop=true;
  const f=this.ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value=6000;
  const g=this.ctx.createGain(); g.gain.setValueAtTime(.09,at); g.gain.exponentialRampToValueAtTime(.001,at+.03);
  s.connect(f); f.connect(g); g.connect(this.mus); s.start(at); s.stop(at+.05);
 }
};

function pixmap(g,rows,colors,ox,oy){
 rows.forEach((r,y)=>{ for(let x=0;x<r.length;x++){ const c=colors[r[x]]; if(c){ g.fillStyle=c; g.fillRect(x+ox,y+oy,1,1); } } });
}
function disc(g,cx,cy,r,col){ g.fillStyle=col; for(let y=0;y<16;y++)for(let x=0;x<16;x++){ const dx=x-cx,dy=y-cy; if(dx*dx+dy*dy<=r*r) g.fillRect(x,y,1,1);} }

const MANCOL={h:'#ecc07f',k:'#141420',s:'#2fb7e8',p:'#e8722c',b:'#20242e'};
const MAN_TOP=[
'..hhhh..','.hhhhhh.','.hkhhkh.','.hhhhhh.','..hhhh..','.ssssss.','ss.ss.ss','s.ssss.s','h.ssss.h'];
const LEGS={
 idle:['..pppp..','..pppp..','..p..p..','..p..p..','.bb..bb.'],
 w1:['..pppp..','.pp..pp.','.p....p.','bb....bb','........'],
 w2:['..pppp..','..pp.p..','..p..p..','.bb.bb..','........']
};
const BUGCOL={m:'#d24bd2',w:'#ffffff',c:'#f2e9c8'};
const BUG0=[
'.mm........mm.','mmmm......mmmm','mmwm......mwmm','mmmm..cc..mmmm','.mmm..cc..mmm.','..mm..cc..mm..',
'..mm..cc..mm..','.mmm..cc..mmm.','mmmm..cc..mmmm','mmwm......mwmm','mmmm......mmmm','.mm........mm.'];
const BUG1=[
'..mm......mm..','.mmm......mmm.','.mwm......mwm.','.mmm..cc..mmm.','..mm..cc..mm..','...m..cc..m...',
'...m..cc..m...','..mm..cc..mm..','.mmm..cc..mmm.','.mwm......mwm.','.mmm......mmm.','..mm......mm..'];

function makeSprites(pal){
 const S={};
 const sp=(name,fn)=>{ const cv=document.createElement('canvas'); cv.width=cv.height=16; const g=cv.getContext('2d'); fn(g); S[name]=cv; };
 sp('dirt',g=>{ g.fillStyle=pal.dirt[0]; g.fillRect(0,0,16,16);
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){ const h=(x*31+y*17+x*y)%13;
   if(h===0){g.fillStyle=pal.dirt[1];g.fillRect(x,y,1,1);} else if(h===5){g.fillStyle=pal.dirt[2];g.fillRect(x,y,1,1);} }});
 sp('brick',g=>{ g.fillStyle=pal.brick[1]; g.fillRect(0,0,16,16);
  const br=(x,y,w)=>{ g.fillStyle=pal.brick[0]; g.fillRect(x,y,w,7);
   g.fillStyle=pal.brick[2]; g.fillRect(x,y,w,1); g.fillRect(x,y,1,7);
   g.fillStyle=pal.brick[1]; g.fillRect(x,y+6,w,1); };
  br(0,0,7);br(8,0,8);br(0,8,3);br(4,8,7);br(12,8,4); });
 sp('steel',g=>{ g.fillStyle='#9aa4b2'; g.fillRect(0,0,16,16);
  g.fillStyle='#cfd8e4'; g.fillRect(0,0,16,1); g.fillRect(0,0,1,16); g.fillRect(3,3,2,1);
  g.fillStyle='#59616e'; g.fillRect(0,15,16,1); g.fillRect(15,0,1,16);
  g.fillStyle='#7b8594'; g.fillRect(12,12,2,2); });
 sp('rock',g=>{ disc(g,7.5,7.5,6.6,'#4a4a52'); disc(g,7.5,7.5,5.8,'#8f8f97');
  g.fillStyle='#c2c2c8'; g.fillRect(4,3,4,2); g.fillRect(3,5,2,3);
  g.fillStyle='#5c5c64'; g.fillRect(8,11,4,2); g.fillRect(11,8,2,3); g.fillRect(6,7,2,1); });
 for(let f=0;f<4;f++) sp('gem'+f,g=>{
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){ const d=Math.abs(x-8)+Math.abs(y-8);
   if(d<=6){ let c = d>=6?'#0d7c96' : (y<8?'#63e7f2':'#1fa9c9'); if(d<=2) c='#c9fbff'; g.fillStyle=c; g.fillRect(x,y,1,1);} }
  g.fillStyle='#ffffff'; const px=3+f*3; g.fillRect(Math.min(px,11),Math.max(4,10-f*2),2,1); g.fillRect(8,8,1,1); });
 sp('exitC',g=>{ g.fillStyle='#59616e'; g.fillRect(0,0,16,16);
  g.fillStyle='#3a4048'; g.fillRect(0,0,16,1); g.fillRect(0,0,1,16); g.fillRect(0,15,16,1); g.fillRect(15,0,1,16);
  g.fillStyle='#23272e'; g.fillRect(3,3,10,10); });
 for(let f=0;f<2;f++) sp('exitO'+f,g=>{ g.drawImage(S.exitC,0,0);
  g.fillStyle=f?'#ffe14d':'#8a6a10'; g.fillRect(3,3,10,10);
  if(f){ g.fillStyle='#fff8d0'; g.fillRect(6,6,4,4);} });
 for(let f=0;f<2;f++) sp('magic'+f,g=>{ g.drawImage(S.brick,0,0);
  for(let x=0;x<16;x++){ const on=((x+f*2)&3)<2; g.fillStyle=on?'#7ff7ff':'#ffffff'; g.fillRect(x,7,1,2*((x+f)%2?1:1)); g.fillRect(x,7+((x+f)&1),1,1);} });
 for(let f=0;f<2;f++) sp('fly'+f,g=>{ const c1=f?'#ffd23f':'#ffffff', c2=f?'#ffffff':'#ffd23f';
  g.fillStyle=c1; g.fillRect(3,3,10,1); g.fillRect(3,12,10,1); g.fillRect(3,3,1,10); g.fillRect(12,3,1,10);
  g.clearRect(f?5:9,3,2,1); g.clearRect(f?9:5,12,2,1);
  g.fillStyle=c2; g.fillRect(7,7,2,2); });
 sp('bug0',g=>pixmap(g,BUG0,BUGCOL,1,2));
 sp('bug1',g=>pixmap(g,BUG1,BUGCOL,1,2));
 const man=(name,legs)=>sp(name,g=>{ pixmap(g,MAN_TOP,MANCOL,4,1); pixmap(g,legs,MANCOL,4,10); });
 man('man_idle0',LEGS.idle); man('man_idle1',LEGS.idle); man('man_w0',LEGS.w1); man('man_w1',LEGS.w2);
 sp('boom0',g=>{ g.fillStyle='#ffffff'; g.fillRect(7,3,2,10); g.fillRect(3,7,10,2); g.fillRect(5,5,2,2); g.fillRect(9,9,2,2); g.fillRect(9,5,2,2); g.fillRect(5,9,2,2); });
 sp('boom1',g=>{ disc(g,7.5,7.5,7,'#ff8a2a'); disc(g,7.5,7.5,4.5,'#ffd23f'); disc(g,7.5,7.5,2,'#ffffff'); });
 sp('boom2',g=>{ g.fillStyle='#ff8a2a'; g.fillRect(2,2,2,2); g.fillRect(12,3,2,2); g.fillRect(3,11,2,2); g.fillRect(11,12,2,2);
  g.fillStyle='#8a8a92'; g.fillRect(7,1,2,2); g.fillRect(1,7,2,2); g.fillRect(13,7,2,2); g.fillRect(7,13,2,2); });
 return S;
}

class BoulderGame extends HTMLElement{
 static get observedAttributes(){ return ['crt','music','unlock-all']; }
 connectedCallback(){
  if(this._init) return; this._init=true;
  this.style.cssText='display:block;width:100%;max-width:1180px;margin:0 auto;';
  const wrap=document.createElement('div');
  wrap.style.cssText='position:relative;background:#000;border:4px solid #23283a;box-shadow:0 0 0 4px #0b0e18,0 24px 60px rgba(0,0,0,.65);';
  this.cv=document.createElement('canvas'); this.cv.width=CW; this.cv.height=CH;
  this.cv.style.cssText='display:block;width:100%;image-rendering:pixelated;';
  this.crtEl=document.createElement('div');
  this.crtEl.style.cssText='position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.22) 0px,rgba(0,0,0,.22) 1px,transparent 1px,transparent 3px),radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.38));';
  wrap.appendChild(this.cv); wrap.appendChild(this.crtEl); this.appendChild(wrap);
  this.ctx=this.cv.getContext('2d'); this.ctx.imageSmoothingEnabled=false;
  try{ this.save=JSON.parse(localStorage.getItem('rockfall-save-v1'))||{}; }catch(e){ this.save={}; }
  this.save={unlocked:this.save.unlocked||1, hi:this.save.hi||0, sound:this.save.sound!==false};
  AU.soundOn=this.save.sound;
  if(this.getAttribute('music')==='false') AU.musicOn=false;
  if(this.getAttribute('crt')==='false') this.crtEl.style.display='none';
  this.unlockAll=this.getAttribute('unlock-all')==='true';
  this.state='title'; this.sel=0; this.f=0; this.stack=[]; this.msg='';
  this.sprites=makeSprites(PALS[0]);
  this._kd=e=>this.onKey(e,true); this._ku=e=>this.onKey(e,false);
  window.addEventListener('keydown',this._kd); window.addEventListener('keyup',this._ku);
  this.cv.addEventListener('pointerdown',()=>AU.ensure());
  if(document.fonts&&document.fonts.load) document.fonts.load('8px "Press Start 2P"');
  let last=performance.now(); this.acc=0; this.tAcc=0;
  const loop=t=>{ this._raf=requestAnimationFrame(loop);
   const dt=Math.min(t-last,100); last=t; this.update(dt); AU.pump(); this.render(); };
  this._raf=requestAnimationFrame(loop);
 }
 disconnectedCallback(){
  window.removeEventListener('keydown',this._kd); window.removeEventListener('keyup',this._ku);
  cancelAnimationFrame(this._raf); this._init=false;
 }
 attributeChangedCallback(n,o,v){
  if(n==='crt'&&this.crtEl) this.crtEl.style.display = v==='false'?'none':'block';
  if(n==='music') AU.musicOn = v!=='false';
  if(n==='unlock-all') this.unlockAll = v==='true';
 }
 persist(){ try{ localStorage.setItem('rockfall-save-v1',JSON.stringify(this.save)); }catch(e){} }
 unlockedCount(){ return this.unlockAll?LEVELS.length:Math.min(this.save.unlocked,LEVELS.length); }

 newGame(n){ this.lives=3; this.score=0; this.nextLife=500; this.startLevel(n); }
 startLevel(n){
  this.cur=n; const L=LEVELS[n];
  this.g=new Uint8Array(COLS*ROWS); this.fall=new Uint8Array(COLS*ROWS);
  this.dirg=new Uint8Array(COLS*ROWS); this.moved=new Uint8Array(COLS*ROWS);
  this.stage=new Uint8Array(COLS*ROWS); this.bec=new Uint8Array(COLS*ROWS);
  for(let y=0;y<ROWS;y++){
   const line=(y>=1&&y<=20?(L.map[y-1]||''):'').padEnd(COLS,'#');
   for(let x=0;x<COLS;x++){
    let t=DIRT; const ch=line[x];
    if(ch===' ')t=EMP; else if(ch==='=')t=BRICK; else if(ch==='#')t=STEEL;
    else if(ch==='o')t=ROCK; else if(ch==='*')t=GEM; else if(ch==='M')t=MAGIC;
    else if(ch==='q'){t=FLY;} else if(ch==='B'){t=BUG;}
    else if(ch==='P'){t=MAN; this.px=x; this.py=y;}
    else if(ch==='E'){t=EXIT;}
    if(y===0||y===ROWS-1||x===0||x===COLS-1) t=STEEL;
    this.g[y*COLS+x]=t;
   }
  }
  this.sprites=makeSprites(PALS[n%PALS.length]);
  this.gems=0; this.quota=L.quota; this.exitOpen=false;
  this.timeLeft=L.time; this.tAcc=0; this.acc=0;
  this.magicState=0; this.magicTimer=0;
  this.alive=true; this.walking=false; this.facing=1;
  this.flash=0; this.deadTimer=0; this.stateTimer=1300; this.state='intro';
 }

 onKey(e,down){
  const k=e.key.toLowerCase();
  let d=-1;
  if(k==='arrowup'||k==='w')d=0; else if(k==='arrowright'||k==='d')d=1;
  else if(k==='arrowdown'||k==='s')d=2; else if(k==='arrowleft'||k==='a')d=3;
  if(k.startsWith('arrow')||k===' ') e.preventDefault();
  if(d>=0){
   const i=this.stack.indexOf(d);
   if(down){ if(i<0) this.stack.push(d); }
   else if(i>=0) this.stack.splice(i,1);
  }
  if(!down||e.repeat) return;
  AU.ensure();
  if(k==='m'){ AU.soundOn=!AU.soundOn; this.save.sound=AU.soundOn; this.persist(); return; }
  const st=this.state;
  if(st==='title'){
   if(d===3) this.sel=(this.sel+this.unlockedCount()-1)%this.unlockedCount();
   if(d===1) this.sel=(this.sel+1)%this.unlockedCount();
   if(k==='enter') this.newGame(this.sel);
  } else if(st==='play'){
   if(k==='p') this.state='pause';
   else if(k==='r'&&this.alive) this.explode(this.px,this.py,false);
   else if(k==='escape') this.toTitle();
  } else if(st==='pause'){
   if(k==='p'||k==='enter') this.state='play';
   else if(k==='escape') this.toTitle();
  } else if(st==='gameover'||st==='win'){
   if(k==='enter'||k==='escape') this.toTitle();
  }
 }
 toTitle(){ this.sel=Math.min(this.cur||0,this.unlockedCount()-1); this.state='title'; }

 update(dt){
  const st=this.state;
  if(st==='intro'||st==='complete'){
   this.stateTimer-=dt;
   if(this.stateTimer<=0){
    if(st==='intro') this.state='play';
    else { if(this.cur+1<LEVELS.length) this.startLevel(this.cur+1); else { this.state='win'; } }
   }
   return;
  }
  if(st!=='play'&&st!=='dying') return;
  if(st==='play'){
   this.tAcc+=dt;
   while(this.tAcc>=1000){ this.tAcc-=1000; this.timeLeft--;
    if(this.timeLeft<=10&&this.timeLeft>0) AU.tick();
    if(this.timeLeft<=0&&this.alive){ this.explode(this.px,this.py,false); break; } }
  }
  this.acc+=dt;
  while(this.acc>=TICK){ this.acc-=TICK; this.tick(); }
 }

 tick(){
  this.moved.fill(0); this.thudded=false;
  if(this.state==='play'&&this.alive) this.movePlayer();
  if(this.magicState===1&&--this.magicTimer<=0) this.magicState=2;
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
   const i=y*COLS+x, t=this.g[i];
   if(!t||this.moved[i]) continue;
   if(t===ROCK||t===GEM) this.fallStep(x,y,i,t);
   else if(t===FLY||t===BUG) this.enemyStep(x,y,i,t);
   else if(t===BOOM){ if(this.stage[i]>=3){ this.g[i]=this.bec[i]?GEM:EMP; this.stage[i]=0; this.fall[i]=0; } else this.stage[i]++; }
  }
  if(this.deadTimer>0&&--this.deadTimer===0) this.afterDeath();
 }

 movePlayer(){
  const d=this.stack.length?this.stack[this.stack.length-1]:-1;
  this.walking=false;
  if(d<0) return;
  if(d===1)this.facing=1; if(d===3)this.facing=-1;
  const nx=this.px+DX[d], ny=this.py+DY[d], ni=ny*COLS+nx, t=this.g[ni];
  const go=()=>{ this.g[this.py*COLS+this.px]=EMP; this.g[ni]=MAN; this.fall[ni]=0; this.moved[ni]=1; this.px=nx; this.py=ny; this.walking=true; };
  if(t===EMP) go();
  else if(t===DIRT){ go(); AU.dig(); }
  else if(t===GEM){
   go(); this.gems++; this.score+=this.gems<=this.quota?10:25; AU.gem(); this.lifeCheck();
   if(this.gems===this.quota&&!this.exitOpen){ this.exitOpen=true; this.flash=5; AU.open(); }
  }
  else if(t===ROCK&&DY[d]===0&&!this.fall[ni]){
   const bi=ni+DX[d];
   if(this.g[bi]===EMP&&Math.random()<.55){ this.g[bi]=ROCK; this.moved[bi]=1; go(); AU.push(); }
  }
  else if(t===EXIT&&this.exitOpen) this.completeLevel();
 }
 lifeCheck(){ while(this.score>=this.nextLife){ this.nextLife+=500; if(this.lives<9){ this.lives++; AU.life(); this.flash=3; } } }

 fallStep(x,y,i,t){
  const bi=i+COLS, b=this.g[bi];
  const move=(di,keepFall)=>{ this.g[di]=t; this.fall[di]=keepFall?1:0; this.moved[di]=1; this.g[i]=EMP; this.fall[i]=0; };
  if(this.fall[i]){
   if(b===EMP) move(bi,true);
   else if(b===MAGIC){
    if(this.magicState===0){ this.magicState=1; this.magicTimer=MAGIC_TICKS; AU.open(); }
    this.g[i]=EMP; this.fall[i]=0;
    if(this.magicState===1){ const oi=bi+COLS; if(this.g[oi]===EMP){ this.g[oi]=t===ROCK?GEM:ROCK; this.fall[oi]=1; this.moved[oi]=1; } }
    if(!this.thudded){ AU.thud(); this.thudded=true; }
   }
   else if(b===MAN) this.explode(x,y+1,false);
   else if(b===FLY) this.explode(x,y+1,false);
   else if(b===BUG) this.explode(x,y+1,true);
   else { this.fall[i]=0; if(!this.thudded){ AU.thud(); this.thudded=true; } }
  } else {
   if(b===EMP){ move(bi,true); }
   else if(b===ROCK||b===GEM||b===BRICK){
    if(this.g[i-1]===EMP&&this.g[bi-1]===EMP) move(i-1,true);
    else if(this.g[i+1]===EMP&&this.g[bi+1]===EMP) move(i+1,true);
   }
  }
 }

 enemyStep(x,y,i,t){
  for(let d=0;d<4;d++){ if(this.g[(y+DY[d])*COLS+(x+DX[d])]===MAN){ this.explode(x,y,t===BUG); return; } }
  const pref=t===BUG?cw:ccw, back=t===BUG?ccw:cw;
  const cd=this.dirg[i];
  const tryd=dd=>{ const ni=(y+DY[dd])*COLS+(x+DX[dd]);
   if(this.g[ni]===EMP){ this.g[ni]=t; this.dirg[ni]=dd; this.moved[ni]=1; this.g[i]=EMP; return true; } return false; };
  if(!tryd(pref(cd))) if(!tryd(cd)) this.dirg[i]=back(cd);
 }

 explode(cx,cy,gem){
  AU.boom();
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const X=cx+dx,Y=cy+dy; if(X<0||Y<0||X>=COLS||Y>=ROWS) continue;
   const ci=Y*COLS+X, t=this.g[ci];
   if(t===STEEL||t===EXIT||t===MAGIC) continue;
   if(t===MAN){ this.alive=false; this.state='dying'; this.deadTimer=11; }
   this.g[ci]=BOOM; this.stage[ci]=1; this.bec[ci]=gem?1:0; this.fall[ci]=0; this.moved[ci]=1;
  }
 }
 afterDeath(){
  this.lives--;
  if(this.lives>0) this.startLevel(this.cur);
  else { this.state='gameover'; if(this.score>this.save.hi){ this.save.hi=this.score; } this.persist(); AU.over(); }
 }
 completeLevel(){
  this.bonus=this.timeLeft*2; this.score+=this.bonus; this.lifeCheck();
  if(this.cur+1<LEVELS.length) this.save.unlocked=Math.max(this.save.unlocked,this.cur+2);
  if(this.score>this.save.hi) this.save.hi=this.score;
  this.persist(); AU.done();
  this.state='complete'; this.stateTimer=2600;
 }

 txt(s,x,y,col,size,align){
  const c=this.ctx; c.font=(size||8)+'px "Press Start 2P","Courier New",monospace';
  c.textAlign=align||'left'; c.textBaseline='top'; c.fillStyle=col; c.fillText(s,x,y);
 }
 render(){
  this.f++;
  const c=this.ctx, S=this.sprites;
  c.imageSmoothingEnabled=false;
  c.fillStyle='#000'; c.fillRect(0,0,CW,CH);
  if(this.state==='title'){ this.renderTitle(); return; }
  const af=(this.f>>3)&3, a2=(this.f>>2)&1, ai=(this.f>>4)&1;
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
   const i=y*COLS+x, t=this.g[i]; if(!t) continue;
   const px=x*TILE, py=y*TILE+HUD; let sp=null;
   if(t===DIRT)sp=S.dirt; else if(t===BRICK)sp=S.brick; else if(t===STEEL)sp=S.steel;
   else if(t===ROCK)sp=S.rock; else if(t===GEM)sp=S['gem'+af];
   else if(t===EXIT)sp=this.exitOpen?S['exitO'+a2]:S.exitC;
   else if(t===MAGIC)sp=this.magicState===1?S['magic'+a2]:S.brick;
   else if(t===FLY)sp=S['fly'+a2]; else if(t===BUG)sp=S['bug'+a2];
   else if(t===BOOM)sp=S['boom'+Math.min(this.stage[i]-1,2)];
   else if(t===MAN){
    const m=this.walking?S['man_w'+a2]:S['man_idle'+ai];
    if(this.facing<0){ c.save(); c.translate(px+16,py); c.scale(-1,1); c.drawImage(m,0,0); c.restore(); }
    else c.drawImage(m,px,py);
    continue;
   }
   if(sp) c.drawImage(sp,px,py);
  }
  const gcol=this.exitOpen?(a2?'#ffffff':'#ffd23f'):'#ffffff';
  c.drawImage(S['gem'+af],4,4,16,16);
  this.txt(String(this.gems).padStart(2,'0')+'/'+String(this.quota).padStart(2,'0'),24,8,gcol);
  this.txt('TIME',110,8,'#ffd23f'); this.txt(String(Math.max(this.timeLeft,0)),150,8,this.timeLeft<=10?'#ff5a3c':'#ffffff');
  this.txt('CAVE',210,8,'#ffd23f'); this.txt(String(this.cur+1),250,8,'#ffffff');
  this.txt('MEN',290,8,'#ffd23f'); this.txt(String(this.lives),322,8,'#ffffff');
  this.txt(String(this.score).padStart(6,'0'),CW-6,8,'#ffffff',8,'right');
  if(this.flash>0){ this.flash--; c.fillStyle='rgba(255,255,255,.45)'; c.fillRect(0,HUD,CW,CH-HUD); }
  const st=this.state, blink=(this.f>>4)&1;
  if(st==='intro'){ this.shade(); this.txt('CAVE '+(this.cur+1),CW/2,150,'#ffd23f',16,'center');
   this.txt(LEVELS[this.cur].name,CW/2,180,'#ffffff',8,'center');
   this.txt('COLLECT '+this.quota+' GEMS',CW/2,205,'#7f8aa3',8,'center'); }
  else if(st==='pause'){ this.shade(); this.txt('PAUSED',CW/2,170,'#ffffff',16,'center');
   if(blink) this.txt('P TO RESUME',CW/2,205,'#7f8aa3',8,'center'); }
  else if(st==='complete'){ this.shade(); this.txt('CAVE CLEAR!',CW/2,150,'#ffd23f',16,'center');
   this.txt('TIME BONUS '+this.bonus,CW/2,185,'#ffffff',8,'center'); }
  else if(st==='gameover'){ this.shade(); this.txt('GAME OVER',CW/2,150,'#ff5a3c',16,'center');
   this.txt('SCORE '+this.score,CW/2,185,'#ffffff',8,'center');
   if(blink) this.txt('ENTER FOR TITLE',CW/2,215,'#7f8aa3',8,'center'); }
  else if(st==='win'){ this.shade(); this.txt('ALL CAVES CLEAR!',CW/2,130,'#ffd23f',16,'center');
   this.txt('FINAL SCORE '+this.score,CW/2,170,'#ffffff',8,'center');
   this.txt('HI SCORE '+this.save.hi,CW/2,192,'#7f8aa3',8,'center');
   if(blink) this.txt('ENTER FOR TITLE',CW/2,222,'#7f8aa3',8,'center'); }
 }
 shade(){ this.ctx.fillStyle='rgba(0,0,0,.62)'; this.ctx.fillRect(0,HUD,CW,CH-HUD); }
 renderTitle(){
  const c=this.ctx, S=this.sprites, af=(this.f>>3)&3, blink=(this.f>>4)&1;
  for(let x=0;x<10;x++){ c.drawImage(S['gem'+((af+x)&3)],CW/2-100+x*20,52,16,16); }
  this.txt('ROCKFALL',CW/2+3,93,'#7d241d',32,'center');
  this.txt('ROCKFALL',CW/2,90,'#ffd23f',32,'center');
  this.txt('A CAVE-DIGGING ARCADE',CW/2,138,'#7f8aa3',8,'center');
  c.drawImage(S.rock,CW/2-140,88,24,24); c.drawImage(S.rock,CW/2+116,88,24,24);
  this.txt('HI SCORE '+String(this.save.hi).padStart(6,'0'),CW/2,170,'#ffffff',8,'center');
  const L=LEVELS[this.sel];
  this.txt('< CAVE '+(this.sel+1)+': '+L.name+' >',CW/2,210,'#8ff7ff',8,'center');
  this.txt(this.unlockedCount()+' OF '+LEVELS.length+' CAVES UNLOCKED',CW/2,228,'#4c566e',8,'center');
  if(blink) this.txt('PRESS ENTER TO DIG',CW/2,262,'#ffffff',8,'center');
  this.txt('COLLECT GEMS TO OPEN THE EXIT',CW/2,296,'#7f8aa3',8,'center');
  this.txt('DODGE FALLING ROCKS AND FIREFLIES',CW/2,312,'#7f8aa3',8,'center');
  this.txt('ARROWS/WASD MOVE   P PAUSE   R RESTART   M SOUND '+(AU.soundOn?'ON':'OFF'),CW/2,344,'#4c566e',8,'center');
 }
}
customElements.define('boulder-game',BoulderGame);
})();
