import Phaser from 'phaser';

export class ObstacleManager {
  private scene: Phaser.Scene;
  private obstacles: Phaser.Physics.Arcade.Group;
  private lastObstacleX = 0;
  private spawnTimer = 0;
  private spawnInterval = 2000; // 2 seconds

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.obstacles = scene.physics.add.group();
    this.lastObstacleX = 300; // Start spawning after initial area
  }

  update(delta: number) {
    this.spawnTimer += delta;
    
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnObstacle();
      this.spawnTimer = 0;
      
      // Gradually decrease spawn interval for increased difficulty
      this.spawnInterval = Math.max(1000, this.spawnInterval - 10);
    }

    // Remove obstacles that are far behind the camera
    const cameraX = this.scene.cameras.main.scrollX;
    this.obstacles.children.entries.forEach(obstacle => {
      if ((obstacle as any).x < cameraX - 100) {
        obstacle.destroy();
      }
    });
  }

  spawnObstacle() {
    const cameraX = this.scene.cameras.main.scrollX;
    const spawnX = Math.max(this.lastObstacleX + Phaser.Math.Between(100, 200), cameraX + 250);
    
    // Create obstacle
    const obstacle = this.obstacles.create(spawnX, 116, 'obstacles');
    obstacle.setOrigin(0.5, 1);
    obstacle.body.setImmovable(true);
    obstacle.body.setSize(12, 20); // Smaller hitbox for fairer gameplay
    
    this.lastObstacleX = spawnX;
    
    console.log(`Spawned obstacle at x: ${spawnX}`);
  }

  getObstacles(): Phaser.Physics.Arcade.Group {
    return this.obstacles;
  }
}
