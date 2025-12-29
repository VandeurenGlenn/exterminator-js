import { Enemy } from "./enemy.js";
import { Bullet, Tower } from "./weapon.js";
import { audio } from "./audio.js";

const CONFIG = {
  width: 960,
  height: 540,
  towerCost: 60,
  wallCost: 25,
  trapCost: 40,
  upgradeCost: 85,
  refundRate: 0.6,
  baseHP: 20,
  startingScrap: 100,
  bulletSpeed: 460,
  towerRange: 140,
  towerFireRate: 0.55,
  towerDamage: 18,
  waveSpawnInterval: 0.75,
  enemyBaseHP: 20,
  enemyBaseSpeed: 65,
  scrapPerKill: 18,
  start: { x: 80, y: 120 },
  goal: { x: 860, y: 420 },
  gridSize: 24,
  difficulties: {
    easy: {
      enemyHPMultiplier: 1.1,
      enemySpeedMultiplier: 1.05,
      waveMultiplier: 1.05,
      startingScrap: 85,
      baseHP: 18,
    },
    normal: {
      enemyHPMultiplier: 1.25,
      enemySpeedMultiplier: 1.15,
      waveMultiplier: 1.15,
      startingScrap: 80,
      baseHP: 15,
    },
    hard: {
      enemyHPMultiplier: 1.75,
      enemySpeedMultiplier: 1.4,
      waveMultiplier: 1.4,
      startingScrap: 65,
      baseHP: 12,
    },
  },
  missions: {
    1: {
      name: "First Contact",
      description: "Standard corridor defense",
      maxWaves: 10,
    },
    2: {
      name: "Swarm Rising",
      description: "Increased enemy waves",
      maxWaves: 15,
    },
    3: {
      name: "Infestation",
      description: "Survive the endless swarm",
      maxWaves: Infinity,
    },
  },
  insectTypes: {
    ant: {
      name: "Ant",
      movement: "crawling",
      hpMultiplier: 0.8,
      speedMultiplier: 1.0,
      damage: 1,
      reward: 15,
      color: "#8b3a3a",
      headColor: "#a84444",
      size: 1.0,
      unlockWave: 1,
    },
    beetle: {
      name: "Beetle",
      movement: "crawling",
      hpMultiplier: 1.5,
      speedMultiplier: 0.6,
      damage: 2,
      reward: 25,
      color: "#2a2a2a",
      headColor: "#3a3a3a",
      size: 1.2,
      unlockWave: 5,
    },
    spider: {
      name: "Spider",
      movement: "crawling",
      hpMultiplier: 1.0,
      speedMultiplier: 1.4,
      damage: 1,
      reward: 20,
      color: "#4a3a5a",
      headColor: "#5a4a6a",
      size: 1.1,
      unlockWave: 7,
    },
    fly: {
      name: "Fly",
      movement: "flying",
      hpMultiplier: 0.5,
      speedMultiplier: 1.3,
      damage: 1,
      reward: 12,
      color: "#9a7a5a",
      headColor: "#aa8a6a",
      size: 0.9,
      unlockWave: 10,
    },
    wasp: {
      name: "Wasp",
      movement: "flying",
      hpMultiplier: 0.8,
      speedMultiplier: 1.5,
      damage: 2,
      reward: 22,
      color: "#c8a422",
      headColor: "#d8b432",
      size: 1.0,
      unlockWave: 12,
    },
    moth: {
      name: "Moth",
      movement: "flying",
      hpMultiplier: 0.6,
      speedMultiplier: 1.1,
      damage: 1,
      reward: 15,
      color: "#8a8a7a",
      headColor: "#9a9a8a",
      size: 1.15,
      unlockWave: 15,
    },
  },
};

export class Game {
  constructor(canvas, uiUpdater) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = uiUpdater;
    this.difficulty = "easy";
    this.mission = "1";
    this.buildMode = null;
    this.reset();
    this.loop = this.loop.bind(this);
  }

  setBuildMode(mode) {
    this.buildMode = mode;
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    this.reset();
  }

  setMission(mission) {
    this.mission = mission;
    this.reset();
  }

  reset() {
    this.towers = [];
    this.enemies = [];
    this.bullets = [];
    this.traps = [];
    this.walls = new Set();
    this.wallList = [];
    this.wave = 1;
    const diff = CONFIG.difficulties[this.difficulty];
    this.scrap = diff.startingScrap;
    this.maxHP = diff.baseHP;
    this.hp = this.maxHP;
    this.spawnTimer = 0;
    this.spawnQueue = 0;
    this.waveTotal = 0;
    this.state = "idle";
    this.isPaused = false;
    this.lastTime = 0;
    this.createInitialWalls();
    this.paths = this.computeAllPaths();
    this.cursorPos = null;
    this.ui(this);
    this.draw();
    this.buildMode = null; // Reset build mode on reset
  }

  start() {
    if (this.state === "running") return;
    this.state = "running";
    this.isPaused = false;
    this.waveTotal = this.spawnQueue = this.waveSize();
    this.lastTime = performance.now();
    // Start first retro song immediately when game begins
    audio.playRetroSong();
    requestAnimationFrame(this.loop);
  }

  togglePause() {
    if (this.state === "running") {
      this.isPaused = !this.isPaused;
      this.lastTime = performance.now();
      this.ui(this);
      if (this.isPaused) {
        audio.startMusic();
      } else {
        audio.stopMusic();
        requestAnimationFrame(this.loop);
      }
    }
  }

  restart() {
    this.reset();
    this.start();
  }

  waveSize() {
    const diff = CONFIG.difficulties[this.difficulty];
    return Math.floor((6 + this.wave * 3) * diff.waveMultiplier);
  }

  createPath() {
    // Straight A->B lane to mirror original flow (spawn to hive).
    return [CONFIG.start, CONFIG.goal];
  }

  cellFromPoint(p) {
    return {
      cx: Math.floor(p.x / CONFIG.gridSize),
      cy: Math.floor(p.y / CONFIG.gridSize),
    };
  }

  pointFromCell(c) {
    return {
      x: c.cx * CONFIG.gridSize + CONFIG.gridSize / 2,
      y: c.cy * CONFIG.gridSize + CONFIG.gridSize / 2,
    };
  }

  placeTower(pos) {
    if (this.state === "over") return { ok: false, reason: "Game over" };
    if (this.isPaused) return { ok: false, reason: "Game paused" };
    if (this.scrap < CONFIG.towerCost)
      return { ok: false, reason: "Need more scrap" };
    const cell = this.cellFromPoint(pos);
    const key = `${cell.cx},${cell.cy}`;
    const snapPos = this.pointFromCell(cell);
    if (!this.isBuildable(snapPos))
      return { ok: false, reason: "Can't build here" };

    const startCell = this.cellFromPoint(CONFIG.start);
    const goalCell = this.cellFromPoint(CONFIG.goal);
    if (
      (cell.cx === startCell.cx && cell.cy === startCell.cy) ||
      (cell.cx === goalCell.cx && cell.cy === goalCell.cy)
    ) {
      return { ok: false, reason: "Can't block start or base" };
    }

    // Tentatively add tower and recompute path
    this.walls.add(key);
    const newPaths = this.computeAllPaths();
    if (!newPaths || newPaths.length === 0) {
      this.walls.delete(key);
      return { ok: false, reason: "Path blocked" };
    }

    this.paths = newPaths;
    this.scrap -= CONFIG.towerCost;
    this.towers.push(new Tower(snapPos));
    audio.playBuild();

    // Recompute paths for crawling enemies
    for (const e of this.enemies) {
      if (e.type === "crawling") {
        e.recomputePath();
      }
    }

    this.ui(this);
    this.draw();
    return { ok: true };
  }

  placeWall(pos) {
    if (this.state === "over") return { ok: false, reason: "Game over" };
    if (this.isPaused) return { ok: false, reason: "Game paused" };
    if (this.scrap < CONFIG.wallCost)
      return { ok: false, reason: "Need more scrap" };

    const cell = this.cellFromPoint(pos);
    const cols = Math.floor(CONFIG.width / CONFIG.gridSize);
    const rows = Math.floor(CONFIG.height / CONFIG.gridSize);
    if (cell.cx < 0 || cell.cy < 0 || cell.cx >= cols || cell.cy >= rows)
      return { ok: false, reason: "Out of bounds" };
    const key = `${cell.cx},${cell.cy}`;
    if (this.walls.has(key)) return { ok: false, reason: "Wall already here" };

    for (const t of this.towers) {
      const tCell = this.cellFromPoint(t.pos);
      if (tCell.cx === cell.cx && tCell.cy === cell.cy)
        return { ok: false, reason: "Tower already here" };
    }

    const startCell = this.cellFromPoint(CONFIG.start);
    const goalCell = this.cellFromPoint(CONFIG.goal);
    if (
      (cell.cx === startCell.cx && cell.cy === startCell.cy) ||
      (cell.cx === goalCell.cx && cell.cy === goalCell.cy)
    ) {
      return { ok: false, reason: "Can't block start or base" };
    }

    // Tentatively add wall and recompute path.
    this.walls.add(key);
    this.wallList.push(cell);
    const newPaths = this.computeAllPaths();
    if (!newPaths || newPaths.length === 0) {
      this.walls.delete(key);
      this.wallList.pop();
      return { ok: false, reason: "Path blocked" };
    }

    this.paths = newPaths;
    this.scrap -= CONFIG.wallCost;
    audio.playBuild();

    // Recompute paths for crawling enemies
    for (const e of this.enemies) {
      if (e.type === "crawling") {
        e.recomputePath();
      }
    }

    this.ui(this);
    this.draw();
    return { ok: true };
  }

  placeTrap(pos) {
    if (this.state === "over") return { ok: false, reason: "Game over" };
    if (this.isPaused) return { ok: false, reason: "Game paused" };
    if (this.scrap < CONFIG.trapCost)
      return { ok: false, reason: "Need more scrap" };

    const cell = this.cellFromPoint(pos);
    const key = `${cell.cx},${cell.cy}`;
    if (this.walls.has(key)) return { ok: false, reason: "Cell blocked" };
    for (const t of this.towers) {
      const tCell = this.cellFromPoint(t.pos);
      if (tCell.cx === cell.cx && tCell.cy === cell.cy)
        return { ok: false, reason: "Tower here" };
    }

    const snapPos = this.pointFromCell(cell);
    this.traps.push({
      pos: snapPos,
      used: false,
      radius: 26,
      damage: 38,
      slow: 0.55,
      slowTime: 2.5,
    });
    this.scrap -= CONFIG.trapCost;
    audio.playBuild();
    this.ui(this);
    this.draw();
    return { ok: true };
  }

  upgradeAt(pos) {
    if (this.state === "over") return { ok: false, reason: "Game over" };
    if (this.isPaused) return { ok: false, reason: "Game paused" };
    const tower = this.findTowerAt(pos);
    if (!tower) return { ok: false, reason: "No tower here" };
    if (this.scrap < CONFIG.upgradeCost)
      return { ok: false, reason: "Need more scrap" };
    if (tower.level >= 3) return { ok: false, reason: "Max level" };
    tower.level += 1;
    tower.range += 18;
    tower.fireRate = Math.max(0.22, tower.fireRate * 0.88);
    tower.damage += 8;
    this.scrap -= CONFIG.upgradeCost;
    audio.playUpgrade();
    this.ui(this);
    this.draw();
    return { ok: true };
  }

  sellAt(pos) {
    if (this.state === "over") return { ok: false, reason: "Game over" };
    if (this.isPaused) return { ok: false, reason: "Game paused" };
    const tower = this.findTowerAt(pos);
    if (tower) {
      const refund = Math.round(
        CONFIG.towerCost * tower.level * CONFIG.refundRate
      );
      this.scrap += refund;
      this.towers = this.towers.filter((t) => t !== tower);
      const cell = this.cellFromPoint(tower.pos);
      const key = `${cell.cx},${cell.cy}`;
      if (this.walls.has(key)) {
        this.walls.delete(key);
        this.paths = this.computeAllPaths() || this.paths;
      }
      audio.playSell();
      this.ui(this);
      this.draw();
      return { ok: true };
    }

    const cell = this.cellFromPoint(pos);
    const key = `${cell.cx},${cell.cy}`;
    if (this.walls.has(key)) {
      this.walls.delete(key);
      this.wallList = this.wallList.filter(
        (w) => !(w.cx === cell.cx && w.cy === cell.cy)
      );
      const refund = Math.round(CONFIG.wallCost * CONFIG.refundRate);
      this.scrap += refund;
      this.paths = this.computeAllPaths() || this.paths;
      this.ui(this);
      this.draw();
      return { ok: true };
    }

    return { ok: false, reason: "Nothing to sell" };
  }

  loop(time) {
    if (this.state !== "running") return;
    if (this.isPaused) {
      this.draw();
      requestAnimationFrame(this.loop);
      return;
    }
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.update(dt);
    this.draw();
    requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.spawnTimer += dt;
    if (this.spawnQueue > 0 && this.spawnTimer >= CONFIG.waveSpawnInterval) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    for (const e of this.enemies) e.update(dt);
    for (const t of this.towers) t.update(dt, this.enemies, this.bullets);
    for (const b of this.bullets) b.update(dt);

    this.updateTraps(dt);

    this.handleCollisions();
    this.cleanup();

    const missionData = CONFIG.missions[this.mission];
    const missionComplete =
      this.enemies.length === 0 &&
      this.spawnQueue === 0 &&
      this.wave >= missionData.maxWaves;

    if (missionComplete) {
      this.state = "victory";
    } else if (this.enemies.length === 0 && this.spawnQueue === 0) {
      // Wave cleared - play celebration sounds
      audio.playWaveClear();
      this.wave += 1;
      audio.playWaveComplete(this.wave);
      audio.onWaveComplete(); // Check if retro song should stop
      // Play a different retro song - every 2 waves early game, every wave after wave 10
      const changeFrequency = this.wave > 10 ? 1 : 2;
      if (this.wave === 2 || this.wave % changeFrequency === 0) {
        const songChoice = Math.floor((this.wave - 2) / 2) % 12;
        if (songChoice === 0) {
          audio.playRetroSong();
        } else if (songChoice === 1) {
          audio.playRetroSong2();
        } else if (songChoice === 2) {
          audio.playRetroSong3();
        } else if (songChoice === 3) {
          audio.playRetroSong4();
        } else if (songChoice === 4) {
          audio.playRetroSong5();
        } else if (songChoice === 5) {
          audio.playRetroSong6();
        } else if (songChoice === 6) {
          audio.playRetroSong7();
        } else if (songChoice === 7) {
          audio.playRetroSong8();
        } else if (songChoice === 8) {
          audio.playRetroSong9();
        } else if (songChoice === 9) {
          audio.playRetroSong10();
        } else if (songChoice === 10) {
          audio.playRetroSong11();
        } else {
          audio.playRetroSong12();
        }
      }
      this.waveTotal = this.spawnQueue = this.waveSize();
    }

    if (this.hp <= 0) {
      this.state = "over";
    }

    this.ui(this);
  }

  updateTraps(dt) {
    this.traps = this.traps.filter((trap) => !trap.used);
    for (const trap of this.traps) {
      for (const e of this.enemies) {
        if (e.dead) continue;
        const d = Math.hypot(e.pos.x - trap.pos.x, e.pos.y - trap.pos.y);
        if (d <= trap.radius) {
          e.hp -= trap.damage;
          e.applySlow(trap.slow, trap.slowTime);
          trap.used = true;
          audio.playTrap();
          break;
        }
      }
    }
  }

  spawnEnemy() {
    // Determine which insect types are available based on current wave
    const availableTypes = [];
    for (const [key, data] of Object.entries(CONFIG.insectTypes)) {
      if (this.wave >= data.unlockWave) {
        availableTypes.push(key);
      }
    }

    // Choose random insect type from available ones
    const insectClass =
      availableTypes[Math.floor(Math.random() * availableTypes.length)] ||
      "ant";

    const enemy = new Enemy(
      CONFIG.start,
      CONFIG.goal,
      this.wave,
      CONFIG,
      this.difficulty,
      insectClass,
      this
    );
    this.enemies.push(enemy);
    // Assign a diverse path to crawling enemies
    if (enemy.type === "crawling" && this.paths && this.paths.length) {
      const idx = Math.floor(Math.random() * this.paths.length);
      const basePath = this.paths[idx];
      enemy.path = this.jitterPath(basePath, 2.5);
      enemy.pathIndex = 0;
    }
    this.spawnQueue -= 1;
  }

  handleCollisions() {
    // Damage is applied inside Bullet.update; handle base contact here.
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.reachedBase()) {
        e.dead = true;
        e.reward = 0;
        this.hp = Math.max(0, this.hp - e.damage);
        audio.playBaseHit();
      }
    }
  }

  cleanup() {
    let earned = 0;
    this.enemies = this.enemies.filter((e) => {
      if (e.dead) {
        earned += e.reward;
        return false;
      }
      return true;
    });
    if (earned > 0) this.scrap += earned;
    this.bullets = this.bullets.filter((b) => !b.dead);
  }

  setCursor(pos) {
    this.cursorPos = pos;
  }

  clearCursor() {
    this.cursorPos = null;
  }

  isBuildable(pos) {
    if (!pos) return false;
    const cell = this.cellFromPoint(pos);
    const key = `${cell.cx},${cell.cy}`;
    if (this.walls.has(key)) return false;
    for (const t of this.towers) {
      const tCell = this.cellFromPoint(t.pos);
      if (tCell.cx === cell.cx && tCell.cy === cell.cy) return false;
    }
    return true;
  }

  findTowerAt(pos) {
    const cell = this.cellFromPoint(pos);
    return this.towers.find((t) => {
      const c = this.cellFromPoint(t.pos);
      return c.cx === cell.cx && c.cy === cell.cy;
    });
  }

  distanceToPath(pos, paths = null) {
    const list = Array.isArray(paths) ? paths : this.paths || [];
    let min = Infinity;
    for (const path of list) {
      for (let i = 0; i < path.length - 1; i += 1) {
        const a = path[i];
        const b = path[i + 1];
        const d = pointToSegmentDistance(pos, a, b);
        if (d < min) min = d;
      }
    }
    return min;
  }

  waveProgress() {
    if (this.waveTotal === 0) return 0;
    const remaining = this.spawnQueue + this.enemies.length;
    const done = Math.max(0, this.waveTotal - remaining);
    return Math.min(1, done / this.waveTotal);
  }

  recomputePath() {
    // Legacy support - use first spawn point
    return this.computePath(CONFIG.start, CONFIG.goal);
  }

  buildPath(came, current, keyFn) {
    const cells = [];
    let ck = keyFn(current);
    while (came.has(ck)) {
      const [cx, cy] = ck.split(",").map(Number);
      cells.push({ cx, cy });
      ck = came.get(ck);
    }
    const [startCx, startCy] = ck.split(",").map(Number);
    cells.push({ cx: startCx, cy: startCy });
    cells.reverse();
    return cells.map((c) => this.pointFromCell(c));
  }

  manhattan(a, b) {
    return Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy);
  }

  syncEnemiesToPaths() {
    for (const e of this.enemies) {
      const pathIndex = Math.floor(Math.random() * this.paths.length);
      e.path = this.paths[pathIndex];
      e.index = 0;
    }
  }

  computeAllPaths() {
    // Find multiple alternative routes from start to goal using random detours
    const paths = [];
    const mainPath = this.computePath(CONFIG.start, CONFIG.goal);
    if (!mainPath) return null;
    paths.push(mainPath);

    // Try to add up to 3 detour paths
    const maxDetours = 3;
    let attempts = 0;
    while (paths.length < 1 + maxDetours && attempts < 40) {
      attempts += 1;
      const detourCell = this.getRandomOpenCell();
      if (!detourCell) break;
      const detourPoint = this.pointFromCell(detourCell);
      // Prefer detours sufficiently far from the main path for diversity
      if (this.distanceToPath(detourPoint, paths) < 40) continue;
      const p1 = this.computePath(CONFIG.start, detourPoint);
      const p2 = this.computePath(detourPoint, CONFIG.goal);
      if (!p1 || !p2) continue;
      const detourPath = p1.concat(p2);
      // Avoid near-duplicates by simple length check and rough diversity
      const lenMain = mainPath.length;
      const lenDetour = detourPath.length;
      if (lenDetour > lenMain * 1.8) continue; // Skip excessively long detours
      // Check uniqueness by average distance to existing paths
      let similar = false;
      for (const existing of paths) {
        const a = existing[Math.floor(existing.length / 2)] || existing[0];
        const b =
          detourPath[Math.floor(detourPath.length / 2)] || detourPath[0];
        if (Math.hypot(a.x - b.x, a.y - b.y) < 30) {
          similar = true;
          break;
        }
      }
      if (similar) continue;
      paths.push(detourPath);
    }
    return paths;
  }

  getRandomOpenCell() {
    const cols = Math.floor(CONFIG.width / CONFIG.gridSize);
    const rows = Math.floor(CONFIG.height / CONFIG.gridSize);
    const startCell = this.cellFromPoint(CONFIG.start);
    const goalCell = this.cellFromPoint(CONFIG.goal);
    for (let i = 0; i < 50; i++) {
      const cx = Math.floor(Math.random() * cols);
      const cy = Math.floor(Math.random() * rows);
      const key = `${cx},${cy}`;
      if (this.walls.has(key)) continue;
      if (
        (cx === startCell.cx && cy === startCell.cy) ||
        (cx === goalCell.cx && cy === goalCell.cy)
      )
        continue;
      return { cx, cy };
    }
    return null;
  }

  computePath(start, goal) {
    const cols = Math.floor(CONFIG.width / CONFIG.gridSize);
    const rows = Math.floor(CONFIG.height / CONFIG.gridSize);
    const startCell = this.cellFromPoint(start);
    const goalCell = this.cellFromPoint(goal);

    const blocked = this.walls;
    const key = (c) => `${c.cx},${c.cy}`;

    const open = [];
    const gScore = new Map();
    const fScore = new Map();
    const came = new Map();

    const startKey = key(startCell);
    gScore.set(startKey, 0);
    fScore.set(startKey, this.manhattan(startCell, goalCell));
    open.push({ ...startCell, f: fScore.get(startKey) });

    const inBounds = (c) =>
      c.cx >= 0 && c.cx < cols && c.cy >= 0 && c.cy < rows;
    const neighbors = (c) => [
      { cx: c.cx + 1, cy: c.cy },
      { cx: c.cx - 1, cy: c.cy },
      { cx: c.cx, cy: c.cy + 1 },
      { cx: c.cx, cy: c.cy - 1 },
    ];

    while (open.length) {
      open.sort((a, b) => a.f - b.f);
      const current = open.shift();
      const currentKey = key(current);
      if (current.cx === goalCell.cx && current.cy === goalCell.cy) {
        return this.buildPath(came, current, key);
      }

      const neigh = neighbors(current);
      for (let i = neigh.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = neigh[i];
        neigh[i] = neigh[j];
        neigh[j] = tmp;
      }
      for (const n of neigh) {
        const nk = key(n);
        if (!inBounds(n) || blocked.has(nk)) continue;
        const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;
        if (tentativeG < (gScore.get(nk) ?? Infinity)) {
          came.set(nk, currentKey);
          gScore.set(nk, tentativeG);
          const noise = Math.random() * 0.05; // small randomness to break ties
          fScore.set(nk, tentativeG + this.manhattan(n, goalCell) + noise);
          if (!open.find((o) => o.cx === n.cx && o.cy === n.cy)) {
            open.push({ ...n, f: fScore.get(nk) });
          }
        }
      }
    }

    return null;
  }

  jitterPath(path, amount = 2) {
    if (!path || path.length === 0) return path;
    const jittered = new Array(path.length);
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      if (i === 0 || i === path.length - 1) {
        jittered[i] = { x: p.x, y: p.y };
        continue;
      }
      const jx = (Math.random() * 2 - 1) * amount;
      const jy = (Math.random() * 2 - 1) * amount;
      const nx = p.x + jx;
      const ny = p.y + jy;
      const cell = this.cellFromPoint({ x: nx, y: ny });
      const key = `${cell.cx},${cell.cy}`;
      if (this.walls.has(key)) {
        jittered[i] = { x: p.x, y: p.y };
      } else {
        jittered[i] = { x: nx, y: ny };
      }
    }
    return jittered;
  }

  createInitialWalls() {
    const cols = Math.floor(CONFIG.width / CONFIG.gridSize);
    const rows = Math.floor(CONFIG.height / CONFIG.gridSize);
    // Border walls (top, bottom, left, right)
    for (let cx = 0; cx < cols; cx++) {
      this.addWallCell(cx, 0);
      this.addWallCell(cx, rows - 1);
    }
    for (let cy = 0; cy < rows; cy++) {
      this.addWallCell(0, cy);
      this.addWallCell(cols - 1, cy);
    }
    // Add internal walls to create corridor-like layout.
    for (let cy = 2; cy < 8; cy++) this.addWallCell(8, cy);
    for (let cy = 10; cy < 16; cy++) this.addWallCell(8, cy);
  }

  addWallCell(cx, cy) {
    const key = `${cx},${cy}`;
    if (!this.walls.has(key)) {
      this.walls.add(key);
      this.wallList.push({ cx, cy });
    }
  }

  draw() {
    const { ctx } = this;
    ctx.clearRect(0, 0, CONFIG.width, CONFIG.height);
    this.drawGrid();
    this.drawPath();
    this.drawWalls();
    this.drawEntities();
    this.drawCursor();
    if (this.state === "over") this.drawGameOver();
  }

  drawGrid() {
    const { ctx } = this;
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < CONFIG.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CONFIG.height);
      ctx.stroke();
    }
    for (let y = 0; y < CONFIG.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CONFIG.width, y);
      ctx.stroke();
    }
  }

  drawPath() {
    const { ctx } = this;
    ctx.strokeStyle = "#23324a";
    ctx.lineWidth = 22;
    ctx.lineJoin = "round";

    // Draw all paths
    for (const path of this.paths) {
      ctx.beginPath();
      const [head, ...rest] = path;
      ctx.moveTo(head.x, head.y);
      for (const p of rest) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    // Tint the walkable lanes lightly
    ctx.fillStyle = "rgba(255,255,200,0.06)";
    ctx.lineWidth = 20;
    for (const path of this.paths) {
      ctx.beginPath();
      const [head, ...rest] = path;
      ctx.moveTo(head.x, head.y);
      for (const p of rest) ctx.lineTo(p.x, p.y);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    // Start / goal markers with arrows
    this.drawMarker(CONFIG.start, "A", "#2dd4bf");
    this.drawMarker(CONFIG.goal, "B", "#ff8c42");
    this.drawArrows();
  }

  drawArrows() {
    const { ctx } = this;
    const arrowSize = 16;
    const startPos = CONFIG.start;
    const goalPos = CONFIG.goal;

    // Arrow pointing outward from spawn
    ctx.fillStyle = "#2dd4bf";
    ctx.save();
    ctx.translate(startPos.x - 25, startPos.y);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-arrowSize, -arrowSize / 2);
    ctx.lineTo(-arrowSize, arrowSize / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Arrow pointing toward goal
    ctx.fillStyle = "#ff8c42";
    ctx.save();
    ctx.translate(goalPos.x + 25, goalPos.y);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(arrowSize, -arrowSize / 2);
    ctx.lineTo(arrowSize, arrowSize / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawMarker(pos, label, color) {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0b111a";
    ctx.font = "bold 12px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, pos.x, pos.y);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  drawEntities() {
    const { ctx } = this;
    // Towers - staple gun style
    for (const t of this.towers) {
      ctx.save();
      ctx.translate(t.pos.x, t.pos.y);
      const baseColor = this.hp <= 4 ? "#ffb703" : "#ff8c42";
      const baseSize = 22;
      const half = baseSize / 2;

      // Platform shadow
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(2, 5, baseSize * 0.7, baseSize * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Base block
      const baseGrad = ctx.createLinearGradient(-half, -half, half, half);
      baseGrad.addColorStop(0, baseColor);
      baseGrad.addColorStop(1, "#ffd8a0");
      ctx.fillStyle = baseGrad;
      ctx.fillRect(-half, -half, baseSize, baseSize);
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(-half + 0.5, -half + 0.5, baseSize - 1, baseSize - 1);

      // Vent lines
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(-half + 4, -half + 4, baseSize - 8, 3);
      ctx.fillRect(-half + 4, -half + 10, baseSize - 8, 3);

      // Top ring
      ctx.fillStyle = "#111926";
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.stroke();

      // Barrel (rotates toward target)
      ctx.save();
      ctx.rotate((t.angle ?? -Math.PI / 2) + Math.PI / 2);
      const barrelWidth = 8;
      const barrelLength = 18;
      ctx.fillStyle = "#323b4d";
      ctx.fillRect(
        -barrelWidth / 2,
        -13 - barrelLength,
        barrelWidth,
        barrelLength
      );
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(
        -barrelWidth / 2 + 0.5,
        -13 - barrelLength + 0.5,
        barrelWidth - 1,
        barrelLength - 1
      );
      ctx.fillStyle = "#c6d0dc";
      ctx.fillRect(-barrelWidth / 2, -13 - barrelLength - 4, barrelWidth, 6);

      // Sight highlight
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath();
      ctx.arc(0, -8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Range indicator
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, t.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Enemies - bug/insect style
    for (const e of this.enemies) {
      ctx.save();
      ctx.translate(e.pos.x, e.pos.y);

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(3, 5, e.radius * 0.9, e.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wings for flying insects
      if (e.type === "flying") {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = "#dfe7f5";
        ctx.beginPath();
        ctx.ellipse(
          -6,
          -5,
          e.radius,
          e.radius * 0.45,
          -Math.PI / 6,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(
          -6,
          5,
          e.radius,
          e.radius * 0.45,
          Math.PI / 6,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Body
      const bodyGrad = ctx.createLinearGradient(
        -e.radius,
        -e.radius,
        e.radius,
        e.radius
      );
      bodyGrad.addColorStop(0, e.color);
      bodyGrad.addColorStop(1, "rgba(255,255,255,0.2)");
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, e.radius, e.radius * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.38)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Stripes
      ctx.strokeStyle = "rgba(0,0,0,0.28)";
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * e.radius * 0.25, -e.radius * 0.7);
        ctx.lineTo(i * e.radius * 0.25, e.radius * 0.7);
        ctx.stroke();
      }

      // Head
      ctx.fillStyle = e.headColor;
      ctx.beginPath();
      ctx.ellipse(
        -e.radius * 0.75,
        0,
        e.radius * 0.55,
        e.radius * 0.55,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Antennae
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-e.radius * 1.15, -e.radius * 0.25);
      ctx.quadraticCurveTo(
        -e.radius * 1.1,
        -e.radius * 0.9,
        -e.radius * 0.35,
        -e.radius * 1.1
      );
      ctx.moveTo(-e.radius * 1.15, e.radius * 0.25);
      ctx.quadraticCurveTo(
        -e.radius * 1.1,
        e.radius * 0.9,
        -e.radius * 0.35,
        e.radius * 1.1
      );
      ctx.stroke();

      // Eyes
      ctx.fillStyle = "#ff5c8a";
      ctx.beginPath();
      ctx.arc(-e.radius * 0.9, -e.radius * 0.2, 2.4, 0, Math.PI * 2);
      ctx.arc(-e.radius * 0.9, e.radius * 0.2, 2.4, 0, Math.PI * 2);
      ctx.fill();

      // HP bar
      const hpPct = Math.max(0, e.hp) / e.maxHp;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(-14, -e.radius - 16, 28, 6);
      ctx.fillStyle =
        hpPct > 0.5 ? "#2dd4bf" : hpPct > 0.25 ? "#ffb703" : "#ff4d6d";
      ctx.fillRect(-13, -e.radius - 15, 26 * hpPct, 4);

      ctx.restore();
    }

    // Bullets - staple style
    for (const b of this.bullets) {
      ctx.fillStyle = "#c0c0c0";
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 1;
      // Staple shape
      ctx.fillRect(b.pos.x - 6, b.pos.y - 1, 12, 2);
      ctx.fillRect(b.pos.x - 6, b.pos.y - 4, 2, 6);
      ctx.fillRect(b.pos.x + 4, b.pos.y - 4, 2, 6);
      ctx.strokeRect(b.pos.x - 6, b.pos.y - 1, 12, 2);
    }

    // Traps
    for (const trap of this.traps) {
      ctx.save();
      ctx.translate(trap.pos.x, trap.pos.y);
      ctx.globalAlpha = trap.used ? 0.25 : 0.9;
      ctx.fillStyle = "#23324a";
      ctx.strokeStyle = "#2dd4bf";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(45,212,191,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, trap.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawWalls() {
    const { ctx } = this;
    for (const cell of this.wallList) {
      const pad = -2;
      const size = CONFIG.gridSize - pad * 2;
      const x = cell.cx * CONFIG.gridSize + pad;
      const y = cell.cy * CONFIG.gridSize + pad;

      ctx.save();
      ctx.translate(x, y);

      const baseGrad = ctx.createLinearGradient(0, 0, size, size);
      baseGrad.addColorStop(0, "#6b5a3f");
      baseGrad.addColorStop(1, "#8c7955");
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, size, size);

      // Top lip and shadows
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(0, 0, size, 5);
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(size - 5, 0, 5, size);
      ctx.fillRect(0, size - 5, size, 5);

      // Outline
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(0.5, 0.5, size - 1, size - 1);

      // Rivets
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      const rivetPositions = [
        [5, 5],
        [size / 2 - 2, size / 2 - 2],
        [size - 9, size - 9],
      ];
      for (const [rx, ry] of rivetPositions) {
        ctx.fillRect(rx, ry, 3, 3);
      }

      ctx.restore();
    }
  }

  drawCursor() {
    if (!this.cursorPos || this.state === "over" || !this.buildMode) return;
    const { ctx } = this;
    const valid = this.isBuildable(this.cursorPos);
    ctx.fillStyle = valid ? "rgba(45,212,191,0.18)" : "rgba(255,77,109,0.14)";
    ctx.strokeStyle = valid ? "#2dd4bf" : "#ff4d6d";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.cursorPos.x, this.cursorPos.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(
      this.cursorPos.x,
      this.cursorPos.y,
      CONFIG.towerRange,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawGameOver() {
    const { ctx } = this;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
    ctx.fillStyle = "#e9eef5";
    ctx.textAlign = "center";
    ctx.font = "32px Manrope, sans-serif";
    ctx.fillText("Base overrun", CONFIG.width / 2, CONFIG.height / 2 - 10);
    ctx.font = "18px Manrope, sans-serif";
    ctx.fillText(
      "Press Restart to try again",
      CONFIG.width / 2,
      CONFIG.height / 2 + 18
    );
    ctx.textAlign = "left";
  }
}

function pointToSegmentDistance(p, a, b) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const wx = p.x - a.x;
  const wy = p.y - a.y;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return Math.hypot(p.x - b.x, p.y - b.y);
  const t = c1 / c2;
  const projx = a.x + t * vx;
  const projy = a.y + t * vy;
  return Math.hypot(p.x - projx, p.y - projy);
}
