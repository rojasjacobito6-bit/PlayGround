import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const WEAPONS = [
  ['JAVELIN ATGM','TOP-ATTACK GUIDED MISSILE','HEAVY ORDNANCE',8,1.9],['HELLFIRE II','LASER-GUIDED ANTI-ARMOR','HEAVY ORDNANCE',12,1.7],['TOW-2B','TANDEM WARHEAD MISSILE','HEAVY ORDNANCE',10,1.8],['SPIKE LR2','FIRE-AND-FORGET MISSILE','HEAVY ORDNANCE',8,1.7],['BRIMSTONE','PRECISION STRIKE MISSILE','HEAVY ORDNANCE',10,1.8],['AGM-114K','MULTI-PURPOSE MISSILE','HEAVY ORDNANCE',12,1.7],['MAVERICK AGM-65','AIR-TO-GROUND MISSILE','HEAVY ORDNANCE',6,2],['TITAN-9','BUNKER BUSTER','HEAVY ORDNANCE',5,2.1],['MAMBA-4','THERMOBARIC MISSILE','HEAVY ORDNANCE',7,1.8],['PHOENIX-X','LONG-RANGE CRUISE MISSILE','HEAVY ORDNANCE',4,2.2],['M230 CHAINGUN','30MM HIGH-VELOCITY','AUTOCANNON',240,.14],['GAU-19 BROWNING','.50 CALIBER ROTARY','AUTOCANNON',500,.10],['MK44 BUSHMASTER','30MM AUTO CANNON','AUTOCANNON',180,.18],['M242 25MM','DUAL-FEED CANNON','AUTOCANNON',240,.16],['KORD 12.7','HEAVY MACHINE GUN','AUTOCANNON',400,.13],['M61 VULCAN','20MM ROTARY CANNON','AUTOCANNON',500,.08],['GSh-30-2','30MM RAPID CANNON','AUTOCANNON',200,.15],['M2A1 BROWNING','HEAVY MACHINE GUN','AUTOCANNON',300,.15],['MK19 GRENADE LAUNCHER','40MM AIRBURST','SUPPORT',120,.32],['MORTAR-81','HIGH-ANGLE HE','SUPPORT',32,.9],['SMOKE SCREEN','OBSCURANT CANISTER','SUPPORT',10,1.1],['EMP PULSE','ELECTROMAGNETIC BURST','SUPPORT',8,1.4],['MINE DISPENSER','REMOTE ANTI-VEHICLE','SUPPORT',20,.45],['FLARE POD','COUNTERMEASURE BURST','SUPPORT',16,.35],['HYDRA-70','UNGUIDED ROCKET POD','ROCKETS',38,.24],['S-8KOM','HEAVY ROCKET POD','ROCKETS',24,.3],['APKWS II','LASER-GUIDED ROCKET','ROCKETS',32,.22],['ZUNI-5','5-INCH ROCKET POD','ROCKETS',20,.36],['FROST-11','THERMAL ROCKET','ROCKETS',22,.28],['STORMBREAKER','SMART GLIDE BOMB','PRECISION',6,1.8]
];
const VEHICLES = [
  {name:'M1A2 ABRAMS',class:'MAIN BATTLE TANK',type:'ARMORED',icon:'▰',speed:14,armor:100},
  {name:'STRYKER M1126',class:'ARMORED PERSONNEL CARRIER',type:'ARMORED',icon:'▰',speed:21,armor:82},
  {name:'LAV-25 PREDATOR',class:'INFANTRY FIGHTING VEHICLE',type:'ARMORED',icon:'▰',speed:24,armor:74},
  {name:'HIMARS M142',class:'ROCKET ARTILLERY',type:'ARMORED',icon:'▰',speed:16,armor:78},
  {name:'AH-64 APACHE',class:'ATTACK HELICOPTER',type:'AIR',icon:'✣',speed:34,armor:62},
  {name:'UH-60 BLACK HAWK',class:'UTILITY HELICOPTER',type:'AIR',icon:'✣',speed:38,armor:68},
  {name:'F-16 FIGHTING FALCON',class:'MULTIROLE FIGHTER',type:'AIR',icon:'✦',speed:55,armor:56},
  {name:'A-10 THUNDERBOLT',class:'CLOSE AIR SUPPORT',type:'AIR',icon:'✦',speed:42,armor:88},
  {name:'JLTV LIGHTNING',class:'LIGHT TACTICAL VEHICLE',type:'LIGHT',icon:'▰',speed:32,armor:52},
  {name:'M978 FUELER',class:'SUPPORT TRUCK',type:'SUPPORT',icon:'▰',speed:18,armor:48},
  {name:'M109 PALADIN',class:'SELF-PROPELLED HOWITZER',type:'ARTILLERY',icon:'▰',speed:13,armor:80},
  {name:'M88 HERCULES',class:'ARMORED RECOVERY',type:'SUPPORT',icon:'▰',speed:12,armor:90}
];
const SKINS = [
  ['Olive Drab','#647449'],['Desert Sand','#bea36c'],['Arctic Ghost','#d4d8ca'],['Urban Slate','#737a76'],['Forest Hex','#384d3d'],['Digital Camo','#84905c'],['Midnight Ops','#303a35'],['Dune Tiger','#a87845'],['Coastal Blue','#526c72'],['Signal Red','#924a3d']
];

const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
$('game-root').appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9ab5ad); scene.fog = new THREE.FogExp2(0x9ab5ad, .00165);
const camera = new THREE.PerspectiveCamera(61, window.innerWidth/window.innerHeight, .1, 1200);
scene.add(new THREE.HemisphereLight(0xdce9d9, 0x38452e, 2.0));
const sun = new THREE.DirectionalLight(0xffe6bc, 3.2); sun.position.set(-100,180,90); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-170;sun.shadow.camera.right=170;sun.shadow.camera.top=170;sun.shadow.camera.bottom=-170;scene.add(sun);
const fill = new THREE.DirectionalLight(0x8db7d0,.7);fill.position.set(100,50,-100);scene.add(fill);
const mats = {
  ground:new THREE.MeshStandardMaterial({color:0x78835b,roughness:1}), road:new THREE.MeshStandardMaterial({color:0x373a35,roughness:.96}), roadEdge:new THREE.MeshStandardMaterial({color:0x777967,roughness:1}),
  concrete:new THREE.MeshStandardMaterial({color:0x8b9086,roughness:.9}), window:new THREE.MeshStandardMaterial({color:0x263e42,metalness:.2,roughness:.3}), trim:new THREE.MeshStandardMaterial({color:0xc2b99f,roughness:.7}),
  dark:new THREE.MeshStandardMaterial({color:0x26302b,roughness:.85}), tire:new THREE.MeshStandardMaterial({color:0x171c19,roughness:.95}),
  water:new THREE.MeshStandardMaterial({color:0x497e83,roughness:.28,metalness:.08}),
};
function box(parent, size, pos, mat, opts={}) { const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);mesh.position.set(...pos);mesh.castShadow=opts.cast!==false;mesh.receiveShadow=true;parent.add(mesh);return mesh; }
function makeGround(){
  const geo=new THREE.PlaneGeometry(900,900,80,80);geo.rotateX(-Math.PI/2);
  const p=geo.attributes.position; for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,Math.sin(x*.018)*.65+Math.cos(z*.021)*.58+Math.sin((x+z)*.008)*1.25);}geo.computeVertexNormals();
  const ground=new THREE.Mesh(geo,mats.ground);ground.receiveShadow=true;scene.add(ground);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(1200,1200),mats.water);water.rotation.x=-Math.PI/2;water.position.y=-3.2;scene.add(water);
  // Coastline inlets and a central road spine, all kept wide for mobile driving.
  for(let z=-330;z<=330;z+=180){box(scene,[760,.16,13],[0,.03,z],mats.road,{cast:false});box(scene,[760,.17,1],[0,.04,z-8],mats.roadEdge,{cast:false});box(scene,[760,.17,1],[0,.04,z+8],mats.roadEdge,{cast:false});}
  for(let x=-270;x<=270;x+=180){box(scene,[11,.17,760],[x,.03,0],mats.road,{cast:false});box(scene,[1,.18,760],[x-7,.04,0],mats.roadEdge,{cast:false});box(scene,[1,.18,760],[x+7,.04,0],mats.roadEdge,{cast:false});}
  // road center markings
  for(let z=-330;z<=330;z+=18)box(scene,[.4,.025,7],[0,.13,z],mats.trim,{cast:false});
}
makeGround();
const world = {buildings:[], debris:[], projectiles:[], effects:[], targets:[], trees:[], pickups:[]};
const buildingMaterials=[0x9b9b86,0x927c67,0x777a72,0xb7aa8b,0x7d8b84].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.92}));
const targetSpots=[[-105,-102],[72,-155],[162,-73],[-175,20],[82,32],[172,136],[-64,158],[10,230],[235,-230],[-260,-138],[260,35],[-233,235],[107,278],[-10,-270]];
function makeBuilding(x,z,index){
  const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
  const w=rand(12,21),d=rand(12,20),floors=2+Math.floor(Math.random()*3),fh=3.1;
  const mat=buildingMaterials[index%buildingMaterials.length],parts=[];
  const addPart=(size,pos,material,floor,meta={})=>{const m=box(group,size,pos,material);m.userData={building:null,floor,part:true};parts.push(m);return m;};
  // Base and slab floors are separate structural pieces, so impacts can peel away upper levels.
  addPart([w+.5,.7,d+.5],[0,.35,0],mats.dark,-1);
  for(let f=0;f<floors;f++){
    const y=.7+f*fh;
    addPart([w,.28,d],[0,y,0],f===floors-1?mats.trim:mat,f);
    const wallH=fh-.3;
    for(const side of [-1,1]){
      const wall1=addPart([w*.42,wallH,.45],[0,y+wallH/2,side*d/2],mat,f);
      const wall2=addPart([w*.42,wallH,.45],[0,y+wallH/2,side*d/2],mat,f);
      wall1.position.x=-w*.29; wall2.position.x=w*.29;
      addPart([.42,wallH,d],[side*w/2,y+wallH/2,0],mat,f);
      // Broad dark windows on the facade.
      for(let n=-1;n<=1;n++){const pane=box(group,[w*.17,1.25,.1],[n*w*.28,y+1.55,side*(d/2+.24)],mats.window,{cast:false});pane.userData={building:null,floor:f,part:true};parts.push(pane);}
    }
  }
  const roofY=.7+floors*fh;
  addPart([w+1,.55,d+1],[0,roofY,0],mat,floors);
  // rooftop parapet
  for(const s of [-1,1]){addPart([w+1,.65,.45],[0,roofY+.52,s*d/2],mats.trim,floors);addPart([.45,.65,d],[s*w/2,roofY+.52,0],mats.trim,floors);}
  // water tank and antenna silhouette
  if(index%3===0){const tank=box(group,[2.8,2.2,2.8],[w*.2,roofY+1.5,-d*.13],mats.dark,floors);tank.userData={building:null,floor:floors,part:true};parts.push(tank);}
  const b={group,parts,x,z,w,d,h:roofY+1.2,floors,hp:3,maxHp:3,index,dead:false,target:index<8,hitFlash:0};
  for(const p of parts)p.userData.building=b;
  world.buildings.push(b);if(b.target)world.targets.push(b);
  return b;
}
targetSpots.forEach(([x,z],i)=>makeBuilding(x,z,i));
// Vegetation as low-cost instanced-looking clustered silhouettes.
const treeMat=new THREE.MeshStandardMaterial({color:0x3b533c,roughness:1}), trunkMat=new THREE.MeshStandardMaterial({color:0x56493a,roughness:1});
for(let i=0;i<220;i++){
  let x=rand(-380,380),z=rand(-380,380);if(Math.abs(x%180)<28||Math.abs(z%180)<27)continue;
  let near=false;for(const b of world.buildings)if(Math.abs(x-b.x)<b.w/2+13&&Math.abs(z-b.z)<b.d/2+13){near=true;break;}if(near)continue;
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);const h=rand(3,6);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,h*.4,5),trunkMat);trunk.position.y=h*.2;g.add(trunk);
  const crown=new THREE.Mesh(new THREE.ConeGeometry(rand(1.2,2),h*.75,6),treeMat);crown.position.y=h*.64;crown.castShadow=true;g.add(crown);world.trees.push(g);
}

const player={pos:new THREE.Vector3(0,0,45),velocity:0,heading:Math.PI,aim:Math.PI,health:100,maxHealth:100,vehicle:0,skin:0,weapon:0,ammo:WEAPONS[0][3],cooldown:0,score:0,moveX:0,moveY:0,active:false};
let vehicleRoot=null,vehiclePaint=null,vehicleTurret=null,vehicleBarrel=null,aimYaw=0,aimPitch=0,toastTimer=0,hitTimer=0,paused=false,gameStarted=false,radarTick=0;
function makeVehicle(index,skinIndex,preview=false){
  const data=VEHICLES[index],color=new THREE.Color(SKINS[skinIndex].slice(1));
  const paint=new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.18});
  const root=new THREE.Group();
  const body=new THREE.Group();root.add(body);
  box(body,[3.2,.9,5.2],[0,1.05,0],paint);
  box(body,[2.45,.8,2.25],[0,1.84,.22],paint);
  box(body,[1.9,.2,1.6],[0,2.35,.2],mats.dark);
  // six road wheels and continuous track guards
  for(const side of [-1,1]){
    box(body,[.32,.68,4.7],[side*1.72,.62,0],mats.tire);
    for(let i=0;i<5;i++){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.25,12),new THREE.MeshStandardMaterial({color:0x343b35,roughness:.95}));wheel.rotation.z=Math.PI/2;wheel.position.set(side*1.9,.54,-1.75+i*.86);body.add(wheel);}
    box(body,[.12,.1,4.7],[side*1.91,.54,0],paint);
  }
  const turret=new THREE.Group();turret.position.set(0,2.42,.3);body.add(turret);
  const tmesh=new THREE.Mesh(new THREE.CylinderGeometry(1.02,1.15,.42,10),paint);tmesh.position.y=.2;tmesh.castShadow=true;turret.add(tmesh);
  box(turret,[1.35,.68,1.35],[0,.68,-.08],paint);
  const barrel=box(turret,[.23,.25,2.6],[0,.65,1.77],mats.dark);barrel.rotation.x=-.02;
  // commander's cupola and sensor
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(.28,.35,.28,10),mats.dark);cup.position.set(.35,1.14,-.2);turret.add(cup);
  // vehicle variants receive distinct silhouette details
  if(index===1||index===2||index===8||index===9){
    body.remove(tmesh);body.remove(barrel);body.remove(turret);turret.clear();turret.position.set(0,2.1,0);body.add(turret);
    box(turret,[1.7,.58,2],[0,.2,0],paint);box(turret,[.16,.16,2.5],[0,.42,1.1],mats.dark);
    for(const side of [-1,1]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.3,12),mats.tire);wheel.rotation.z=Math.PI/2;wheel.position.set(side*1.8,.65,-1.55);body.add(wheel);}
  }else if(index===3||index===10){
    box(body,[2.1,1.4,1.7],[0,2.05,-.8],paint);for(let n=0;n<6;n++)box(body,[.3,.3,3.8],[-.75+n*.3,2.95,-.8],mats.dark);
  }else if(data.type==='AIR'){
    // Helicopter/aircraft silhouette, a visual proxy that still uses the common driving controls.
    box(body,[1.45,.82,3.7],[0,1.65,-.2],paint);box(body,[.18,.18,12],[0,1.88,-.1],paint);box(body,[.42,.15,9],[0,2.1,-.15],mats.dark);
    const tail=box(body,[.32,.35,4],[0,1.95,-3.3],paint);tail.rotation.x=-.22;
    if(index>=6){box(body,[9,.18,1.3],[0,1.58,-.2],paint);box(body,[.7,.38,2.7],[0,1.65,2.1],mats.dark);}
    else{box(body,[.16,.12,7],[0,2.37,-.1],mats.dark);}
  }
  // Headlamps and rear lights add scale in the chase view.
  for(const side of [-1,1]){const lamp=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),new THREE.MeshStandardMaterial({color:0xffe6a3,emissive:0xffba59,emissiveIntensity:.55}));lamp.position.set(side*1.15,1.12,2.63);body.add(lamp);}
  root.userData={body,turret,barrel,paint};root.position.set(player.pos.x,0,player.pos.z);root.rotation.y=player.heading;
  if(!preview){scene.add(root);vehicleRoot=root;vehiclePaint=paint;vehicleTurret=turret;vehicleBarrel=barrel;}
  return root;
}
function setVehicle(index,skin=player.skin){
  const old=player.vehicle;player.vehicle=index;player.skin=skin;player.maxHealth=VEHICLES[index].armor;player.health=Math.min(player.health,player.maxHealth);if(old!==index)player.health=player.maxHealth;
  if(vehicleRoot){scene.remove(vehicleRoot);vehicleRoot.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
  const root=makeVehicle(index,skin);root.position.set(player.pos.x,player.pos.y,player.pos.z);
  updateHud();buildGarage();
}
function updateHud(){const v=VEHICLES[player.vehicle],w=WEAPONS[player.weapon];$('vehicle-type').textContent=v.name;$('vehicle-name').textContent=v.class;$('vehicle-skin').textContent=SKINS[player.skin][0].toUpperCase()+' · MK IV';$('vehicle-icon').textContent=v.icon;$('health-value').textContent=Math.round(player.health/player.maxHealth*100)+'%';$('health-fill').style.width=(player.health/player.maxHealth*100)+'%';$('health-fill').style.background=player.health/player.maxHealth<.3?'#ff744d':'#d8f36a';$('weapon-slot').textContent=String(player.weapon+1).padStart(2,'0')+' / 30';$('weapon-class').textContent=w[2];$('weapon-name').textContent=w[0];$('weapon-desc').textContent=w[1];$('ammo-count').textContent=player.ammo===Infinity?'∞':String(player.ammo).padStart(2,'0');$('garage-weapon').textContent=w[0];}
function changeWeapon(step){player.weapon=(player.weapon+step+WEAPONS.length)%WEAPONS.length;player.ammo=WEAPONS[player.weapon][3];updateHud();toast('WEAPON SELECTED // '+WEAPONS[player.weapon][0]);}
function changeVehicle(step=1){setVehicle((player.vehicle+step+VEHICLES.length)%VEHICLES.length,player.skin);toast('VEHICLE READY // '+VEHICLES[player.vehicle].name);}
function toast(text){const el=$('toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1700);}

function createDebris(part,building,scale=1){
  const mesh=new THREE.Mesh(part.geometry.clone(),part.material.clone());mesh.position.copy(part.getWorldPosition(new THREE.Vector3()));mesh.quaternion.copy(part.getWorldQuaternion(new THREE.Quaternion()));mesh.scale.copy(part.getWorldScale(new THREE.Vector3()));mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
  const dir=new THREE.Vector3(mesh.position.x-building.x,rand(.3,1.5),mesh.position.z-building.z).normalize();mesh.userData={vel:dir.multiplyScalar(rand(5,13)*scale).add(new THREE.Vector3(rand(-3,3),rand(2,7),rand(-3,3))),spin:new THREE.Vector3(rand(-3,3),rand(-3,3),rand(-3,3)),life:rand(6,10),grounded:false};world.debris.push(mesh);
}
function damageBuilding(b,amount=1){
  if(!b||b.dead)return;
  b.hp-=amount;b.hitFlash=.28;
  const remaining=Math.max(0,b.hp);
  // Each heavy impact fractures a storey and ejects its structural modules.
  const collapseFloor=b.hp<=0?-1:(remaining===2?b.floors-1:remaining===1?Math.max(0,b.floors-2):b.floors);
  for(const p of b.parts){if(p.visible&&p.userData.floor>=collapseFloor){p.visible=false;createDebris(p,b,b.hp<=0?1.15:.8);}}
  if(b.hp<=0){b.dead=true;b.group.visible=false;player.score+=300;const done=world.targets.filter(t=>t.dead).length;$('objective-count').textContent=done+' / 8';$('objective-fill').style.width=(done/8*100)+'%';showHit();toast('STRUCTURE NEUTRALIZED // +300 XP');}
  else{showHit();toast('STRUCTURE DAMAGED // '+remaining+' IMPACT'+(remaining===1?'':'S')+' TO COLLAPSE');}
}
function showHit(){const el=$('hit-marker');el.classList.remove('show');void el.offsetWidth;el.classList.add('show');}
function explosion(pos,power=1){
  const glow=new THREE.Mesh(new THREE.SphereGeometry(.55,12,10),new THREE.MeshBasicMaterial({color:0xffb76b,transparent:true,opacity:.85}));glow.position.copy(pos);scene.add(glow);world.effects.push({mesh:glow,life:.55,max:.55,kind:'flash'});
  const smoke=new THREE.Mesh(new THREE.SphereGeometry(.75,8,7),new THREE.MeshStandardMaterial({color:0x5b5147,transparent:true,opacity:.66,roughness:1}));smoke.position.copy(pos);scene.add(smoke);world.effects.push({mesh:smoke,life:2.4,max:2.4,kind:'smoke'});
  for(let i=0;i<8;i++){const spark=new THREE.Mesh(new THREE.SphereGeometry(rand(.07,.17),6,5),new THREE.MeshBasicMaterial({color:i%2?0xffd57b:0xff7548}));spark.position.copy(pos);scene.add(spark);const v=new THREE.Vector3(rand(-1,1),rand(.2,1.5),rand(-1,1)).normalize().multiplyScalar(rand(4,13)*power);world.effects.push({mesh:spark,life:rand(.35,.8),max:.8,kind:'spark',vel:v});}
  // Blast impulse breaks nearby windows and throws nearby light debris outward.
  for(const b of world.buildings){if(b.dead)continue;const dist=Math.hypot(b.x-pos.x,b.z-pos.z);if(dist<4.2&&b.hp>0)damageBuilding(b,1);}
}
function fire(){
  if(!player.active||paused||player.cooldown>0)return;
  if(player.ammo<=0){toast('AMMUNITION DEPLETED // SWITCH WEAPON');return;}
  const weapon=WEAPONS[player.weapon],missile=weapon[2]==='HEAVY ORDNANCE'||weapon[2]==='PRECISION'||weapon[2]==='ROCKETS';
  player.cooldown=weapon[4];if(player.ammo!==Infinity)player.ammo--;updateHud();
  const origin=new THREE.Vector3(player.pos.x,player.pos.y+(VEHICLES[player.vehicle].type==='AIR'?2.4:2.4),player.pos.z);
  const dir=new THREE.Vector3(Math.sin(aimYaw),Math.sin(aimPitch),Math.cos(aimYaw)).normalize();
  const proj=new THREE.Mesh(new THREE.CylinderGeometry(missile?.12:.07,missile?.18:.09,missile?1.15:.45,8),new THREE.MeshStandardMaterial({color:missile?0xd4ded1:0xffd27a,emissive:missile?0x687d63:0xff9a32,emissiveIntensity:.7,roughness:.4}));proj.position.copy(origin).addScaledVector(dir,2.6);proj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);scene.add(proj);
  const speed=missile?62:105;world.projectiles.push({mesh:proj,vel:dir.multiplyScalar(speed),life:missile?5.5:2.3,missile,damage:missile?1:0,weapon:weapon[0]});
}

const keys={};
window.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Space')fire();if(e.code==='KeyQ')changeWeapon(-1);if(e.code==='KeyE')changeWeapon(1);if(e.code==='KeyV')changeVehicle(1);if(e.code==='Escape'&&gameStarted)togglePause();if(e.code==='KeyM')toggleMap();});
window.addEventListener('keyup',e=>keys[e.code]=false);
renderer.domElement.addEventListener('click',()=>{if(gameStarted&&!paused&&document.pointerLockElement!==renderer.domElement&&window.innerWidth>850)renderer.domElement.requestPointerLock?.();});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===renderer.domElement){aimYaw-=e.movementX*.0022;aimPitch=clamp(aimPitch-e.movementY*.0017,-.58,.58);}});
let touchLook=null;renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.clientX>window.innerWidth*.36){touchLook={x:e.clientX,y:e.clientY,id:e.pointerId};renderer.domElement.setPointerCapture(e.pointerId);}});
renderer.domElement.addEventListener('pointermove',e=>{if(touchLook&&e.pointerId===touchLook.id){aimYaw-= (e.clientX-touchLook.x)*.006;aimPitch=clamp(aimPitch-(e.clientY-touchLook.y)*.004,-.58,.58);touchLook={x:e.clientX,y:e.clientY,id:e.pointerId};}});
renderer.domElement.addEventListener('pointerup',e=>{if(touchLook&&e.pointerId===touchLook.id)touchLook=null;});
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0&&gameStarted&&!paused)fire();});
$('fire-btn').addEventListener('click',fire);$('touch-fire').addEventListener('pointerdown',e=>{e.preventDefault();fire();});$('weapon-next').addEventListener('click',()=>changeWeapon(1));$('touch-next').addEventListener('click',()=>changeWeapon(1));$('switch-vehicle').addEventListener('click',()=>changeVehicle(1));$('touch-switch').addEventListener('click',()=>changeVehicle(1));
const stickZone=$('stick-zone'),stickKnob=$('stick-knob');let stickPointer=null;
stickZone.addEventListener('pointerdown',e=>{e.preventDefault();stickPointer=e.pointerId;stickZone.setPointerCapture(e.pointerId);moveStick(e);});
stickZone.addEventListener('pointermove',e=>{if(stickPointer===e.pointerId)moveStick(e);});
function moveStick(e){const r=stickZone.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,max=40,len=Math.hypot(dx,dy),k=len>max?max/len:1;player.moveX=clamp(dx*k/max,-1,1);player.moveY=clamp(dy*k/max,-1,1);stickKnob.style.transform=`translate(${dx*k}px,${dy*k}px)`;}
function releaseStick(e){if(stickPointer===e.pointerId){stickPointer=null;player.moveX=player.moveY=0;stickKnob.style.transform='translate(0,0)';}}
stickZone.addEventListener('pointerup',releaseStick);stickZone.addEventListener('pointercancel',releaseStick);
$('deploy-btn').addEventListener('click',()=>{gameStarted=true;player.active=true;$('start-screen').classList.add('hidden');toast('MISSION LIVE // BREAK THE STRONGHOLD');});
$('pause-btn').addEventListener('click',togglePause);$('resume-btn').addEventListener('click',togglePause);
function togglePause(){if(!gameStarted)return;paused=!paused;$('pause-screen').classList.toggle('hidden',!paused);if(paused&&document.pointerLockElement)document.exitPointerLock();}
$('garage-btn').addEventListener('click',()=>{$('pause-screen').classList.add('hidden');$('garage-screen').classList.remove('hidden');buildGarage();});$('garage-close').addEventListener('click',()=>{$('garage-screen').classList.add('hidden');if(paused)$('pause-screen').classList.remove('hidden');});$('garage-deploy').addEventListener('click',()=>{$('garage-screen').classList.add('hidden');paused=false;player.active=true;});$('garage-weapon-change').addEventListener('click',()=>changeWeapon(1));
$('map-toggle').addEventListener('click',toggleMap);$('map-close').addEventListener('click',toggleMap);function toggleMap(){const el=$('map-overlay');el.classList.toggle('open');drawBigMap();}
function buildGarage(){
  const tabs=$('vehicle-tabs');tabs.innerHTML='';const categories=['ALL','ARMORED','AIR','LIGHT','SUPPORT','ARTILLERY'];
  for(const [i,label] of categories.entries()){const btn=document.createElement('button');btn.className='garage-tab'+(i===0?' active':'');btn.textContent=label;btn.onclick=()=>{tabs.querySelectorAll('.garage-tab').forEach(t=>t.classList.remove('active'));btn.classList.add('active');renderVehicleOptions(label);};tabs.appendChild(btn);}
  renderVehicleOptions('ALL');renderSkins();$('preview-vehicle').textContent=VEHICLES[player.vehicle].icon;$('preview-vehicle').style.color=SKINS[player.skin][1];$('preview-tag').textContent='CLASS '+String(player.vehicle+1).padStart(2,'0')+' // '+VEHICLES[player.vehicle].type;
}
function renderVehicleOptions(category){const list=$('vehicle-select');list.innerHTML='';VEHICLES.forEach((v,i)=>{if(category!=='ALL'&&category!==v.type)return;const b=document.createElement('button');b.className='vehicle-option'+(player.vehicle===i?' active':'');b.innerHTML=`${v.name}<small>${String(i+1).padStart(2,'0')}</small>`;b.onclick=()=>{setVehicle(i,player.skin);renderVehicleOptions(category);};list.appendChild(b);});}
function renderSkins(){const grid=$('skin-grid');grid.innerHTML='';SKINS.forEach(([name,color],i)=>{const b=document.createElement('button');b.className='skin-swatch'+(i===player.skin?' active':'');b.title=name;b.style.background=`linear-gradient(135deg,${color},#222b25)`;b.onclick=()=>{player.skin=i;setVehicle(player.vehicle,i);renderSkins();};grid.appendChild(b);});}

function terrainY(x,z){return Math.sin(x*.018)*.65+Math.cos(z*.021)*.58+Math.sin((x+z)*.008)*1.25;}
function updatePlayer(dt){
  if(!player.active||paused)return;
  const v=VEHICLES[player.vehicle],forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-player.moveY;
  const strafe=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+player.moveX;
  const throttle=clamp(forward,-1,1),turn=clamp(strafe,-1,1),air=v.type==='AIR';
  player.heading=lerpAngle(player.heading,aimYaw,Math.min(1,dt*(air?1.5:2.4)));
  player.velocity=lerp(player.velocity,throttle*v.speed,Math.min(1,dt*1.35));
  const sideSpeed=turn*v.speed*.48;
  player.pos.x+=(Math.sin(player.heading)*player.velocity+Math.cos(player.heading)*sideSpeed)*dt;
  player.pos.z+=(Math.cos(player.heading)*player.velocity-Math.sin(player.heading)*sideSpeed)*dt;
  player.pos.x=clamp(player.pos.x,-425,425);player.pos.z=clamp(player.pos.z,-425,425);
  const targetY=air?8+Math.sin(performance.now()*.0012)*.7:Math.max(0,terrainY(player.pos.x,player.pos.z));player.pos.y=lerp(player.pos.y,targetY,Math.min(1,dt*2.2));
  vehicleRoot.position.copy(player.pos);vehicleRoot.rotation.y=player.heading;
  if(vehicleTurret)vehicleTurret.rotation.y=aimYaw-player.heading;
  if(vehicleBarrel)vehicleBarrel.rotation.x=-aimPitch;
  player.cooldown=Math.max(0,player.cooldown-dt);
  // Camera tracks behind the vehicle while remaining aligned with the aiming reticle.
  const aimDir=new THREE.Vector3(Math.sin(aimYaw),Math.sin(aimPitch),Math.cos(aimYaw));
  const behind=new THREE.Vector3(-Math.sin(aimYaw),0,-Math.cos(aimYaw));
  const desired=player.pos.clone().add(new THREE.Vector3(0,air?5:5.7,0)).addScaledVector(behind,air?15:11.5);
  camera.position.lerp(desired,Math.min(1,dt*4.5));camera.lookAt(player.pos.clone().add(new THREE.Vector3(0,2.1,0)).addScaledVector(aimDir,32));
  // Recover at friendly supply point and penalize rough collisions only cosmetically.
  if(Math.hypot(player.pos.x,player.pos.z)<13&&player.health<player.maxHealth)player.health=Math.min(player.maxHealth,player.health+dt*4);
  updateHud();
}
function lerpAngle(a,b,t){let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d*t;}

const raycaster=new THREE.Raycaster();
function updateProjectiles(dt){
  for(let i=world.projectiles.length-1;i>=0;i--){const p=world.projectiles[i],old=p.mesh.position.clone();p.mesh.position.addScaledVector(p.vel,dt);p.life-=dt;p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),p.vel.clone().normalize());
    const delta=p.mesh.position.clone().sub(old),length=delta.length();raycaster.set(old,delta.normalize());raycaster.far=length+1;
    const candidates=[];for(const b of world.buildings)if(!b.dead)candidates.push(...b.parts.filter(m=>m.visible));
    const hit=raycaster.intersectObjects(candidates,false)[0];
    if(hit||p.mesh.position.y<=terrainY(p.mesh.position.x,p.mesh.position.z)+.6||p.life<=0){
      const pos=hit?hit.point:p.mesh.position.clone();scene.remove(p.mesh);
      if(hit){const b=hit.object.userData.building;if(p.missile)damageBuilding(b,1);else{showHit();b.hitFlash=.1;}explosion(pos,p.missile?1:.5);}
      else if(p.missile)explosion(pos,.8);
      world.projectiles.splice(i,1);
    }
  }
}
function updateDebris(dt){for(let i=world.debris.length-1;i>=0;i--){const d=world.debris[i];d.userData.life-=dt;if(!d.userData.grounded){d.userData.vel.y-=15*dt;d.position.addScaledVector(d.userData.vel,dt);d.rotation.x+=d.userData.spin.x*dt;d.rotation.y+=d.userData.spin.y*dt;d.rotation.z+=d.userData.spin.z*dt;if(d.position.y<.08){d.position.y=.08;d.userData.grounded=true;d.userData.vel.multiplyScalar(.18);}}if(d.userData.life<0){scene.remove(d);d.geometry.dispose();if(d.material.dispose)d.material.dispose();world.debris.splice(i,1);}}}
function updateEffects(dt){for(let i=world.effects.length-1;i>=0;i--){const e=world.effects[i];e.life-=dt;const t=1-Math.max(0,e.life)/e.max;if(e.kind==='flash'){e.mesh.scale.setScalar(1+t*10);e.mesh.material.opacity=Math.max(0,e.life/e.max);}else if(e.kind==='smoke'){e.mesh.position.y+=dt*1.6;e.mesh.scale.setScalar(1+t*2.5);e.mesh.material.opacity=Math.max(0,.66*(e.life/e.max));}else{e.mesh.position.addScaledVector(e.vel,dt);e.mesh.scale.multiplyScalar(.97);}if(e.life<=0){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();world.effects.splice(i,1);}}}

function drawRadar(){const c=$('radar'),ctx=c.getContext('2d'),w=c.width,h=c.height,cx=w/2,cy=h/2,r=w*.43;ctx.clearRect(0,0,w,h);ctx.save();ctx.translate(cx,cy);ctx.strokeStyle='rgba(190,213,181,.25)';ctx.lineWidth=1;for(let i=1;i<=3;i++){ctx.beginPath();ctx.arc(0,0,r*i/3,0,Math.PI*2);ctx.stroke();}ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.moveTo(0,-r);ctx.lineTo(0,r);ctx.stroke();ctx.fillStyle='#d8f36a';ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(-5,5);ctx.lineTo(5,5);ctx.fill();const range=210;for(const b of world.targets){if(b.dead)continue;const dx=(b.x-player.pos.x)/range*r,dz=(b.z-player.pos.z)/range*r;if(Math.hypot(dx,dz)>r)continue;ctx.fillStyle='#ff744d';ctx.fillRect(dx-2,dz-2,4,4);}ctx.restore();}
function drawBigMap(){const c=$('big-map'),ctx=c.getContext('2d'),w=c.width,h=c.height;ctx.fillStyle='#243628';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#535b4c';ctx.lineWidth=14;for(let z=-330;z<=330;z+=180){const y=(z+450)/900*h;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}for(let x=-270;x<=270;x+=180){const xx=(x+450)/900*w;ctx.beginPath();ctx.moveTo(xx,0);ctx.lineTo(xx,h);ctx.stroke();}ctx.fillStyle='#687253';for(let i=0;i<350;i++){const x=Math.random()*w,y=Math.random()*h;ctx.fillRect(x,y,2,2);}for(const b of world.buildings){if(b.dead)continue;const x=(b.x+450)/900*w,y=(b.z+450)/900*h;ctx.fillStyle=b.target?'#ff744d':'#b5b69a';ctx.fillRect(x-4,y-4,8,8);}for(const b of world.pickups||[]){const x=(b.x+450)/900*w,y=(b.z+450)/900*h;ctx.fillStyle='#d8f36a';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();}const px=(player.pos.x+450)/900*w,py=(player.pos.z+450)/900*h;ctx.fillStyle='#d8f36a';ctx.beginPath();ctx.moveTo(px,py-9);ctx.lineTo(px-6,py+6);ctx.lineTo(px+6,py+6);ctx.fill();}

function loop(now){requestAnimationFrame(loop);const dt=Math.min(.04,(now-(loop.last||now))/1000);loop.last=now;updatePlayer(dt);updateProjectiles(dt);updateDebris(dt);updateEffects(dt);radarTick+=dt;if(radarTick>.13){drawRadar();radarTick=0;}renderer.render(scene,camera);}
window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));});
setVehicle(0,0);player.pos.set(0,0,45);player.heading=player.aim=Math.PI;aimYaw=Math.PI;camera.position.set(0,9,60);camera.lookAt(0,2,0);drawRadar();buildGarage();requestAnimationFrame(loop);
