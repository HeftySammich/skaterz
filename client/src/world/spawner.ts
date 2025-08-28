type Spawn = 'pothole'|'wood'|'cone_knock'|'barricade'|'rail';

export class LevelDirector {
  private scene: Phaser.Scene;
  private world: any; // expects visualGroundYFor(x), rails, obstacles
  private nextX = 220;
  private baseSpeed = 100;
  private maxSpeed  = 180;

  constructor(scene: Phaser.Scene, world: any){ this.scene = scene; this.world = world; }

  private difficulty(scrollX: number){ return Math.min(1, scrollX / 3500); }

  update(scrollX: number){
    const d = this.difficulty(scrollX);
    while (this.nextX < scrollX + 480 + 160) {
      this.spawnOne(this.nextX, d);
      const gapMin = Phaser.Math.Linear(240, 120, d);
      const gapMax = Phaser.Math.Linear(360, 180, d);
      this.nextX += Phaser.Math.Between(gapMin|0, gapMax|0);
    }
  }
  getSpeed(scrollX: number){
    const d = this.difficulty(scrollX);
    return Phaser.Math.Linear(this.baseSpeed, this.maxSpeed, d);
  }

  private spawnOne(x: number, d: number){
    const bag: [Spawn, number][] = [
      ['rail',       Phaser.Math.Linear(60, 30, d)],
      ['pothole',    Phaser.Math.Linear(10, 35, d)],
      ['wood',       Phaser.Math.Linear(8,  25, d)],
      ['cone_knock', Phaser.Math.Linear(6,  22, d)],
      ['barricade',  Phaser.Math.Linear(16, 30, d)],
    ];
    const type = pick(bag);
    if (type==='rail') return this.spawnRail(x);
    if (type==='pothole') return this.spawnPothole(x);
    if (type==='wood') return this.spawnWood(x);
    if (type==='cone_knock') return this.spawnCone(x);
    return this.spawnBarricade(x);
  }

  private spawnRail(x: number){
    const BASE = 160;
    const rail = this.scene.add.image(x, BASE-18, 'rail32').setOrigin(0.5,1).setDepth(6);
    this.scene.physics.add.existing(rail, true);
    this.world.rails.add(rail as any);
  }
  private spawnPothole(x: number){
    const BASE = 160;
    this.scene.add.image(x, BASE-1, 'pothole32x12').setOrigin(0.5,1).setDepth(7);
    const hit = this.scene.add.rectangle(x, BASE-4, 22, 6, 0x000000, 0);
    this.scene.physics.add.existing(hit, true);
    this.world.obstacles.add(hit as any);
  }
  private spawnWood(x: number){
    const BASE = 160;
    const wood = this.scene.add.image(x, BASE, 'woodblock32x14').setOrigin(0.5,1).setDepth(7);
    this.scene.physics.add.existing(wood, true);
    this.world.obstacles.add(wood as any);
  }
  private spawnCone(x: number){
    const BASE = 160;
    const cone = this.scene.add.image(x, BASE, 'cone_knock24x12').setOrigin(0.5,1).setDepth(7);
    this.scene.physics.add.existing(cone, true);
    this.world.obstacles.add(cone as any);
  }
  private spawnBarricade(x: number){
    const BASE = 160;
    const barricade = this.scene.add.image(x, BASE-2, 'barricade32').setOrigin(0.5,1).setDepth(7);
    this.scene.physics.add.existing(barricade, true);
    this.world.obstacles.add(barricade as any);
  }
}

function pick(bag: [Spawn, number][]): Spawn {
  const total = bag.reduce((s, [,w])=>s+w, 0);
  let r = Math.random() * total;
  for (const [k,w] of bag) { if ((r-=w) <= 0) return k; }
  return bag[0][0];
}