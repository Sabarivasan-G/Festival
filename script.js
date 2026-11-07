/* ===== HELPERS ===== */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.random()*a.length|0];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const small=innerWidth<700;
const DIYA='<svg viewBox="0 0 100 80" aria-hidden="true"><path class="fl" d="M50 4C60 20 64 30 50 42C36 30 40 20 50 4Z"/><path class="bowl" d="M10 46h80c0 20-17 30-40 30S10 66 10 46Z"/><path class="rim" d="M18 47c12-6 52-6 64 0"/></svg>';
['ldDiya','heroDiya','gDiya'].forEach(i=>$('#'+i).innerHTML=DIYA);

/* ===== FIREWORKS ENGINE ===== */
const cv=$('#fx'),ctx=cv.getContext('2d');let W,H;
function resize(){const d=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0)}
addEventListener('resize',resize);resize();
const HUES=[18,38,50,330,350,280,190,120],MAX=reduce?250:(small?500:900);
const parts=[],rockets=[];let emitters=[];

class Particle{
  constructor(x,y,a,s,hue,o={}){this.x=x;this.y=y;this.vx=Math.cos(a)*s;this.vy=Math.sin(a)*s;this.hue=hue;this.alpha=1;
    this.decay=o.decay||rnd(.012,.026);this.g=o.g??.05;this.f=o.f??.97;this.size=o.size||1.8;this.tw=Math.random()<.3}
  update(){this.vx*=this.f;this.vy*=this.f;this.vy+=this.g;this.x+=this.vx;this.y+=this.vy;this.alpha-=this.decay}
  draw(){const a=this.tw&&Math.random()<.3?this.alpha*.3:this.alpha;
    ctx.fillStyle=`hsla(${this.hue},100%,${this.tw?85:62}%,${Math.max(a,0)})`;ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,6.283);ctx.fill()}
}
const add=p=>{if(parts.length<MAX)parts.push(p)};

function burst(x,y,n=90,hue,shape='sphere',k=1){
  const base=hue??pick(HUES),multi=hue===undefined&&Math.random()<.4;
  for(let i=0;i<n;i++){
    const h=multi?(base+rnd(0,70))%360:base+rnd(0,16),t=i/n*6.283;
    if(shape==='heart'){const p=new Particle(x,y,0,0,h);
      p.vx=16*Math.pow(Math.sin(t),3)*.26*k;p.vy=-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*.26*k;add(p)}
    else add(shape==='ring'?new Particle(x,y,t,4*k,h):new Particle(x,y,rnd(0,6.283),rnd(1,5.5)*k,h));
  }
}
class Rocket{
  constructor(x,ty){this.x=x;this.y=H;this.ty=ty??H*rnd(.15,.5);this.vy=-rnd(11,14);this.hue=pick(HUES);this.tr=[]}
  update(){this.tr.push([this.x,this.y]);if(this.tr.length>8)this.tr.shift();this.y+=this.vy;this.vy*=.985;
    add(new Particle(this.x,this.y,Math.PI/2+rnd(-.4,.4),1,40,{decay:.07,size:1.2}));
    if(this.y<=this.ty||this.vy>-2.5){this.dead=true;burst(this.x,this.y,small?70:105,undefined,Math.random()<.2?'ring':Math.random()<.15?'heart':'sphere');boom(1)}}
  draw(){ctx.strokeStyle=`hsl(${this.hue},100%,75%)`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(...(this.tr[0]||[this.x,this.y]));ctx.lineTo(this.x,this.y);ctx.stroke()}
}
function emit(e){
  e.t++;
  if(e.type==='fountain')for(let i=0;i<3;i++)add(new Particle(e.x,e.y,-Math.PI/2+rnd(-.25,.25),rnd(6,10),rnd(38,58),{g:.12,f:.99,decay:.015}));
  else{e.a+=.35;for(let i=0;i<3;i++){const a=e.a+i*2.094;add(new Particle(e.x+Math.cos(a)*6,e.y+Math.sin(a)*6,a+1.2,5,e.hue+rnd(0,20),{g:.02,f:.96,decay:.03}))}}
  return e.t<e.life;
}
const rocket=(x,y)=>rockets.push(new Rocket(x??rnd(W*.1,W*.9),y));
const anaar=()=>emitters.push({type:'fountain',x:rnd(W*.15,W*.85),y:H-8,t:0,life:200});
const chakra=()=>emitters.push({type:'chakra',x:rnd(W*.2,W*.8),y:H*rnd(.5,.75),t:0,life:180,a:0,hue:pick(HUES)});
function loop(){
  ctx.globalCompositeOperation='destination-out';ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='lighter';
  for(const r of rockets){r.update();r.draw()}
  for(let i=rockets.length;i--;)if(rockets[i].dead)rockets.splice(i,1);
  emitters=emitters.filter(emit);
  for(const p of parts){p.update();p.draw()}
  for(let i=parts.length;i--;)if(parts[i].alpha<=0)parts.splice(i,1);
  requestAnimationFrame(loop);
}
loop();

/* ===== SOUND ===== */
let sound=false,ac;
function boom(big){
  if(!sound)return;ac=ac||new(window.AudioContext||window.webkitAudioContext)();
  const len=ac.sampleRate*(big?.7:.3),b=ac.createBuffer(1,len,ac.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);
  const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();
  s.buffer=b;f.type='lowpass';f.frequency.value=big?500:1200;g.gain.value=big?.6:.25;s.connect(f).connect(g).connect(ac.destination);s.start();
}
$('#snd').addEventListener('click',e=>{sound=!sound;e.currentTarget.setAttribute('aria-pressed',sound);$('.l',e.currentTarget).textContent=sound?'🔊 ஒலி: இயக்கம்':'🔇 ஒலி: அணைப்பு';if(sound)boom()});

/* ===== BACKGROUND DECOR ===== */
for(let i=0;i<70;i++){const s=document.createElement('i');s.className='star';const z=rnd(1,2.6);
  s.style.cssText=`left:${rnd(0,100)}%;top:${rnd(0,100)}%;width:${z}px;height:${z}px;--d:${rnd(0,3)}s`;$('#stars').append(s)}
const tor=$('#toran'),bc=['#FF9F1C','#E91E8C','#FFD700','#D62839'];
for(let i=0;i<(small?10:20);i++){const s=document.createElement('i');s.className='str';
  s.style.cssText=`left:${(i+.5)*100/(small?10:20)}%;--h:${i%2?46:26}px;--bc:${bc[i%4]};--d:${rnd(0,2)}s`;tor.append(s)}
[$('#rg1'),$('#rg2')].forEach(svg=>{let h='<g fill="none" stroke="#FFC93C" stroke-width="1.4">';
  [50,80,110,140,170].forEach((r,i)=>h+=`<circle r="${r}" stroke-dasharray="${i%2?'2 9':'none'}" opacity="${1-i*.13}"/>`);
  for(let a=0;a<=90;a+=15){const x=Math.cos(a*Math.PI/180)*95,y=Math.sin(a*Math.PI/180)*95;h+=`<circle cx="${x}" cy="${y}" r="12" stroke="#E91E8C"/><circle cx="${x}" cy="${y}" r="4" fill="#FF9F1C" stroke="none"/>`}
  svg.innerHTML=h+'</g>'});
if(!reduce){
  const pc=['#FFD700','#FF9F1C','#E91E8C','#FFC93C'];
  for(let i=0;i<(small?3:6);i++){const l=document.createElement('i');l.className='lant';
    l.style.cssText=`left:${rnd(3,92)}%;--t:${rnd(22,36)}s;--dl:${-rnd(0,30)}s;--sx:${rnd(-60,60)}px`;document.body.append(l)}
  for(let i=0;i<(small?10:22);i++){const p=document.createElement('i');p.className='petal';
    p.style.cssText=`left:${rnd(0,100)}%;--pc:${pick(pc)};--t:${rnd(8,15)}s;--dl:${-rnd(0,14)}s;--sx:${rnd(-80,80)}px`;document.body.append(p)}
}

/* ===== BUTTON GESTURES ===== */
function fx(b){
  b.addEventListener('pointerdown',e=>{
    const r=b.getBoundingClientRect(),s=document.createElement('span');s.className='rip';
    s.style.left=e.clientX-r.left+'px';s.style.top=e.clientY-r.top+'px';b.append(s);setTimeout(()=>s.remove(),700);
    burst(e.clientX,e.clientY,18,undefined,'sphere',.5);boom();navigator.vibrate&&navigator.vibrate(15);
  });
  if(!b.classList.contains('btn'))return;
  b.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=b.getBoundingClientRect();
    b.style.setProperty('--ry',((e.clientX-r.left)/r.width-.5)*14+'deg');b.style.setProperty('--rx',-((e.clientY-r.top)/r.height-.5)*14+'deg');b.style.setProperty('--s',1.06)});
  b.addEventListener('pointerleave',()=>['--rx','--ry'].forEach(v=>b.style.setProperty(v,'0deg'))||b.style.setProperty('--s',1));
}
const btns=()=>$$('button');
addEventListener('pointermove',e=>{
  if(e.pointerType==='mouse')$$('.btn').forEach(b=>{const r=b.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
    const near=Math.hypot(dx,dy)<r.width/2+70;b.style.setProperty('--mx',near?dx*.2+'px':'0px');b.style.setProperty('--my',near?dy*.2+'px':'0px')});
  if(!reduce)for(let i=0;i<2;i++)add(new Particle(e.clientX,e.clientY,rnd(0,6.283),rnd(0,2),rnd(35,55),{g:.04,decay:.05,size:1.3}));
  if(!cur.hidden)cur.style.transform=`translate(${e.clientX}px,${e.clientY}px)`;
});
const cur=$('#cur');cur.hidden=!matchMedia('(pointer:fine)').matches||reduce;
document.addEventListener('pointerdown',e=>{
  if(e.target.closest('button,input,a,.wish,.greet'))return;rocket(e.clientX,e.clientY);boom()});
let sx,sy;addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
addEventListener('touchend',e=>{const t=e.changedTouches[0];if(sy-t.clientY>90&&Math.abs(t.clientX-sx)<60){rocket(sx);navigator.vibrate&&navigator.vibrate(30)}},{passive:true});

/* Celebrate */
const cb=$('#celebrate');let hold=0,raf;
function show(c){
  const n=3+Math.round(c*12);
  for(let i=0;i<n;i++)setTimeout(()=>rocket(),i*(c>.9?120:200));
  if(c>.9){chakra();anaar();anaar();navigator.vibrate&&navigator.vibrate([40,30,80])}boom(1);
}
cb.addEventListener('pointerdown',()=>{const t0=performance.now();cb.classList.add('charging');
  (function tick(){hold=Math.min((performance.now()-t0)/1500,1);cb.style.setProperty('--charge',hold*100+'%');raf=requestAnimationFrame(tick)})()});
const rel=()=>{if(!cb.classList.contains('charging'))return;cancelAnimationFrame(raf);cb.classList.remove('charging');show(hold);hold=0;cb.style.setProperty('--charge','0%')};
['pointerup','pointerleave','pointercancel'].forEach(ev=>cb.addEventListener(ev,rel));
cb.addEventListener('click',e=>{if(e.detail===0)show(.5)});
$('#bRocket').onclick=()=>rocket();$('#bAnaar').onclick=anaar;$('#bChakra').onclick=chakra;

/* ===== WISHES ===== */
const WISHES=['தீபங்களின் ஒளி உங்கள் வாழ்வில் இருளை நீக்கி, மகிழ்ச்சியை நிரப்பட்டும்.',
'இந்த தீபாவளி உங்கள் இல்லத்தில் அன்பு, அமைதி, செல்வம் கொண்டு வரட்டும்!',
'நல்லது வெல்லட்டும், தீமை அழியட்டும். இனிய தீபாவளி நல்வாழ்த்துக்கள்!',
'பட்டாசு ஒலியோடு உங்கள் கவலைகள் அனைத்தும் பறந்து போகட்டும்.',
'இனிப்பின் சுவையும் தீபத்தின் ஒளியும் உங்கள் வாழ்வை இனிமையாக்கட்டும்!',
'புத்தாடை, இனிப்பு, பட்டாசு, சிரிப்பு எல்லாம் நிறைந்த மகிழ்ச்சியான தீபாவளியாக அமையட்டும்!',
'ஒவ்வொரு தீபமும் உங்கள் கனவுகளுக்கு வழிகாட்டும் ஒளியாக இருக்கட்டும்.',
'குடும்பத்துடன் கூடி மகிழ்ந்து, அன்பைப் பகிர்ந்து கொண்டாடும் இனிய தீபாவளி வாழ்த்துக்கள்!'];
const TAGS=['ஒளி','அன்பு','வெற்றி','மகிழ்ச்சி','இனிமை','கொண்டாட்டம்','கனவு','குடும்பம்'];
const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2200)};
const base=()=>location.href.split('#')[0].split('?')[0];
WISHES.forEach((w,i)=>{const a=document.createElement('article');a.className='wish glass';a.lang='ta';
  a.innerHTML='<b></b><p></p><div class="act"><button class="mini" data-k="c">நகலெடு</button><button class="mini" data-k="w">வாட்ஸ்அப்</button></div>';
  $('b',a).textContent=TAGS[i];$('p',a).textContent=w;
  a.onclick=e=>{if(e.target.closest('button'))return;burst(e.clientX,e.clientY,55,undefined,'sphere',.8);boom();navigator.vibrate&&navigator.vibrate(12)};
  $('[data-k=c]',a).onclick=async()=>{try{await navigator.clipboard.writeText(w);toast('வாழ்த்து நகலெடுக்கப்பட்டது')}catch{prompt('நகலெடுக்கவும்:',w)}};
  $('[data-k=w]',a).onclick=()=>window.open('https://wa.me/?text='+encodeURIComponent(w+' 🪔 '+base()),'_blank','noopener');
  $('#wgrid').append(a)});

/* ===== CREATE YOUR WISH ===== */
const THEMES=[['சாமந்தி','#FF9F1C','#D62839'],['ரோஜா','#E91E8C','#5B1A8B'],['நீலம்','#3B2BCB','#E91E8C'],['செம்மை','#D62839','#7a0f2a'],['மயில்','#00A6A6','#3B2BCB']];
let ci=0,cn='';const greet=$('#greet'),nameIn=$('#name'),msg=t=>$('#msg').textContent=t;
THEMES.forEach(([n,a,b],i)=>{const s=document.createElement('button');s.className='sw';s.style.cssText=`--a:${a};--b:${b}`;
  s.setAttribute('aria-label',n+' நிறம்');s.onclick=()=>theme(i);$('#sws').append(s)});
function theme(i){ci=i;greet.style.setProperty('--c1',THEMES[i][1]);greet.style.setProperty('--c2',THEMES[i][2]);
  $$('.sw').forEach((s,j)=>s.setAttribute('aria-pressed',j===i))}
function gen(){const n=nameIn.value.trim();if(!n){msg('முதலில் ஒரு பெயரை எழுதுங்கள்.');nameIn.focus();return false}
  cn=n;$('#gName').textContent=n;msg('அட்டை தயார்! '+n+' அவர்களுக்குப் பகிருங்கள்.');
  const r=greet.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;burst(x,y,90,undefined,'heart',1.2);burst(x,y,60,undefined,'ring');boom(1);return true}
const link=()=>location.href.split('#')[0].split('?')[0]+'?name='+encodeURIComponent(cn)+'&c='+ci;
const text=()=>`${cn} அவர்களுக்கு இனிய தீபாவளி நல்வாழ்த்துக்கள்! ✨ உங்கள் வாழ்வு ஒளி, அன்பு, செல்வம் நிறைந்து மிளிரட்டும். 🪔 ${link()}`;
$('#gen').onclick=gen;nameIn.onkeydown=e=>{if(e.key==='Enter')gen()};
$('#wa').onclick=()=>{if(!cn&&!gen())return;window.open('https://wa.me/?text='+encodeURIComponent(text()),'_blank','noopener')};
$('#cp').onclick=async()=>{if(!cn&&!gen())return;try{await navigator.clipboard.writeText(link());msg('இணைப்பு நகலெடுக்கப்பட்டது.')}catch{prompt('இணைப்பை நகலெடுக்கவும்:',link())}};
theme(0);

/* ----- PHOTO UPLOAD ----- */
let photo=null,phImg=null,ph={z:1,x:0,y:0};
const gp=$('#gPhoto'),gc=$('#gCanvas'),ed=$('#ed'),ec=$('#eCanvas');
function phDraw(){if(!phImg)return;const w=phImg.width,h=phImg.height,m=Math.min(w,h)/ph.z;
  ph.x=m>=w?w/2:Math.min(Math.max(ph.x,m/2),w-m/2);ph.y=m>=h?h/2:Math.min(Math.max(ph.y,m/2),h-m/2);
  const sc=600/m,ox=-(ph.x-m/2)*sc,oy=-(ph.y-m/2)*sc;
  [gc,ec].forEach(k=>{const q=k.getContext('2d');q.fillStyle='#2a0d4a';q.fillRect(0,0,600,600);q.drawImage(phImg,0,0,w,h,ox,oy,w*sc,h*sc)})}
function phSet(z){ph.z=Math.min(3,Math.max(.5,z));$('#zoom').value=ph.z;phDraw()}
function phReset(){ph={z:1,x:phImg.width/2,y:phImg.height/2};$('#zoom').value=1;phDraw()}
async function loadImg(f){
  try{return await createImageBitmap(f,{imageOrientation:'from-image'})}catch{}
  try{return await createImageBitmap(f)}catch{}
  return new Promise((res,rej)=>{const u=URL.createObjectURL(f),im=new Image();
    im.onload=()=>{URL.revokeObjectURL(u);res(im)};im.onerror=()=>{URL.revokeObjectURL(u);rej()};im.src=u})}
function shrink(src){const w=src.naturalWidth||src.width||800,h=src.naturalHeight||src.height||800,k=Math.min(1,1600/Math.max(w,h));
  const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*k));c.height=Math.max(1,Math.round(h*k));
  const q=c.getContext('2d');q.imageSmoothingQuality='high';q.drawImage(src,0,0,c.width,c.height);if(src.close)src.close();return c}
$('#photo').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  if(f.size>60*1024*1024){toast('படம் மிகப் பெரியது (60MB க்குள் இருக்க வேண்டும்)');return}
  toast('படம் தயாராகிறது…');
  try{phImg=shrink(await loadImg(f))}catch{toast('இந்தப் படத்தைத் திறக்க முடியவில்லை. JPG அல்லது PNG படத்தைத் தேர்ந்தெடுங்கள் (HEIC என்றால் மாற்றிக் கொள்ளுங்கள்).');return}
  phReset();photo=gc;gp.hidden=false;gp.classList.add('has');ed.classList.add('has');$('#tools').hidden=false;
  toast('புகைப்படம் சேர்க்கப்பட்டது. இழுத்து அளவை மாற்றலாம்.');
  const r=greet.getBoundingClientRect();burst(r.left+r.width/2,r.top+90,70,undefined,'ring');boom()};
$('#zoom').oninput=e=>phSet(+e.target.value);
$('#zm').onclick=()=>phSet(ph.z-.2);$('#zp').onclick=()=>phSet(ph.z+.2);$('#rst').onclick=()=>phImg&&phReset();
$('#rot').onclick=()=>{if(!phImg)return;const w=phImg.width,h=phImg.height,c=document.createElement('canvas');c.width=h;c.height=w;
  const q=c.getContext('2d');q.translate(h/2,w/2);q.rotate(Math.PI/2);q.drawImage(phImg,-w/2,-h/2);phImg=c;phReset()};
function dragOn(el){let d=null;
  el.addEventListener('pointerdown',e=>{if(!phImg)return;d={x:e.clientX,y:e.clientY};el.setPointerCapture(e.pointerId)});
  el.addEventListener('pointermove',e=>{if(!d)return;const k=Math.min(phImg.width,phImg.height)/ph.z/el.clientWidth;
    ph.x-=(e.clientX-d.x)*k;ph.y-=(e.clientY-d.y)*k;d={x:e.clientX,y:e.clientY};phDraw()});
  ['pointerup','pointercancel'].forEach(t=>el.addEventListener(t,()=>d=null))}
dragOn(ed);dragOn(gp);
ed.addEventListener('wheel',e=>{if(!phImg)return;e.preventDefault();phSet(ph.z-e.deltaY*.002)},{passive:false});
$('#rmPhoto').onclick=()=>{photo=phImg=null;gp.hidden=true;gp.classList.remove('has');ed.classList.remove('has');$('#tools').hidden=true;$('#photo').value='';
  ec.getContext('2d').clearRect(0,0,600,600);toast('புகைப்படம் நீக்கப்பட்டது')};

/* ----- RENDER CARD TO PNG ----- */
async function cardBlob(){
  try{await Promise.all([document.fonts.load('900 100px "Noto Serif Tamil"'),document.fonts.load('700 60px "Noto Serif Tamil"'),document.fonts.load('600 40px "Hind Madurai"')])}catch{}
  const CW=1080,CH=1350,c=document.createElement('canvas');c.width=CW;c.height=CH;const x=c.getContext('2d'),T=THEMES[ci];
  let g=x.createLinearGradient(0,0,CW,CH);g.addColorStop(0,T[1]);g.addColorStop(1,T[2]);x.fillStyle=g;x.fillRect(0,0,CW,CH);
  g=x.createRadialGradient(CW/2,0,0,CW/2,0,950);g.addColorStop(0,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,CW,CH);
  for(let i=0;i<90;i++){x.fillStyle=`rgba(255,240,170,${rnd(.2,.8)})`;x.beginPath();x.arc(rnd(0,CW),rnd(0,CH),rnd(1,3.5),0,6.283);x.fill()}
  x.strokeStyle='#FFD700';x.lineWidth=6;x.strokeRect(40,40,CW-80,CH-80);x.lineWidth=2;x.strokeRect(62,62,CW-124,CH-124);
  x.textAlign='center';x.shadowColor='rgba(0,0,0,.45)';x.shadowBlur=14;x.shadowOffsetY=3;x.fillStyle='#fff';
  x.font='70px serif';x.fillText('🪔',CW/2,180);
  let y=photo?320:470;x.fillStyle='#FFF6C2';x.font='900 112px "Noto Serif Tamil",serif';x.fillText('இனிய தீபாவளி',CW/2,y);
  if(photo){const R=190,cy=y+70+R;x.save();x.shadowColor='rgba(255,215,0,.85)';x.shadowBlur=36;x.beginPath();x.arc(CW/2,cy,R+10,0,6.283);x.fillStyle='#FFD700';x.fill();x.restore();
    x.save();x.beginPath();x.arc(CW/2,cy,R,0,6.283);x.clip();x.drawImage(photo,CW/2-R,cy-R,2*R,2*R);x.restore();y=cy+R+130}else y+=140;
  x.fillStyle='#fff';let fs=104;do{x.font=`700 ${fs}px "Noto Serif Tamil",serif`;fs-=4}while(x.measureText(cn).width>860&&fs>40);
  x.fillText(cn,CW/2,y);y+=105;
  x.font='600 56px "Hind Madurai",sans-serif';x.fillStyle='#FFE9B0';x.fillText('தீபாவளி நல்வாழ்த்துக்கள்!',CW/2,y);y+=95;
  x.font='500 44px "Hind Madurai",sans-serif';x.fillStyle='#fff';
  let line='';for(const w of 'உங்கள் இல்லம் ஒளியும் அன்பும் செல்வமும் நிறைந்து விளங்கட்டும்.'.split(' ')){
    if(x.measureText(line+' '+w).width>820&&line){x.fillText(line,CW/2,y);y+=74;line=w}else line=line?line+' '+w:w}
  x.fillText(line,CW/2,y);x.font='56px serif';x.fillText('🪔  ✨  🪔',CW/2,CH-110);
  return new Promise(r=>c.toBlob(r,'image/png'));
}
const need=()=>cn||gen();
async function saveCard(){const b=await cardBlob(),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='deepavali-wish.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
$('#dl').onclick=async()=>{if(!need())return;await saveCard();toast('அட்டை படமாகப் பதிவிறக்கப்பட்டது')};
$('#shareImg').onclick=async()=>{if(!need())return;const b=await cardBlob(),f=new File([b],'deepavali-wish.png',{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],text:text()})}catch{}}
  else{await saveCard();toast('இந்தச் சாதனத்தில் நேரடிப் பகிர்வு இல்லை. படம் பதிவிறக்கப்பட்டது; வாட்ஸ்அப்பில் இணைக்கலாம்.')}};
['#wa','#cp'].forEach(i=>$(i).addEventListener('click',()=>{if(photo)toast('புகைப்படம் இணைப்பில் சேராது. "படத்துடன் பகிர்" பயன்படுத்துங்கள்.')}));

/* ===== DIYA LIGHTING ===== */
let lit=0;const dr=$('#diyas');
for(let i=0;i<7;i++){const b=document.createElement('button');b.className='diya-btn diya';b.innerHTML=DIYA;b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','விளக்கு '+(i+1));
  b.addEventListener('click',()=>{const on=b.classList.toggle('lit');b.setAttribute('aria-pressed',on);lit+=on?1:-1;
    $('#dmsg').textContent=lit===7?'ஏழு விளக்குகளும் ஒளிர்கின்றன. இனிய தீபாவளி! 🪔':'7 இல் '+lit+' ஏற்றப்பட்டது';
    if(lit===7){show(1);setTimeout(()=>burst(W/2,H/2,140,undefined,'heart',1.6),600)}});
  dr.append(b)}

/* ===== REVEAL, TYPING, START ===== */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15});
$$('.rv').forEach(el=>io.observe(el));
const LINES=['தீப ஒளி உங்கள் வாழ்வை பிரகாசமாக்கட்டும்','இனிய தீபாவளி நல்வாழ்த்துக்கள்!','அன்பும் மகிழ்ச்சியும் பெருகட்டும்','ஒளி, அன்பு, செல்வம் நிறைந்த தீபாவளி'],tp=$('#typed');
const seg=s=>window.Intl&&Intl.Segmenter?[...new Intl.Segmenter('ta',{granularity:'grapheme'}).segment(s)].map(x=>x.segment):[...s];
function type(){
  if(reduce){tp.textContent=LINES[0];return}
  let li=0,ch=0,del=false;
  (function step(){const g=seg(LINES[li]);ch+=del?-1:1;tp.textContent=g.slice(0,ch).join('');let d=del?30:85;
    if(!del&&ch>=g.length){del=true;d=2000}else if(del&&ch<=0){del=false;li=(li+1)%LINES.length;d=400}setTimeout(step,d)})();
}
function start(){
  $('#loader').classList.add('off');setTimeout(()=>$('#loader').remove(),900);
  if(!reduce)[0,300,600].forEach((d,i)=>setTimeout(()=>rocket(W*(.25+i*.25)),d));
  type();
  const q=new URLSearchParams(location.search),n=q.get('name');
  if(n){nameIn.value=n.slice(0,30);theme(Math.min(+q.get('c')||0,THEMES.length-1));setTimeout(()=>{gen();$('#create').scrollIntoView({behavior:'smooth'})},900)}
}
const secs=['home','wishes','create','diyas-sec'].map(id=>document.getElementById(id));
const nio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)$$('.nav a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id))}),{rootMargin:'-45% 0px -50% 0px'});
secs.forEach(x=>nio.observe(x));
btns().forEach(fx);
setTimeout(()=>$('#loader').classList.add('lit'),500);
setTimeout(start,reduce?300:2400);
setInterval(()=>{if(!document.hidden&&!reduce&&rockets.length<3)rocket()},2200);