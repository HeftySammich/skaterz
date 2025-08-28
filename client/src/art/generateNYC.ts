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
  const tw=16, th=16, cols=8, rows=4;
  const sheet=document.createElement('canvas'); sheet.width=cols*tw; sheet.height=rows*th;
  const g=sheet.getContext('2d')!; g.imageSmoothingEnabled=false;

  // 0: asphalt base (dither + cracks)
  dither(g, 0,0,tw,th, PAL.asphalt0, PAL.asphalt1);
  g.strokeStyle = PAL.asphaltCrack; g.lineWidth=1;
  g.beginPath(); g.moveTo(3,12); g.lineTo(10,8); g.lineTo(14,10); g.stroke();

  // 1: asphalt with lane paint line
  dither(g, 16,0,tw,th, PAL.asphalt0, PAL.asphalt1);
  g.fillStyle = PAL.lanePaint; g.fillRect(16+7,0,2,16);

  // 2: crosswalk (diagonal)
  dither(g, 32,0,tw,th, PAL.asphalt0, PAL.asphalt1);
  g.fillStyle = PAL.lanePaint; for(let x=-6;x<16;x+=5) g.fillRect(32+x,0,3,16);

  // 3: manhole
  dither(g, 48,0,tw,th, PAL.asphalt0, PAL.asphalt1);
  g.fillStyle = '#404650'; g.fillRect(48+4,4,8,8);
  g.fillStyle = '#2d323a'; for (let i=48+5;i<48+11;i+=2) g.fillRect(i,6,1,4);

  // 4: sidewalk slab
  dither(g, 0,16,tw,th, PAL.sidewalk0, PAL.sidewalk1);
  g.strokeStyle = '#4c4c56'; g.strokeRect(0.5,16.5,tw-1,th-1);
  g.beginPath(); g.moveTo(0,16+8); g.lineTo(16,16+8); g.stroke();

  // 5: curb (top + face)
  dither(g, 16,16,tw,th, PAL.curbTop, PAL.sidewalk1);
  g.fillStyle = PAL.curbFace; g.fillRect(16,16+10,16,6);

  // 6: debris (papers)
  dither(g, 32,16,tw,th, PAL.asphalt0, PAL.asphalt1);
  g.fillStyle = '#cfcfd4'; g.fillRect(32+3,16+11,3,2); g.fillRect(32+11,16+6,2,2);

  // 7: hazard edge
  dither(g, 48,16,tw,th, PAL.asphalt0, PAL.asphalt1);
  g.fillStyle = PAL.hazard; for(let i=0;i<16;i+=4) g.fillRect(48+i,16+12,2,4);

  scene.textures.addCanvas('nyc_tiles', sheet);

  // Rail 48x6 + posts
  const rail=document.createElement('canvas'); rail.width=48; rail.height=6;
  const r=rail.getContext('2d')!; r.imageSmoothingEnabled=false;
  r.fillStyle = PAL.steel; r.fillRect(0,2,48,2);
  r.fillStyle = '#2c3942'; r.fillRect(0,1,48,1);
  [6,24,42].forEach(x=>r.fillRect(x,3,2,3));
  scene.textures.addCanvas('rail', rail);

  // Barricade 16x24
  const ob=document.createElement('canvas'); ob.width=16; ob.height=24;
  const o=ob.getContext('2d')!; o.imageSmoothingEnabled=false;
  dither(o, 0,0,16,24, '#402a1f', '#6b3f28');
  o.fillStyle = PAL.hazard; o.fillRect(2,6,12,3); o.fillRect(2,14,12,3);
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