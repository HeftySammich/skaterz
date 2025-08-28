// Auto-crop a subject out of the image (uses corner color as "bg") then scale to 'target'
export async function cropAndMakeTexture(
  scene: Phaser.Scene, inKey: string, outKey: string, target = 96
) {
  const tex = scene.textures.get(inKey);
  const img = tex.getSourceImage() as HTMLImageElement;
  const w = img.width, h = img.height;

  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d')!; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);

  const bg = ctx.getImageData(0, 0, 1, 1).data;
  const isBg = (r:number,g:number,b:number,a:number) => {
    if (a < 5) return true;
    const dr=r-bg[0], dg=g-bg[1], db=b-bg[2];
    return (dr*dr + dg*dg + db*db) < 18*18;
  };

  const data = ctx.getImageData(0,0,w,h).data;
  let minX=w, minY=h, maxX=0, maxY=0, found=false;
  for (let y=0;y<h;y++) for (let x=0;x<w;x++){
    const i=(y*w+x)*4; if (!isBg(data[i],data[i+1],data[i+2],data[i+3])) {
      found=true; if(x<minX)minX=x; if(y<minY)minY=y; if(x>maxX)maxX=x; if(y>maxY)maxY=y;
    }
  }
  if (!found) throw new Error('No foreground found for sprite.');

  const sw=maxX-minX+1, sh=maxY-minY+1, side=Math.max(sw,sh);
  const c2 = document.createElement('canvas'); c2.width=side; c2.height=side;
  const ctx2=c2.getContext('2d')!; ctx2.imageSmoothingEnabled=false;
  const ox=Math.floor((side-sw)/2), oy=Math.floor((side-sh)/2);
  ctx2.drawImage(c, minX, minY, sw, sh, ox, oy, sw, sh);

  const c3=document.createElement('canvas'); c3.width=target; c3.height=target;
  const ctx3=c3.getContext('2d')!; ctx3.imageSmoothingEnabled=false;
  ctx3.drawImage(c2, 0, 0, side, side, 0, 0, target, target);

  scene.textures.addCanvas(outKey, c3);
}

// Build small lean/tilt frames from a base texture to simulate a skate loop.
export function synthesizeLeanFrames(
  scene: Phaser.Scene, baseKey: string, framePrefix: string, angles = [-4,-2,0,2,4,2]
) {
  const base = scene.textures.get(baseKey).getSourceImage() as HTMLCanvasElement|HTMLImageElement;
  angles.forEach((deg,idx)=>{
    const s = 96, pad = 4;
    const c = document.createElement('canvas'); c.width=s+pad*2; c.height=s+pad*2;
    const ctx=c.getContext('2d')!; ctx.imageSmoothingEnabled=false;
    ctx.translate((s+pad*2)/2, (s+pad*2)/2);
    ctx.rotate(deg*Math.PI/180);
    ctx.drawImage(base, -s/2, -s/2);
    scene.textures.addCanvas(`${framePrefix}_${idx}`, c);
  });
}