// from https://medium.com/web-maker/making-asteroids-with-kontra-js-and-web-maker-95559d39b45f
import {
 init,
 Sprite,
 initKeys,
 keyPressed,
 degToRad,
 GameLoop
} from './node_modules/kontra/kontra.mjs';

let { canvas, context } = init();
let sprites = [];

function createAsteroid(x, y, radius) {
  let asteroid = Sprite({
    type: 'asteroid', // we'll use this for collision detection
    x,
    y,
    dx: Math.random() * 4 - 2,
    dy: Math.random() * 4 - 2,
    radius,
    render() {
      this.context.strokeStyle = 'white';
      this.context.beginPath(); // start drawing a shape
      this.context.arc(0, 0, this.radius, 0, Math.PI * 2);
      this.context.stroke(); // outline the circle
    }
  });
  sprites.push(asteroid);
}

for (let i = 0; i < 4; i++) {
  createAsteroid(100, 100, 30);
}

initKeys();

let ship = Sprite({
  x: 300,
  y: 300,
  radius: 6, // we'll use this later for collision detection
  dt: 0, // track how much time has passed
  render() {
    // draw a right-facing triangle
    this.context.strokeStyle = 'white';
    this.context.beginPath();
    this.context.moveTo(-3, -5);
    this.context.lineTo(12, 0);
    this.context.lineTo(-3, 5);
    this.context.closePath();
    this.context.stroke();
  },
  update() {
    // rotate the ship left or right
    if (keyPressed('arrowleft')) {
      this.rotation += degToRad(-4);
    } else if (keyPressed('arrowright')) {
      this.rotation += degToRad(4);
    }

    // move the ship forward in the direction it's facing
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

    if (keyPressed('arrowup')) {
      this.ddx = cos * 0.05;
      this.ddy = sin * 0.05;
    } else {
      this.ddx = this.ddy = 0;
    }

    this.advance();

    // set a max speed
    if (this.velocity.length() > 5) {
      this.dx *= 0.95;
      this.dy *= 0.95;
    }

    // allow the player to fire no more than 1 bullet every 1/4 second
    this.dt += 1 / 60;
    if (keyPressed('space') && this.dt > 0.25) {
      this.dt = 0;
      let bullet = Sprite({
        color: 'white', // start the bullet on the ship at the end of the triangle
        x: this.x + cos * 12,
        y: this.y + sin * 12, // move the bullet slightly faster than the ship
        dx: this.dx + cos * 5,
        dy: this.dy + sin * 5, // live only 50 frames
        ttl: 50, // bullets are small
        radius: 2,
        width: 2,
        height: 2
      });
      sprites.push(bullet);
    }
  }
});
sprites.push(ship);

let loop = GameLoop({
  update() {
    sprites.map(sprite => {
      sprite.update();

      // asteroid is beyond the left edge
      if (sprite.x < -sprite.radius) {
        sprite.x = canvas.width + sprite.radius;
      }
      // sprite is beyond the right edge
      else if (sprite.x > canvas.width + sprite.radius) {
        sprite.x = 0 - sprite.radius;
      }

      // sprite is beyond the top edge
      if (sprite.y < -sprite.radius) {
        sprite.y = canvas.height + sprite.radius;
      }
      // sprite is beyond the bottom edge
      else if (sprite.y > canvas.height + sprite.radius) {
        sprite.y = -sprite.radius;
      }
    });

    // collision detection
    for (let i = 0; i < sprites.length; i++) {

      // only check for collision against asteroids
      if (sprites[i].type === 'asteroid') {
        for (let j = 0; j < sprites.length; j++) {
          // don't check asteroid vs. asteroid collisions
          if (sprites[j].type !== 'asteroid') {
            let asteroid = sprites[i];
            let sprite = sprites[j]; // circle vs. circle collision detection
            let dx = asteroid.x - sprite.x;
            let dy = asteroid.y - sprite.y;

            if (Math.hypot(dx, dy) < asteroid.radius + sprite.radius) {
              asteroid.ttl = 0;
              sprite.ttl = 0;

              // split the asteroid only if it's large enough
              if (asteroid.radius > 10) {
                for (let i = 0; i < 3; i++) {
                  createAsteroid(asteroid.x, asteroid.y, asteroid.radius / 2.5);
                }
              }

              break;
            }
          }
        }
      }
    }

    sprites = sprites.filter(sprite => sprite.isAlive());
  },
  render() {
    sprites.map(sprite => sprite.render());
  }
});
loop.start();