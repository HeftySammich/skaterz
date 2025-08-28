// Minimal "looks like a city street" renderer
// flat physics baseline (y=160) + slanted top edge for the street band

const GROUND_Y = 160;      // <-- your physics floor
const STREET_H = 64;       // height of the entire street band
const TILT_DEG  = -8;      // visual slope (negative = down to the right)
const SLOPE     = Math.tan(TILT_DEG * Math.PI / 180); // Δy per px of x

// GBA-ish palette
const PAL = {
  sky0:'#274b8c', sky1:'#1f3d6e', sky2:'#162b4d', star:'#ffecb3',
  bldg:'#0b1a2a', win:'#f1a340',
  asphalt:'#2d303b', curbTop:'#b9c0cf', curbFace:'#646c7a',
  lane:'#e2e28e', crack:'#1c1e25'
};

function drawSkyline(w:number,h:number){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const g=c.getContext('2d')!; g.imageSmoothingEnabled=false;
  // banded sky
  for(let y=0;y<h;y++){
    const t=y/h; g.fillStyle=t<.33?PAL.sky0:t<.66?PAL.sky1:PAL.sky2; g.fillRect(0,y,w,1);
  }
  // stars
  g.fillStyle=PAL.star; for(let i=0;i<120;i++){ const x=(Math.random()*w)|0, y=(Math.random()*h)|0; if(y>12) g.fillRect(x,y,1,1); }
  // simple building silhouettes
  let x=0; const R=(a:number,b:number)=>Math.floor(a+Math.random()*(b-a));
  while(x<w){
    const bw=R(48,96), bh=R(56,120), by=GROUND_Y-STREET_H-10-bh;
    g.fillStyle=PAL.bldg; g.fillRect(x,by,bw,bh);
    g.fillStyle=PAL.win;
    for(let yy=by+8; yy<by+bh-6; yy+=8) for(let xx=x+6; xx<x+bw-6; xx+=8)
      if(Math.random()<0.20) g.fillRect(xx,yy,2,3);
    x+=bw+R(8,20);
  }
  return c;
}

function drawStreet(w:number,h:number){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const g=c.getContext('2d')!; g.imageSmoothingEnabled=false;

  // STREET (trapezoid): top slants with SLOPE, bottom is the baseline
  g.fillStyle=PAL.asphalt;
  g.beginPath();
  g.moveTo(0, GROUND_Y - STREET_H + SLOPE*0);
  g.lineTo(w, GROUND_Y - STREET_H + SLOPE*w);
  g.lineTo(w, GROUND_Y);
  g.lineTo(0, GROUND_Y);
  g.closePath(); g.fill();

  // curb face strip (gives that "edge" like your reference)
  g.fillStyle=PAL.curbFace;
  g.beginPath();
  const curbY0 = GROUND_Y - STREET_H + SLOPE*0 + 18;
  const curbY1 = GROUND_Y - STREET_H + SLOPE*w + 18;
  g.moveTo(0,  curbY0);
  g.lineTo(w,  curbY1);
  g.lineTo(w,  curbY1+3);
  g.lineTo(0,  curbY0+3);
  g.closePath(); g.fill();

  // curb top highlight
  g.strokeStyle=PAL.curbTop; g.lineWidth=1;
  g.beginPath(); g.moveTo(0,curbY0); g.lineTo(w,curbY1); g.stroke();

  // dashed lane paint (parallelograms aligned to slope)
  g.fillStyle=PAL.lane;
  for(let x=40; x<w; x+=200){
    const y = GROUND_Y - 24 + SLOPE*x;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x+64, y + SLOPE*64);
    g.lineTo(x+64, y + SLOPE*64 + 4);
    g.lineTo(x, y + 4);
    g.closePath(); g.fill();
  }

  // cracks
  g.fillStyle=PAL.crack;
  for(let x=100; x<w; x+=320){
    const y = GROUND_Y - 12 + SLOPE*x;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x+36, y + SLOPE*36);
    g.lineTo(x+36, y + SLOPE*36 + 2);
    g.lineTo(x, y + 2);
    g.closePath(); g.fill();
  }

  return c;
}

export function createWorld(scene: Phaser.Scene){
  // Check if textures already exist to avoid duplication errors
  if (!scene.textures.exists('city_back')) {
    // ---- BACKGROUND (tileable skyline) ----
    const backCanvas = drawSkyline(960, 160);
    scene.textures.addCanvas('city_back', backCanvas);
  }
  
  if (!scene.textures.exists('city_street')) {
    // ---- STREET LAYER (angled-looking strip) ----
    const streetCanvas = drawStreet(960, 160);
    scene.textures.addCanvas('city_street', streetCanvas);
  }
  
  const skyline = scene.add.tileSprite(0,0,480,160,'city_back')
    .setOrigin(0,0).setScrollFactor(0.25).setDepth(1);

  const street = scene.add.tileSprite(0,0,480,160,'city_street')
    .setOrigin(0,0).setScrollFactor(1).setDepth(5);

  // ---- PHYSICS GROUND (invisible, exactly on baseline) ----
  const ground = scene.physics.add.staticGroup();
  const slab = scene.add.rectangle(0, GROUND_Y, 10000, 10, 0x000000, 0);
  scene.physics.add.existing(slab, true);
  ground.add(slab as any);

  // ---- Gameplay groups ----
  const rails = scene.physics.add.staticGroup();
  const obstacles = scene.physics.add.staticGroup();

  // ---- Update (parallax only) ----
  const update = (scrollX:number)=>{
    skyline.tilePositionX = scrollX * 0.25;
    street.tilePositionX  = scrollX * 1.00; // keeps paint/cracks moving with the world
  };

  function visualGroundYFor(){ return GROUND_Y; }

  return { ground, rails, obstacles, update, visualGroundYFor };
}