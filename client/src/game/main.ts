import Phaser from 'phaser';
import Preload from './scenes/Preload';
import Game from './scenes/Game';
import GameOver from './scenes/GameOver';

// GBA resolution
const BASE_W = 240;
const BASE_H = 160;

export function createGame(parent: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    width: BASE_W,
    height: BASE_H,
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 800 },
        debug: false
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      zoom: Math.max(2, Math.floor(Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H)))
    },
    scene: [Preload, Game, GameOver],
    backgroundColor: '#2c5f2d' // GBA green background
  };

  return new Phaser.Game(config);
}
