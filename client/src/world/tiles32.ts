import { PAL } from './palette';

function hex(s:string){ const v=parseInt(s.slice(1),16); return [(v>>16)&255,(v>>8)&255,(v)&255]; }
function dither(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,a:string,b:string){
  const A=hex(a),B=hex(b), img=ctx.createImageData(w,h);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){
    const idx=(j*w+i)*4, bit=((i&1)^(j&1))?1:0, C=bit?A:B;
    img.data[idx]=C[0]; img.data[idx+1]=C[1]; img.data[idx+2]=C[2]; img.data[idx+3]=255;
  }
  ctx.putImageData(img,x,y);
}

export function buildNYCAtlas32(scene: Phaser.Scene){
  const tw=32, th=32, cols=8, rows=3;
  const atlas=document.createElement('canvas'); atlas.width=cols*tw; atlas.height=rows*th;
  const g=atlas.getContext('2d')!; g.imageSmoothingEnabled=false;

  // 0: asphalt A
  dither(g, 0,0,tw,th, PAL.asphalt0, PAL.asphalt1);
  g.strokeStyle=PAL.crack; g.lineWidth=1;
  g.beginPath(); g.moveTo(5,26); g.lineTo(16,20); g.lineTo(28,23); g.stroke();

  // 1: asphalt with lane paint
  dither(g, 32,0,tw,th, PAL.asphalt0, PAL.asphalt1);
  g.fillStyle=PAL.lane; g.fillRect(32+15,0,2,32);

  // 2: crosswalk
  dither(g, 64,0,tw,th, PAL.asphalt0, PAL.asphalt1);
  g.fillStyle=PAL.lane; for(let x=-10;x<32;x+=7) g.fillRect(64+x,0,4,32);

  // 3: manhole
  dither(g, 96,0,tw,th, PAL.asphalt0, PAL.asphalt1);
  g.fillStyle='#404650'; g.fillRect(96+8,8,16,16);
  g.fillStyle='#2d323a'; for(let x=96+10;x<96+22;x+=3) g.fillRect(x,12,1,8);

  // 4: debris
  dither(g, 128,0,tw,th, PAL.asphalt0, PAL.asphalt1);
  g.fillStyle='#cfcfd4'; g.fillRect(128+6,23,5,3); g.fillRect(128+23,14,3,2);
  g.fillStyle=PAL.grime; g.fillRect(128+18,28,8,2);

  // 5: sidewalk slab
  dither(g, 160,0,tw,th, PAL.sidewalk0, PAL.sidewalk1);
  g.strokeStyle = '#4c4c56'; g.strokeRect(160.5,0.5,tw-1,th-1);
  g.beginPath(); g.moveTo(160,16); g.lineTo(192,16); g.stroke();

  // 6: curb
  dither(g, 192,0,tw,th, PAL.curbTop, PAL.sidewalk1);
  g.fillStyle=PAL.curbFace; g.fillRect(192, 22, 32, 10);

  // 7: hazard edge
  dither(g, 224,0,tw,th, PAL.asphalt0, PAL.asphalt1);
  g.fillStyle=PAL.hazard; for(let i=0;i<32;i+=6) g.fillRect(224+i, 24, 3, 8);

  // row 2 props (rails / cones)
  // Rails 32×8 (two stacked for 32×16 tile cell)
  const rail=document.createElement('canvas'); rail.width=32; rail.height=8;
  const r=rail.getContext('2d')!; r.imageSmoothingEnabled=false;
  r.fillStyle=PAL.steel; r.fillRect(0,3,32,2); r.fillStyle='#2c3942'; r.fillRect(0,2,32,1);
  [6,16,26].forEach(x=>r.fillRect(x,5,2,3));
  scene.textures.addCanvas('rail32', rail);

  // Barricade 32×24
  const bar=document.createElement('canvas'); bar.width=32; bar.height=24;
  const bc=bar.getContext('2d')!; bc.imageSmoothingEnabled=false;
  dither(bc,0,0,32,24,'#402a1f','#6b3f28'); bc.fillStyle=PAL.hazard;
  bc.fillRect(4,7,24,4); bc.fillRect(4,15,24,4);
  scene.textures.addCanvas('barricade32', bar);

  // Cone 16×24 (two per tile)
  const cone=document.createElement('canvas'); cone.width=16; cone.height=24;
  const cc=cone.getContext('2d')!; cc.imageSmoothingEnabled=false;
  cc.fillStyle=PAL.cone; cc.fillRect(3,14,10,8); cc.fillRect(6,6,6,8); cc.fillStyle=PAL.hazard; cc.fillRect(6,10,6,2);
  scene.textures.addCanvas('cone16x24', cone);

  // Put sheet into textures
  scene.textures.addCanvas('nyc32', atlas);
}