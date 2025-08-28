export class Score {
  value = 0;
  
  addDistance(distance: number) {
    this.value += distance * 0.1; // Distance points
  }
  
  addTrick(points: number) {
    this.value += points;
  }
  
  addGrindTick() {
    this.value += 1; // Small constant grind bonus
  }
  
  reset() {
    this.value = 0;
  }
}
