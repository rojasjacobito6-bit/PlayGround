(() => {
'use strict';
const canvas=document.getElementById('scene'),ctx=canvas.getContext('2d');
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const screens={title:$('#titleScreen'),armory:$('#armoryScreen'),pause:$('#pauseScreen'),end:$('#endScreen')};
const skins=[{name:'ESPECTRO',color:'#55604b',accent:'#bbc88a'},{name:'DESIERTO',color:'#a7855e',accent:'#e3c18b'},{name:'NOCHE',color:'#30383b',accent:'#80a9aa'},{name:'ÓXIDO',color:'#71493c',accent:'#dc9b70'},{name:'INVIERNO',color:'#8b9290',accent:'#e2e8de'}];
let skinIndex=0,mode='menu',last=0,elapsed=0,keys={},mouseLocked=false,aiming=false,sprinting=false,reloading=false,inspecting=false,inspectAt=0,shots=0,hits=0,kills=0,ammo=30,reserve=120,health=100,shake=0,recoil=0,toastTimer=0,damageTimer=0,walkBob=0,headBob=0,hitTimer=0,grenades=2;
const player={x:3.5,y:14.5,angle:-Math.PI/2,pitch:0,speed:0};
const map=[
'####################',
'#........#.........#',
'#........#.........#',
'#..##....#....##...#',
'#..##.........##...#',
'#..............#...#',
'###.####.####..#...#',
'#...#..#....#..#...#',
'#...#..#....#......#',
'#......#....####.###',
'#.##...#...........#',
'#.##.......##......#',
'#...........#......#',
'#....###....#...##.#',
'#....#......#...##.#',
'#....#.............#',
'#........#....#....#',
'#........#....#....#',
'#..................#',
'####################'];
const enemies=[];
const spawnEnemies=()=>{enemies.length=0;[[8.5,3.8],[13.4,5.3],[5.3,8.4],[15.2,11.3],[7.3,16.3],[16.4,14.4]].forEach((p,i)=>enemies.push({x:p[0],y:p[1],alive:true,hp:100,alert:false,fireAt:2+i*.9,phase:Math.random()*6,hit:0,walk:0}));};
spawnEnemies();
function resize(){const d=Math.min(devicePixelRatio||1,1.6);canvas.width=Math.floor(innerWidth*d);canvas.height=Math.floor(innerHeight*d);ctx.setTransform(d,0,0,d,0,0)}addEventListener('resize',resize);resize();
const W=()=>innerWidth,H=()=>innerHeight;
function wall(x,y){const ix=Math.floor(x),iy=Math.floor(y);return !map[iy]||map[iy][ix]==='#'}
function norm(a){while(a>Math.PI)a-=Math.PI*2;while(a< -Math.PI)a+=Math.PI*2;return a}
function showToast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');toastTimer=1.6}
function setMode(m){mode=m;Object.values(screens).forEach(s=>s.classList.add('hidden'));$('#hud').classList.toggle('hidden',m!=='playing');if(m==='menu')screens.title.classList.remove('hidden');if(m==='armory')screens.armory.classList.remove('hidden');if(m==='pause')screens.pause.classList.remove('hidden');if(m==='end')screens.end.classList.remove('hidden');$('#mobileControls').classList.toggle('hidden',m!=='playing');$('#startHint').classList.toggle('hidden',m!=='playing'||mouseLocked);}
function renderBackdrop(t){const w=W(),h=H(),g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#46504b');g.addColorStop(.38,'#858878');g.addColorStop(.53,'#4e5146');g.addColorStop(1,'#181d19');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);let horizon=h*.48;
ctx.fillStyle='#353b35';for(let i=0;i<20;i++){let x=i*w/16-(t*4%90),bw=35+(i*29%64),bh=70+(i*53%200);ctx.fillRect(x,horizon-bh,bw,bh);ctx.fillStyle='#454a40';ctx.fillRect(x+5,horizon-bh+10,5,bh-12);ctx.fillStyle='#333932'}
ctx.fillStyle='#252a25';ctx.beginPath();ctx.moveTo(w*.37,horizon);ctx.lineTo(w*.44,horizon-20);ctx.lineTo(w*.54,horizon-20);ctx.lineTo(w*.65,horizon);ctx.fill();ctx.fillStyle='#515448';ctx.fillRect(0,horizon,w,h-horizon);
for(let i=0;i<80;i++){let x=(i*173+t*11)%w,y=horizon+((i*97)%Math.max(1,h-horizon));ctx.fillStyle=i%4?'#b9a87530':'#d6a86a60';ctx.fillRect(x,y,2+(i%3),1+(i%2))}
const haze=ctx.createRadialGradient(w*.69,horizon,0,w*.69,horizon,w*.32);haze.addColorStop(0,'#d58b4938');haze.addColorStop(1,'transparent');ctx.fillStyle=haze;ctx.fillRect(0,0,w,h);
}
function textureWall(x,y,side,dist,wallX,rayX,rayY){const h=H(),w=W(),lineH=Math.min(h*2,h/dist),drawY=h*.5-lineH*.5+player.pitch*h*.65;const cellX=Math.floor(wallX*8),tile=cellX%8;let shade=side?.67:1;shade*=Math.max(.35,1-dist/14);const stone=(Math.sin(Math.floor(wallX*12)*13+Math.floor(wallX*5)*7)*.045);let base=wallX<4?'#66665a':wallX<9?'#5c6257':'#636457';if(Math.floor(wallX*3)%3===0)base='#535a51';ctx.fillStyle=base;ctx.fillRect(x,drawY,2,lineH);ctx.fillStyle=`rgba(11,15,13,${1-shade+stone})`;ctx.fillRect(x,drawY,2,lineH);let row=(wallX*7)%1;
if(tile<1||tile>6){ctx.fillStyle='rgba(16,19,16,.55)';ctx.fillRect(x,drawY,2,lineH)}
// masonry seams and fractured plaster
const band=Math.floor((wallX*15)%15);if(band<1.2){ctx.fillStyle=`rgba(16,20,16,${.35+(1-shade)*.35})`;ctx.fillRect(x,drawY+lineH*.49,2,Math.max(1,lineH*.012))}
// dim industrial window bays
const wx=Math.floor(wallX*1.1), wy=Math.floor((drawY+lineH*.18)/Math.max(1,lineH*.3));if((wx*7+Math.floor(dist)*3)%9===2&&lineH>55){ctx.fillStyle='#1c2724';ctx.fillRect(x,drawY+lineH*.22,2,lineH*.18);if((wx+wy)%4===0){ctx.fillStyle='#d5a25a55';ctx.fillRect(x,drawY+lineH*.24,1,lineH*.08)}}
// near-edge warm practical light
if(Math.floor(wallX*2)%7===0&&lineH>110){ctx.fillStyle='#cf9d5a';ctx.globalAlpha=.7;ctx.fillRect(x,drawY+lineH*.68,2,Math.max(2,lineH*.018));ctx.globalAlpha=1}
}
function castWorld(){const w=W(),h=H(),horizon=h*.49+player.pitch*h*.65;let sky=ctx.createLinearGradient(0,0,0,horizon+10);sky.addColorStop(0,'#34413e');sky.addColorStop(.62,'#76796d');sky.addColorStop(1,'#bd9b6b');ctx.fillStyle=sky;ctx.fillRect(0,0,w,horizon+2);
// distant skyline silhouette
ctx.fillStyle='#343a35';for(let i=0;i<16;i++){const bx=i*w/14-(w*.04),bh=25+(i*47%85);ctx.fillRect(bx,horizon-bh,bx%3+34,bh)}
const sun=ctx.createRadialGradient(w*.74,horizon-24,1,w*.74,horizon-24,100);sun.addColorStop(0,'#f3c88555');sun.addColorStop(1,'transparent');ctx.fillStyle=sun;ctx.fillRect(w*.55,horizon-130,w*.4,160);
let floor=ctx.createLinearGradient(0,horizon,0,h);floor.addColorStop(0,'#5a594b');floor.addColorStop(.17,'#343a31');floor.addColorStop(1,'#171c19');ctx.fillStyle=floor;ctx.fillRect(0,horizon,w,h-horizon);
// perspective road seams and scattered reflections
for(let i=0;i<14;i++){let f=(i+1)/14,y=horizon+(h-horizon)*f*f;ctx.strokeStyle=`rgba(194,177,128,${.03+f*.08})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
for(let i=-9;i<=9;i++){ctx.strokeStyle='rgba(180,172,140,.035)';ctx.beginPath();ctx.moveTo(w/2+i*2,horizon);ctx.lineTo(w/2+i*w*.14,h);ctx.stroke()}
// dust in volumetric light
for(let i=0;i<32;i++){let x=(i*137+elapsed*4)%w,y=horizon+((i*97)%Math.max(1,h-horizon));ctx.fillStyle=`rgba(228,211,162,${.05+(i%4)*.025})`;ctx.fillRect(x,y,1,1)}
const dirX=Math.cos(player.angle),dirY=Math.sin(player.angle),planeX=-dirY*.66,planeY=dirX*.66;const step=Math.max(1,Math.floor(w/500)),zbuf=new Float32Array(Math.ceil(w/step)+1);
for(let sx=0,idx=0;sx<w;sx+=step,idx++){const cameraX=2*sx/w-1,rayX=dirX+planeX*cameraX,rayY=dirY+planeY*cameraX;let mx=Math.floor(player.x),my=Math.floor(player.y),ddx=Math.abs(1/(rayX||.00001)),ddy=Math.abs(1/(rayY||.00001)),stepX=rayX<0?-1:1,stepY=rayY<0?-1:1,sdx=(rayX<0?player.x-mx:mx+1-player.x)*ddx,sdy=(rayY<0?player.y-my:my+1-player.y)*ddy,side=0,guard=0;while(guard++<50){if(sdx<sdy){sdx+=ddx;mx+=stepX;side=0}else{sdy+=ddy;my+=stepY;side=1}if(map[my]?.[mx]==='#')break}let dist=side?sdy-ddy:sdx-ddx;dist=Math.max(.15,dist);zbuf[idx]=dist;const wallX=side?player.x+dist*rayX:player.y+dist*rayY;textureWall(sx,0,side,dist,wallX,rayX,rayY);if(step>1&&sx+step>w)ctx.fillRect(sx,0,w-sx,h);}
return {zbuf,step,horizon};}
function polygon(points,fill,stroke='#171b18',lw=1){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.stroke()}}
function drawEnemy(e,world){if(!e.alive)return;const w=W(),h=H(),dx=e.x-player.x,dy=e.y-player.y,dist=Math.hypot(dx,dy),angle=norm(Math.atan2(dy,dx)-player.angle);if(Math.abs(angle)>1.03||dist<.25)return;const sx=w/2+Math.tan(angle)*w*.67,scale=h/(dist*2.7),baseY=h*.51+player.pitch*h*.65+scale*.38;const zIndex=Math.max(0,Math.min(world.zbuf.length-1,Math.floor(sx/world.step)));if(dist>world.zbuf[zIndex]+.28)return;const sw=scale*.5,sh=scale*1.95;if(sx+sw<0||sx-sw>w)return;const crouch=e.alert?0:Math.sin(elapsed*1.8+e.phase)*.015,walk=e.alert?Math.sin(elapsed*7+e.phase)*.035:0;ctx.save();ctx.translate(sx,baseY);ctx.scale(sw,sh);ctx.globalAlpha=Math.max(.56,1-dist/19);
// grounded shadow
ctx.fillStyle='#11140f88';ctx.beginPath();ctx.ellipse(0,-.015,.42,.075,0,0,Math.PI*2);ctx.fill();
const uniform=e.hit>0?'#97635a':'#393f35',vest=e.hit>0?'#c17e69':'#252a25',skin='#a88c72';
// legs and boots
polygon([[-.27,-.48],[-.04,-.48],[-.08,-.08],[-.35,-.025]],uniform);polygon([[.04,-.48],[.26,-.48],[.36,-.03],[.1,-.04]],uniform);polygon([[-.4,-.08],[-.08,-.09],[-.11,.005],[-.43,.015]],'#1b201d');polygon([[.1,-.09],[.38,-.07],[.48,.01],[.12,.01]],'#1b201d');
// torso tactical plates
polygon([[-.34,-1.23],[-.27,-1.52],[.26,-1.52],[.37,-1.22],[.26,-.49],[-.3,-.48]],uniform);polygon([[-.31,-1.22],[-.23,-1.42],[.25,-1.42],[.32,-1.19],[.24,-.78],[-.29,-.77]],vest);ctx.fillStyle='#606654';ctx.fillRect(-.12,-1.34,.24,.055);ctx.fillStyle='#727662';for(let j=0;j<3;j++)ctx.fillRect(-.25+j*.16,-1.02,.09,.13);
// shoulders, arms
polygon([[-.35,-1.38],[-.53,-1.35],[-.59,-1.08],[-.34,-.94],[-.2,-1.12]],uniform);polygon([[.31,-1.39],[.5,-1.34],[.57,-1.11],[.31,-.98],[.2,-1.15]],uniform);polygon([[-.58,-1.12],[-.47,-1.16],[-.25,-.9],[-.35,-.82]],'#454b3f');polygon([[.55,-1.13],[.44,-1.16],[.24,-.94],[.34,-.86]],'#454b3f');
// head, helmet, goggles
ctx.fillStyle=skin;ctx.beginPath();ctx.ellipse(0,-1.59,.18,.21,0,0,Math.PI*2);ctx.fill();polygon([[-.22,-1.64],[-.17,-1.83],[.16,-1.85],[.24,-1.62],[.15,-1.55],[-.17,-1.56]],'#2a302b');ctx.fillStyle='#8c9a83';ctx.fillRect(-.145,-1.65,.105,.055);ctx.fillRect(.04,-1.65,.105,.055);ctx.fillStyle='#101713';ctx.fillRect(-.04,-1.64,.08,.035);
// rifle silhouette
polygon([[-.48,-1.04],[-.13,-1.08],[.02,-1.13],[.03,-1.19],[-.15,-1.18],[-.27,-1.12],[-.49,-1.12]],'#111612');ctx.fillStyle='#8d9774';ctx.fillRect(-.18,-1.115,.2,.018);ctx.restore();e.hit=Math.max(0,e.hit-.045);
}
function drawWeapon(){const w=W(),h=H(),scale=Math.min(w/900,h/600),ads=aiming?.74:1,sprint=sprinting?.76:1;let bob=Math.sin(walkBob)*7*Math.min(1,Math.abs(player.speed)*1.5),inspect=0;if(inspecting){let p=(elapsed-inspectAt)/1.45;inspect=Math.sin(Math.min(1,p)*Math.PI)}let kick=recoil*26;ctx.save();ctx.translate(w*.76+Math.sin(walkBob*.5)*7,h*.94+ bob+kick-headBob*10);ctx.scale(scale*ads*sprint,scale*ads*sprint);ctx.rotate((sprinting?.11:0)+Math.sin(walkBob*.5)*.012+inspect*.36);if(aiming)ctx.translate(-w*.2/scale,-h*.35/scale);ctx.translate(inspect*-80,inspect*-70);
const skin=skins[skinIndex],dark='#151a16',metal=skin.color,edge='#080b09',accent=skin.accent;
// weapon shadow and rear stock
ctx.fillStyle='#0009';ctx.beginPath();ctx.ellipse(10,-6,230,30,-.04,0,Math.PI*2);ctx.fill();polygon([[-245,-43],[-183,-57],[-129,-51],[-114,-20],[-153,8],[-210,3],[-252,-8]],'#242b25');polygon([[-260,-46],[-218,-53],[-202,-39],[-212,-1],[-254,-6]],'#43483d');ctx.fillStyle='#6b6d5e';ctx.fillRect(-242,-43,12,30);
// receiver body
polygon([[-168,-61],[49,-66],[91,-42],[105,-17],[70,5],[-88,1],[-138,-13]],metal,edge,3);polygon([[-160,-57],[39,-61],[79,-40],[79,-32],[-144,-30]],'#65705d',null);polygon([[-110,-31],[2,-31],[11,2],[-61,7],[-88,-2]],'#313930');
// top rail and optic
ctx.fillStyle='#111612';ctx.fillRect(-121,-79,190,17);for(let i=0;i<18;i++){ctx.fillStyle=i%2?'#555c4b':'#242a24';ctx.fillRect(-115+i*10,-82,4,8)}polygon([[-58,-87],[-48,-111],[5,-111],[17,-84]],'#252c26');ctx.strokeStyle='#858b75';ctx.lineWidth=2;ctx.strokeRect(-42,-107,36,19);ctx.fillStyle='#bdd2ae44';ctx.fillRect(-38,-103,28,10);
// barrel and flash hider
polygon([[61,-53],[238,-47],[255,-40],[252,-29],[73,-33]],'#292f29');ctx.fillStyle='#151a16';ctx.fillRect(231,-46,33,13);for(let i=0;i<3;i++){ctx.fillStyle='#596051';ctx.fillRect(236+i*7,-47,2,14)}
// handguard slots and screws
polygon([[58,-57],[177,-51],[181,-38],[62,-39]],'#394137');for(let i=0;i<7;i++){ctx.fillStyle=i%2?'#111612':'#707762';ctx.fillRect(72+i*14,-52,7,3)}for(let i=0;i<5;i++){ctx.fillStyle='#9a9a7b';ctx.beginPath();ctx.arc(-95+i*25,-48,2,0,Math.PI*2);ctx.fill()}
// angled grip
polygon([[-35,-26],[4,-23],[20,35],[-4,53],[-39,1]],'#262d27');for(let i=0;i<5;i++){ctx.strokeStyle='#4b5148';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-26+i*2,8+i*7);ctx.lineTo(-8+i*2,10+i*7);ctx.stroke()}
// trigger guard
ctx.strokeStyle='#0c100d';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-72,-24);ctx.lineTo(-53,23);ctx.lineTo(-19,22);ctx.lineTo(-6,-24);ctx.stroke();ctx.fillStyle='#171c18';ctx.fillRect(-48,-24,24,5);
// magazine
polygon([[-112,-6],[-49,-5],[-42,74],[-61,103],[-110,91]],'#202620');for(let i=0;i<5;i++){ctx.strokeStyle='#41483d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-102,15+i*11);ctx.lineTo(-55,18+i*11);ctx.stroke()}
// small markings / manufacturer icon
ctx.fillStyle=accent;ctx.globalAlpha=.75;ctx.fillRect(-125,-20,34,2);ctx.globalAlpha=1;ctx.font='bold 8px monospace';ctx.fillStyle='#aeb79c';ctx.fillText('05.56',-118,-8);
// glove hand on foregrip
polygon([[95,-10],[137,-14],[152,1],[142,23],[116,27],[92,13]],'#746b53');ctx.fillStyle='#a3997c';ctx.fillRect(116,2,23,4);ctx.restore();
if(shake>0){ctx.fillStyle=`rgba(255,199,112,${Math.random()*.7})`;ctx.beginPath();ctx.arc(w*.76+scale*255,h*.94+bob,scale*10,0,Math.PI*2);ctx.fill()}}
function drawScene(){const world=castWorld();enemies.filter(e=>e.alive).sort((a,b)=>Math.hypot(b.x-player.x,b.y-player.y)-Math.hypot(a.x-player.x,a.y-player.y)).forEach(e=>drawEnemy(e,world));drawWeapon();}
function beginGame(){player.x=3.5;player.y=14.5;player.angle=-Math.PI/2;player.pitch=0;player.speed=0;health=100;ammo=30;reserve=120;grenades=2;kills=shots=hits=0;reloading=inspecting=aiming=sprinting=false;spawnEnemies();$('#enemyCount').textContent=String(enemies.length).padStart(2,'0');$('#ammoNow').textContent=ammo;$('#ammoReserve').textContent=reserve;$('#healthText').textContent='100';$('#healthBar').style.width='100%';$('#objectiveText').textContent='ELIMINA A LOS HOSTILES';setMode('playing');}
function endGame(won){if(mode!=='playing')return;document.exitPointerLock?.();$('#endEyebrow').textContent=won?'MISIÓN CUMPLIDA':'OPERADOR CAÍDO';$('#endTitle').textContent=won?'SECTOR ASEGURADO':'MISIÓN FALLIDA';$('#endCopy').textContent=won?'El distrito está bajo control. Buen trabajo, operador.':'La señal se perdió en la zona de combate.';$('#killsFinal').textContent=String(kills).padStart(2,'0');$('#accuracyFinal').textContent=`${shots?Math.round(hits/shots*100):0}%`;setMode('end');}
function fire(){if(mode!=='playing'||reloading||ammo<=0)return;if(inspecting){inspecting=false}shots++;ammo--;recoil=Math.min(1,recoil+.75);shake=.09;$('#ammoNow').textContent=ammo;$('#crosshair').style.transform='translate(-50%,-50%) scale(1.65)';setTimeout(()=>$('#crosshair').style.transform='translate(-50%,-50%) scale(1)',85);let best=null,bestDist=Infinity;for(const e of enemies){if(!e.alive)continue;let dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy),a=Math.abs(norm(Math.atan2(dy,dx)-player.angle));let tolerance=(aiming?.105:.065)+.13/d;if(d<14&&a<tolerance&&d<bestDist){best=e;bestDist=d}}if(best){hits++;best.hit=.5;best.hp-=aiming?68:50;$('#hitmarker').classList.add('show');hitTimer=.16;best.alert=true;if(best.hp<=0){best.alive=false;kills++;$('#enemyCount').textContent=String(enemies.filter(e=>e.alive).length).padStart(2,'0');if(enemies.every(e=>!e.alive)){setTimeout(()=>endGame(true),700)}else if(kills===1)$('#objectiveText').textContent='LIMPIA LA ZONA DE HOSTILES';}}
if(ammo===0)showToast(reserve?'PULSA R PARA RECARGAR':'SIN MUNICIÓN');}
function reload(){if(mode!=='playing'||reloading||ammo===30||reserve<=0)return;reloading=true;showToast('RECARGANDO · CUBRE EL SECTOR');setTimeout(()=>{if(mode!=='playing')return;let n=Math.min(30-ammo,reserve);ammo+=n;reserve-=n;$('#ammoNow').textContent=ammo;$('#ammoReserve').textContent=reserve;reloading=false;},1350)}
function inspect(){if(mode!=='playing')return;inspecting=true;inspectAt=elapsed;showToast('INSPECCIÓN DE ARMA');setTimeout(()=>inspecting=false,1500)}
function grenade(){if(mode!=='playing'||grenades<=0)return;grenades--;$('.grenade b').textContent=grenades;showToast('GRANADA · ¡AL SUELO!');let targets=enemies.filter(e=>e.alive).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y)).slice(0,2);setTimeout(()=>{for(const e of targets){if(Math.hypot(e.x-player.x,e.y-player.y)<5){e.hp-=125;e.hit=.5;if(e.hp<=0)e.alive=false}}kills=enemies.filter(e=>!e.alive).length;$('#enemyCount').textContent=String(enemies.filter(e=>e.alive).length).padStart(2,'0');if(enemies.every(e=>!e.alive))endGame(true)},650)}
function setAim(v){aiming=v;$('#crosshair').style.opacity=v?'.48':'1'}
function togglePause(){if(mode==='playing'){setMode('pause');document.exitPointerLock?.()}else if(mode==='pause'){setMode('playing');canvas.requestPointerLock?.()}}
function onKeyDown(e){const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();keys[k]=true;if(k==='escape'){if(mode==='playing'||mode==='pause')togglePause();return}if(e.repeat)return;if(k==='r')reload();if(k==='f')inspect();if(k==='g')grenade();if(k==='shift')sprinting=true;if(k===' '&&mode==='playing')headBob=1;}
function onKeyUp(e){keys[e.key.toLowerCase()]=false;if(e.key.toLowerCase()==='shift')sprinting=false;if(e.key.toLowerCase()===' '){headBob=0}}
addEventListener('keydown',onKeyDown);addEventListener('keyup',onKeyUp);
canvas.addEventListener('mousedown',e=>{if(mode!=='playing')return;if(!mouseLocked){canvas.requestPointerLock?.();return}if(e.button===0)fire();if(e.button===2)setAim(true)});canvas.addEventListener('mouseup',e=>{if(e.button===2)setAim(false)});canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('pointerlockchange',()=>{mouseLocked=document.pointerLockElement===canvas;$('#startHint').classList.toggle('hidden',mode!=='playing'||mouseLocked)});document.addEventListener('mousemove',e=>{if(mode==='playing'&&mouseLocked){player.angle+=e.movementX*.0022;player.pitch=Math.max(-.35,Math.min(.35,player.pitch-e.movementY*.0017))}});
$('#deployBtn').onclick=beginGame;$('#armoryDeploy').onclick=beginGame;$('#armoryBtn').onclick=()=>setMode('armory');$('#backBtn').onclick=()=>setMode('menu');$('#resumeBtn').onclick=togglePause;$('#restartBtn').onclick=beginGame;$('#retryBtn').onclick=beginGame;
function selectSkin(i){skinIndex=i;$('#skinTitle').textContent=`M4 · ${skins[i].name}`;$('#weaponHudName').textContent=`M4 · ${skins[i].name}`;$$('.skin').forEach((el,j)=>el.classList.toggle('selected',i===j))}
skins.forEach((s,i)=>{const b=document.createElement('button');b.className='skin';b.style.setProperty('--skin',`linear-gradient(135deg,${s.color} 0 48%,${s.accent} 49% 53%,${s.color} 54%)`);b.title=s.name;b.onclick=()=>selectSkin(i);$('#skinList').append(b)});selectSkin(0);
$('#touchFire').addEventListener('pointerdown',e=>{e.preventDefault();fire()});$('#touchAim').addEventListener('pointerdown',e=>{e.preventDefault();setAim(true)});$('#touchAim').addEventListener('pointerup',()=>setAim(false));$('#touchReload').addEventListener('pointerdown',e=>{e.preventDefault();reload()});$('#touchInspect').addEventListener('pointerdown',e=>{e.preventDefault();inspect()});$$('.movePad button').forEach(b=>{const key=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();keys[key]=true;b.setPointerCapture(e.pointerId)});b.addEventListener('pointerup',()=>keys[key]=false);b.addEventListener('pointercancel',()=>keys[key]=false)});
function clearShot(x1,y1,x2,y2){const d=Math.hypot(x2-x1,y2-y1),steps=Math.ceil(d*12);for(let i=1;i<steps;i++){let t=i/steps;if(wall(x1+(x2-x1)*t,y1+(y2-y1)*t))return false}return true}
function update(dt){elapsed+=dt;if(mode!=='playing')return;const forward=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0),side=(keys.d?1:0)-(keys.a?1:0);let dx=(Math.cos(player.angle)*forward+Math.cos(player.angle+Math.PI/2)*side),dy=(Math.sin(player.angle)*forward+Math.sin(player.angle+Math.PI/2)*side),len=Math.hypot(dx,dy);if(len){dx/=len;dy/=len}let pace=sprinting?3.7:aiming?1.55:2.55;player.speed+=( (len?pace:0)-player.speed)*Math.min(1,dt*9);let nx=player.x+dx*pace*dt,ny=player.y+dy*pace*dt;if(!wall(nx+.2,player.y)&&!wall(nx-.2,player.y))player.x=nx;if(!wall(player.x,ny+.2)&&!wall(player.x,ny-.2))player.y=ny;walkBob+=dt*(len?(sprinting?15:9):1);recoil=Math.max(0,recoil-dt*3.4);shake=Math.max(0,shake-dt);if(headBob>0)headBob=Math.max(0,headBob-dt*1.6);if(hitTimer>0){hitTimer-=dt;if(hitTimer<=0)$('#hitmarker').classList.remove('show')}if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('#toast').classList.remove('show')}
let remaining=enemies.filter(e=>e.alive).length;for(const e of enemies){if(!e.alive)continue;e.phase+=dt;e.walk=0;const d=Math.hypot(player.x-e.x,player.y-e.y),visible=d<11&&clearShot(e.x,e.y,player.x,player.y);if(visible){e.alert=true;if(d>3.1){let vx=(player.x-e.x)/d,vy=(player.y-e.y)/d,move=dt*.42;e.walk=1;if(!wall(e.x+vx*move,e.y))e.x+=vx*move;if(!wall(e.x,e.y+vy*move))e.y+=vy*move}if(elapsed>e.fireAt&&d<9){e.fireAt=elapsed+1.6+Math.random()*1.7;if(Math.random()<Math.max(.22,.58-d*.035)){health=Math.max(0,health-(4+Math.floor(Math.random()*5)));$('#healthText').textContent=health;$('#healthBar').style.width=health+'%';$('#damageFlash').classList.add('active');setTimeout(()=>$('#damageFlash').classList.remove('active'),190);if(health<=0)endGame(false)}}}else if(d<6)e.alert=true}
const target=Math.max(0,enemies.filter(e=>e.alive).length);if(target!==remaining)$('#enemyCount').textContent=String(target).padStart(2,'0');if(aiming&&keys.arrowleft)player.angle-=dt*.8;if(aiming&&keys.arrowright)player.angle+=dt*.8;
}
function renderMenu(t){renderBackdrop(t);const w=W(),h=H(); // wreckage silhouettes and cinematic foreground
ctx.fillStyle='#111612';polygon([[0,h*.73],[w*.16,h*.69],[w*.27,h*.75],[w*.39,h*.68],[w*.48,h*.75],[w*.61,h*.70],[w*.71,h*.74],[w*.88,h*.68],[w,h*.72],[w,h],[0,h]],'#171b17',null);ctx.fillStyle='#262a23';ctx.fillRect(w*.62,h*.48,w*.22,h*.03);ctx.fillRect(w*.64,h*.51,w*.19,h*.13);ctx.fillStyle='#d5a35b';ctx.globalAlpha=.35+Math.sin(t*2)*.1;ctx.fillRect(w*.74,h*.54,3,14);ctx.globalAlpha=1;
// distant smoke plumes
for(let i=0;i<9;i++){let x=w*(.12+i*.1)+Math.sin(t*.3+i)*8;for(let j=0;j<4;j++){ctx.fillStyle=`rgba(27,32,28,${.06+j*.01})`;ctx.beginPath();ctx.ellipse(x+j*4,h*.38-j*21,13+j*7,16+j*9,-.15,0,Math.PI*2);ctx.fill()}}
// ember drift
for(let i=0;i<45;i++){let x=(i*173+t*(5+i%4)*3)%w,y=(i*91+t*(7+i%3)*2)%(h*.8);ctx.fillStyle=`rgba(239,172,90,${.12+(i%5)*.045})`;ctx.fillRect(x,y,1+(i%2),1+(i%2))}
// side vignette and film grade
let vg=ctx.createRadialGradient(w*.52,h*.46,h*.13,w*.52,h*.46,h*.8);vg.addColorStop(0,'transparent');vg.addColorStop(1,'#080b09c9');ctx.fillStyle=vg;ctx.fillRect(0,0,w,h);
}
function frame(now){const dt=Math.min(.05,(now-last)/1000||0);last=now;update(dt);ctx.clearRect(0,0,W(),H());if(mode==='playing')drawScene();else renderMenu(now/1000);requestAnimationFrame(frame)}requestAnimationFrame(frame);
$('#enemyCount').textContent=String(enemies.length).padStart(2,'0');
})();
