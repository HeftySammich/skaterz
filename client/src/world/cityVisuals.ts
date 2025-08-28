// src/world/cityVisuals.ts
const GROUND_Y = 160;      // physics baseline
const STREET_H = 64;       // total street band height
const SLOPE_DEG = -8;      // how "angled" the top edge looks
const SLOPE = Math.tan(SLOPE_DEG * Math.PI / 180); // Δy per px of x

// --- colors (GBA-leaning)
const C = {
  sky0:'#274b8c', sky1:'#1f3d6e', sky2:'#162b4d',
  star:'#ffecb3',
  bldg0:'#0b1a2a', bldgMid:'#12304a', win:'#f1a340',
  asphalt:'#2d303b', lane:'#e2e28e', crack:'#1c1e25',
  curbTop:'#b9c0cf', curbFace:'#646c7a', sidewalk0:'#757c8b', sidewalk1:'#9aa2b2'
};

function gradSky(g:CanvasRenderingContext2D, w:number, h:number){
  for(let y=0;y<h;y++){ const t=y/h; g.fillStyle = t<.33?C.sky0:t<.66?C.sky1:C.sky2; g.fillRect(0,y,w,1); }
  g.fillStyle = C.star; for(let i=0;i<90;i++){ const x=(Math.random()*w)|0, y=(Math.random()*h)|0; if (y>12) g.fillRect(x,y,1,1); }
}

function drawBuildings(g:CanvasRenderingContext2D, w:number, h:number){
  const R=(a:number,b:number)=>Math.floor(a+Math.random()*(b-a));
  for(let x=0; x<w; ){
    const bw = R(40,90), bh = R(50,120);
    const by = GROUND_Y - STREET_H - 10 - bh; // sit above street
    g.fillStyle = C.bldg0; g.fillRect(x, by, bw, bh);
    // windows
    g.fillStyle = C.win;
    for(let yy=by+8; yy<by+bh-6; yy+=8){
      for(let xx=x+6; xx<x+bw-6; xx+=8){ if(Math.random()<0.22) g.fillRect(xx,yy,2,3); }
    }
    x += bw + R(6,18);
  }
}

export function buildCityBack(scene: Phaser.Scene){
  const w = 720, h = 160;
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const g = c.getContext('2d')!; g.imageSmoothingEnabled=false;

  gradSky(g, w, h);
  drawBuildings(g, w, h);

  const key = 'city_back';
  scene.textures.addCanvas(key, c);
  const t = scene.add.tileSprite(0, 0, 480, 160, key).setOrigin(0,0).setScrollFactor(0.25).setDepth(1);
  return t;
}

export function buildStreetLayer(scene: Phaser.Scene){
  const w = 960, h = 160;
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const g = c.getContext('2d')!; g.imageSmoothingEnabled=false;

  // --- STREET POLYGON (flat at bottom, angled top edge)
  // Top edge: y_top(x) = GROUND_Y - STREET_H + SLOPE*x
  g.fillStyle = C.asphalt;
  g.beginPath();
  g.moveTo(0, GROUND_Y - STREET_H + SLOPE*(0));
  g.lineTo(w, GROUND_Y - STREET_H + SLOPE*(w));
  g.lineTo(w, GROUND_Y);
  g.lineTo(0, GROUND_Y);
  g.closePath(); g.fill();

  // curb & sidewalk along the top of street
  // curb face (2px)
  g.fillStyle = C.curbFace;
  g.beginPath();
  g.moveTo(0, GROUND_Y - STREET_H + SLOPE*0 + 18);
  g.lineTo(w, GROUND_Y - STREET_H + SLOPE*w + 18);
  g.lineTo(w, GROUND_Y - STREET_H + SLOPE*w + 22);
  g.lineTo(0, GROUND_Y - STREET_H + SLOPE*0 + 22);
  g.closePath(); g.fill();

  // curb top (thin)
  g.strokeStyle = C.curbTop; g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0, GROUND_Y - STREET_H + SLOPE*0 + 18);
  g.lineTo(w, GROUND_Y - STREET_H + SLOPE*w + 18);
  g.stroke();

  // dashed lane paint (draw parallelograms following slope)
  g.fillStyle = C.lane;
  for(let x=20; x<w; x+=200){
    const y = GROUND_Y - 24 + SLOPE*(x);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x+60, y + SLOPE*60);
    g.lineTo(x+60, y + SLOPE*60 + 4);
    g.lineTo(x, y + 4);
    g.closePath(); g.fill();
  }

  // a few cracks (short parallelograms)
  g.fillStyle = C.crack;
  for (let x=80; x<w; x+=320){
    const y = GROUND_Y - 10 + SLOPE*x;
    g.beginPath();
    g.moveTo(x, y); g.lineTo(x+40, y + SLOPE*40);
    g.lineTo(x+40, y + SLOPE*40 + 2);
    g.lineTo(x, y + 2);
    g.closePath(); g.fill();
  }

  const key = 'city_street';
  scene.textures.addCanvas(key, c);
  const t = scene.add.tileSprite(0, 0, 480, 160, key).setOrigin(0,0).setScrollFactor(1).setDepth(3);
  return t;
}

export const VisualGroundY = () => GROUND_Y;  // flat physics baseline