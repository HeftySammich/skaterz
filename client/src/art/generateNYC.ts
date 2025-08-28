import { PAL } from './palette';

function hex(s:string){ const v=parseInt(s.slice(1),16); return [(v>>16)&255,(v>>8)&255,(v)&255]; }
function dither(ctx: CanvasRenderingContext2D, x:number,y:number,w:number,h:number, c0:string,c1:string){
  const p=ctx.createImageData(w,h); const A=hex(c0), B=hex(c1);
  for(let j=0;j<h;j++) for(let i=0;i<w;i++){
    const idx=(j*w+i)*4, b=((i&1)^(j&1))?1:0, C=b?A:B;
    p.data[idx]=C[0]; p.data[idx+1]=C[1]; p.data[idx+2]=C[2]; p.data[idx+3]=255;
  }
  ctx.putImageData(p,x,y);
}

export function makeNYCTiles(scene: Phaser.Scene) {
  const tw=32, th=32, cols=8, rows=4; // Double resolution for HD
  const sheet=document.createElement('canvas'); sheet.width=cols*tw; sheet.height=rows*th;
  const g=sheet.getContext('2d')!; g.imageSmoothingEnabled=false;

  // 0: asphalt base (dither + cracks) - HD version
  dither(g, 0,0,tw,th, PAL.asphalt0, PAL.asphalt1);
  g.strokeStyle = PAL.asphaltCrack; g.lineWidth=2;
  g.beginPath(); g.moveTo(6,24); g.lineTo(20,16); g.lineTo(28,20); g.stroke();

  // 1: asphalt with lane paint line - HD version
  dither(g, 32,0,tw,th, PAL.asphalt0, PAL.asphalt1);
  g.fillStyle = PAL.lanePaint; g.fillRect(32+14,0,4,32);

  // 2: crosswalk (diagonal) - HD version
  dither(g, 64,0,tw,th, PAL.asphalt0, PAL.asphalt1);
  g.fillStyle = PAL.lanePaint; for(let x=-12;x<32;x+=10) g.fillRect(64+x,0,6,32);

  // 3: manhole - HD version
  dither(g, 96,0,tw,th, PAL.asphalt0, PAL.asphalt1);
  g.fillStyle = '#404650'; g.fillRect(96+8,8,16,16);
  g.fillStyle = '#2d323a'; for (let i=96+10;i<96+22;i+=4) g.fillRect(i,12,2,8);

  // 4: sidewalk slab - HD version
  dither(g, 0,32,tw,th, PAL.sidewalk0, PAL.sidewalk1);
  g.strokeStyle = '#4c4c56'; g.lineWidth=2; g.strokeRect(1,33,tw-2,th-2);
  g.beginPath(); g.moveTo(0,32+16); g.lineTo(32,32+16); g.stroke();

  // 5: curb (top + face) - HD version
  dither(g, 32,32,tw,th, PAL.curbTop, PAL.sidewalk1);
  g.fillStyle = PAL.curbFace; g.fillRect(32,32+20,32,12);

  // 6: debris (papers) - HD version
  dither(g, 64,32,tw,th, PAL.asphalt0, PAL.asphalt1);
  g.fillStyle = '#cfcfd4'; g.fillRect(64+6,32+22,6,4); g.fillRect(64+22,32+12,4,4);

  // 7: hazard edge - HD version
  dither(g, 96,32,tw,th, PAL.asphalt0, PAL.asphalt1);
  g.fillStyle = PAL.hazard; for(let i=0;i<32;i+=8) g.fillRect(96+i,32+24,4,8);

  scene.textures.addCanvas('nyc_tiles', sheet);

  // HD Rail 96x12 + posts
  const rail=document.createElement('canvas'); rail.width=96; rail.height=12;
  const r=rail.getContext('2d')!; r.imageSmoothingEnabled=false;
  r.fillStyle = PAL.steel; r.fillRect(0,4,96,4);
  r.fillStyle = '#2c3942'; r.fillRect(0,2,96,2);
  [12,48,84].forEach(x=>r.fillRect(x,6,4,6));
  scene.textures.addCanvas('rail', rail);

  // HD Barricade 32x48
  const ob=document.createElement('canvas'); ob.width=32; ob.height=48;
  const o=ob.getContext('2d')!; o.imageSmoothingEnabled=false;
  dither(o, 0,0,32,48, '#402a1f', '#6b3f28');
  o.fillStyle = PAL.hazard; o.fillRect(4,12,24,6); o.fillRect(4,28,24,6);
  scene.textures.addCanvas('barricade', ob);
}

export function makeSkyline(scene: Phaser.Scene) {
  const w=240, h=80; const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d')!; ctx.imageSmoothingEnabled=false;

  // banded sky
  for(let y=0;y<h;y++){
    const t=y/h; ctx.fillStyle = t<0.33?PAL.bgSky0 : t<0.66?PAL.bgSky1 : PAL.bgSky2;
    ctx.fillRect(0,y,w,1);
  }
  // jagged skyline + broken windows
  const rnd=(a:number,b:number)=>Math.floor(a+Math.random()*(b-a));
  for (let i=0;i<12;i++){
    const bw=rnd(12,30), bh=rnd(18,50), bx=rnd(-10,w-10), by=h-bh;
    ctx.fillStyle = PAL.bldgDark; ctx.fillRect(bx,by,bw,bh);
    // missing roof chunks
    ctx.clearRect(bx+rnd(1,bw-4), by-2, rnd(2,4), 3);
    // sparse window glow
    ctx.fillStyle = '#d7872f';
    for (let y2=by+4; y2<by+bh-4; y2+=6)
      for (let x2=bx+3; x2<bx+bw-3; x2+=6)
        if (Math.random()<0.12) ctx.fillRect(x2,y2,1,2);
  }
  scene.textures.addCanvas('skyline', c);
}