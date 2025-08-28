import { PAL } from './palette';

export function buildParallax(scene: Phaser.Scene){
  // Stars (tileSprite) — slow drift
  const stars = scene.add.tileSprite(0, 0, 480, 160, createStars(scene)).setOrigin(0,0);
  stars.setScrollFactor(0.05);

  // Skyline silhouettes (tileSprite)
  const skyline = scene.add.tileSprite(0, 40, 480, 80, createSkyline(scene)).setOrigin(0,0);
  skyline.setScrollFactor(0.2);

  // Foreground chain-link fence strip for depth
  const fence = scene.add.tileSprite(0, 110, 480, 50, createFence(scene)).setOrigin(0,0);
  fence.setScrollFactor(0.6).setAlpha(0.5);

  return { stars, skyline, fence };
}

function createStars(scene: Phaser.Scene){
  const w=240,h=160,c=document.createElement('canvas'); c.width=w; c.height=h;
  const g=c.getContext('2d')!; g.imageSmoothingEnabled=false;
  // vertical bands
  for(let y=0;y<h;y++){
    const t=y/h; g.fillStyle=t<.33?PAL.sky0:t<.66?PAL.sky1:PAL.sky2; g.fillRect(0,y,w,1);
  }
  // scatter stars
  g.fillStyle = PAL.star;
  for(let i=0;i<90;i++){ const x=Math.random()*w|0, y=Math.random()*h|0; if (y>20) g.fillRect(x,y,1,1); }
  const key='starsTex'; scene.textures.addCanvas(key,c); return key;
}

function createSkyline(scene: Phaser.Scene){
  const w=240,h=80,c=document.createElement('canvas'); c.width=w; c.height=h;
  const g=c.getContext('2d')!; g.imageSmoothingEnabled=false;
  g.fillStyle='transparent'; g.clearRect(0,0,w,h);
  const R=(a:number,b:number)=>Math.floor(a+Math.random()*(b-a));
  for(let i=0;i<12;i++){
    const bw=R(16,36), bh=R(18,60), bx=R(-10,w-10), by=h-bh;
    g.fillStyle=PAL.bldg0; g.fillRect(bx,by,bw,bh);
    // broken roof
    g.clearRect(bx+R(2,bw-6), by-2, R(2,4), 3);
    // windows
    g.fillStyle=PAL.window;
    for(let yy=by+6; yy<by+bh-4; yy+=6)
      for(let xx=bx+4; xx<bx+bw-4; xx+=6)
        if(Math.random()<0.12) g.fillRect(xx,yy,1,2);
  }
  const key='skylineTex'; scene.textures.addCanvas(key,c); return key;
}

function createFence(scene: Phaser.Scene){
  const w=240,h=50,c=document.createElement('canvas'); c.width=w; c.height=h;
  const g=c.getContext('2d')!; g.imageSmoothingEnabled=false;
  g.fillStyle = PAL.fence;  // diamond mesh
  for(let y=0;y<h;y+=4) for(let x=((y/4)&1)*2; x<w; x+=4) g.fillRect(x,y,1,1);
  const key='fenceTex'; scene.textures.addCanvas(key,c); return key;
}