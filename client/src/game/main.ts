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
    render: {
      pixelArt: true,
      antialias: false,
      roundPixels: true
    },
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

  const game = new Phaser.Game(config);
  
  // Force disable text smoothing on the canvas context
  game.events.once('ready', () => {
    const canvas = game.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      (ctx as any).imageSmoothingEnabled = false;
      (ctx as any).webkitImageSmoothingEnabled = false;
      (ctx as any).mozImageSmoothingEnabled = false;
      (ctx as any).msImageSmoothingEnabled = false;
    }
  });

  return game;
}
