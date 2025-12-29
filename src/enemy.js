// Enemy configuration
const INSECT_TYPES = {
  ant: {
    movement: "crawling",
    speedMultiplier: 1.0,
    hpMultiplier: 1.0,
    size: 1.0,
    color: "#8b4513",
    headColor: "#a0522d",
    reward: 18,
    damage: 1,
  },
  wasp: {
    movement: "flying",
    speedMultiplier: 1.3,
    hpMultiplier: 0.8,
    size: 0.85,
    color: "#ffd700",
    headColor: "#ffa500",
    reward: 22,
    damage: 1,
  },
  beetle: {
    movement: "crawling",
    speedMultiplier: 0.7,
    hpMultiplier: 1.4,
    size: 1.15,
    color: "#2f4f4f",
    headColor: "#556b2f",
    reward: 25,
    damage: 2,
  },
  hornet: {
    movement: "flying",
    speedMultiplier: 1.5,
    hpMultiplier: 1.1,
    size: 1.1,
    color: "#ff6347",
    headColor: "#ff4500",
    reward: 28,
    damage: 2,
  },
};

export class Enemy {
  constructor(
    spawnPos,
    goal,
    wave,
    config,
    difficulty = "normal",
    insectClass = "ant",
    gameRef = null
  ) {
    this.pos = { ...spawnPos };
    this.goal = goal;
    this.insectClass = insectClass;
    const insectData = config.insectTypes[insectClass];
    this.type = insectData.movement; // "flying" or "crawling"
    this.gameRef = gameRef;
    const diff = config.difficulties[difficulty];

    // Apply insect-specific multipliers on top of wave/difficulty scaling
    this.speed =
      (config.enemyBaseSpeed + wave * 4) *
      diff.enemySpeedMultiplier *
      insectData.speedMultiplier;
    this.hp =
      (config.enemyBaseHP + wave * 8) *
      diff.enemyHPMultiplier *
      insectData.hpMultiplier;
    this.maxHp = this.hp;
    this.radius = 14 * insectData.size;
    this.dead = false;
    this.reward = insectData.reward;
    this.damage = insectData.damage;
    this.color = insectData.color;
    this.headColor = insectData.headColor;
    this.size = insectData.size;
    this.slowTimer = 0;
    this.slowFactor = 1;

    // Crawling insects need pathfinding
    if (this.type === "crawling" && gameRef) {
      this.path = gameRef.computePath(spawnPos, goal);
      this.pathIndex = 0;
    }
  }

  update(dt) {
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowTimer = 0;
        this.slowFactor = 1;
      }
    }
    const effectiveSpeed = this.speed * this.slowFactor;

    if (this.type === "flying") {
      // Flying insects move directly toward goal
      const dx = this.goal.x - this.pos.x;
      const dy = this.goal.y - this.pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1) return;
      const step = (effectiveSpeed * dt) / dist;
      this.pos.x += dx * step;
      this.pos.y += dy * step;
    } else {
      // Crawling insects follow A* path strictly; no clipping through obstacles
      if (
        !this.path ||
        this.path.length === 0 ||
        this.pathIndex >= this.path.length
      ) {
        if (this.gameRef) {
          this.path = this.gameRef.computePath(this.pos, this.goal);
          this.pathIndex = 0;
        }
        if (!this.path) return;
      }

      const target = this.path[this.pathIndex];
      const dx = target.x - this.pos.x;
      const dy = target.y - this.pos.y;
      const dist = Math.hypot(dx, dy) || 1;
      const reachThreshold = 3;
      if (dist <= reachThreshold) {
        this.pathIndex += 1;
        return;
      }

      const step = effectiveSpeed * dt;
      const nx = this.pos.x + (dx / dist) * step;
      const ny = this.pos.y + (dy / dist) * step;

      // Hard stop if next cell is blocked by wall/tower
      if (this.gameRef) {
        const nextCell = this.gameRef.cellFromPoint({ x: nx, y: ny });
        const nextKey = `${nextCell.cx},${nextCell.cy}`;
        if (this.gameRef.walls.has(nextKey)) {
          // Path obstructed; recompute from current position
          this.recomputePath();
          return;
        }
      }

      this.pos.x = nx;
      this.pos.y = ny;
    }
  }

  recomputePath() {
    if (this.type !== "crawling" || !this.gameRef) return;
    const newPath = this.gameRef.computePath(this.pos, this.goal);
    this.path = newPath || this.path;
    this.pathIndex = 0;
  }

  reachedBase() {
    const dx = this.goal.x - this.pos.x;
    const dy = this.goal.y - this.pos.y;
    const dist = Math.hypot(dx, dy);
    return dist < 20;
  }

  applySlow(factor, duration) {
    if (factor < this.slowFactor || this.slowTimer <= 0) {
      this.slowFactor = factor;
      this.slowTimer = duration;
    }
  }
}
