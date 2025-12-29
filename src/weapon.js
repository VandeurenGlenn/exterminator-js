import { audio } from "./audio.js";

export class Bullet {
  constructor(from, target, config = {}) {
    this.pos = { ...from };
    this.target = target;
    this.speed = config.bulletSpeed || 460;
    this.dead = false;
    this.radius = 5;
    this.damage = config.towerDamage || 18;
  }

  update(dt) {
    if (!this.target || this.target.dead) {
      this.dead = true;
      return;
    }
    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const dist = Math.hypot(dx, dy) || 1;
    const step = (this.speed * dt) / dist;
    this.pos.x += dx * step;
    this.pos.y += dy * step;
    if (dist < this.radius + this.target.radius) {
      this.dead = true;
      this.target.hp -= this.damage;
      if (this.target.hp <= 0) {
        this.target.dead = true;
        audio.playEnemyDeath();
      }
    }
  }
}

export class Tower {
  constructor(pos, config = {}) {
    this.pos = pos;
    this.range = config.towerRange || 140;
    this.fireRate = config.towerFireRate || 0.55;
    this.cooldown = 0;
    this.level = 1;
    this.damage = config.towerDamage || 18;
    this.angle = -Math.PI / 2; // Default facing up
    this.turnRate = Math.PI * 3; // Radians per second
    this.bulletSpeed = config.bulletSpeed || 460;
    this.damageStep = config.towerDamageStep || 8;
    this.speedMultiplierStep = config.towerFireRateStep || 0.88;
    this.minFireRate = config.towerMinFireRate || 0.22;
    this.damageLevel = 1;
    this.speedLevel = 1;
    this.invested = config.baseCost || 0;
  }

  update(dt, enemies, bullets) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    const target = this.acquireTarget(enemies);

    if (target) {
      this.trackTarget(target, dt);
    }

    if (target && this.cooldown <= 0) {
      const muzzleOffset = 16;
      const spawnPos = {
        x: this.pos.x + Math.cos(this.angle) * muzzleOffset,
        y: this.pos.y + Math.sin(this.angle) * muzzleOffset,
      };

      const bullet = new Bullet(spawnPos, target, {
        bulletSpeed: this.bulletSpeed,
        towerDamage: this.damage,
      });
      bullets.push(bullet);
      this.cooldown = this.fireRate;
    }
  }

  acquireTarget(enemies) {
    let closest = null;
    let closestDist = Infinity;
    for (const e of enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.pos.x - this.pos.x, e.pos.y - this.pos.y);
      if (d <= this.range && d < closestDist) {
        closestDist = d;
        closest = e;
      }
    }
    return closest;
  }

  trackTarget(target, dt) {
    const desired = Math.atan2(
      target.pos.y - this.pos.y,
      target.pos.x - this.pos.x
    );
    const delta = normalizeAngle(desired - this.angle);
    const maxStep = this.turnRate * dt;
    const step = Math.max(-maxStep, Math.min(maxStep, delta));
    this.angle = normalizeAngle(this.angle + step);
  }
}

export class SniperTower extends Tower {
  constructor(pos, config = {}) {
    super(pos, {
      towerRange: config.towerRange,
      towerFireRate: config.towerFireRate,
      towerDamage: config.towerDamage,
      towerDamageStep: config.towerDamageStep,
      towerFireRateStep: config.towerFireRateStep,
      towerMinFireRate: config.towerMinFireRate,
      bulletSpeed: config.bulletSpeed,
      baseCost: config.baseCost,
    });
    this.turnRate = Math.PI * 2; // slightly slower turning
  }
}

function normalizeAngle(rad) {
  let a = rad;
  while (a <= -Math.PI) a += Math.PI * 2;
  while (a > Math.PI) a -= Math.PI * 2;
  return a;
}
