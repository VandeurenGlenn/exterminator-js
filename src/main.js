import { Game } from "./game.js";

const canvas = document.getElementById("game");
const waveEl = document.getElementById("wave");
const scrapEl = document.getElementById("scrap");
const hpEl = document.getElementById("hp");
const hpBar = document.getElementById("hp-bar");
const waveBar = document.getElementById("wave-bar");
const startBtn = document.getElementById("start");
const restartBtn = document.getElementById("restart");
const wallBtn = document.getElementById("wall-mode");
const stateEl = document.getElementById("state");
const modeEl = document.getElementById("mode");
const toastEl = document.getElementById("toast");
const startScreen = document.getElementById("start-screen");
const beginBtn = document.getElementById("begin-game");
const selectTurretBtn = document.getElementById("select-turret");
const selectWallBtn = document.getElementById("select-wall");
const selectTrapBtn = document.getElementById("select-trap");
const selectUpgradeBtn = document.getElementById("select-upgrade");
const selectSellBtn = document.getElementById("select-sell");
const tabButtons = Array.from(document.querySelectorAll(".build-tab"));
const tabPanels = Array.from(document.querySelectorAll(".build-list"));

let wallMode = false;
let currentMode = "turret";
let currentTab = "build";

const game = new Game(canvas, updateUI);
game.draw();
setBuildMode("turret");
setActiveTab("build", false);

let selectedDifficulty = "easy";
let selectedMission = "1";

startBtn.addEventListener("click", () => game.start());
restartBtn.addEventListener("click", () => game.restart());
wallBtn.addEventListener("click", toggleWallMode);
selectTurretBtn?.addEventListener("click", () => setBuildMode("turret"));
selectWallBtn?.addEventListener("click", () => setBuildMode("wall"));
selectTrapBtn?.addEventListener("click", () => setBuildMode("trap"));
selectUpgradeBtn?.addEventListener("click", () => setBuildMode("upgrade"));
selectSellBtn?.addEventListener("click", () => setBuildMode("sell"));

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    setActiveTab(tab);
    if (tab === "build")
      setBuildMode(currentMode === "wall" ? "wall" : "turret");
    else if (tab === "trap") setBuildMode("trap");
    else if (tab === "upgrade")
      setBuildMode(currentMode === "sell" ? "sell" : "upgrade");
  });
});

// Keyboard shortcuts: 1 Turret, 2 Wall, 3 Trap, 4 Upgrade, 5 Sell, W toggle, Space start, R restart
document.addEventListener("keydown", (ev) => {
  // Avoid interfering with typing in form elements
  const tag = (ev.target && ev.target.tagName) || "";
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  switch (ev.key) {
    case "1":
      setBuildMode("turret");
      break;
    case "2":
      setBuildMode("wall");
      break;
    case "3":
      setBuildMode("trap");
      break;
    case "4":
      setBuildMode("upgrade");
      break;
    case "5":
      setBuildMode("sell");
      break;
    case "w":
    case "W":
      toggleWallMode();
      break;
    case " ":
      ev.preventDefault();
      startBtn.click();
      break;
    case "r":
    case "R":
      restartBtn.click();
      break;
    default:
      break;
  }
});

// Start screen - difficulty selector
document.querySelectorAll(".start-screen [data-difficulty]").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedDifficulty = btn.dataset.difficulty;
    document
      .querySelectorAll(".start-screen [data-difficulty]")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// Start screen - mission selector
document.querySelectorAll(".start-screen [data-mission]").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedMission = btn.dataset.mission;
    document
      .querySelectorAll(".start-screen [data-mission]")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// Start screen - begin button
beginBtn.addEventListener("click", () => {
  game.setDifficulty(selectedDifficulty);
  game.setMission(selectedMission);
  startScreen.classList.add("hidden");
});

// In-game difficulty selector (side panel)
document.querySelectorAll(".difficulty-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const difficulty = btn.dataset.difficulty;
    game.setDifficulty(difficulty);
    document
      .querySelectorAll(".difficulty-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

canvas.addEventListener("click", (ev) => {
  const pos = canvasPoint(ev, canvas);
  let result = { ok: true };
  switch (currentMode) {
    case "turret":
      result = game.placeTower(pos);
      break;
    case "wall":
      result = game.placeWall(pos);
      break;
    case "trap":
      result = game.placeTrap(pos);
      break;
    case "upgrade":
      result = game.upgradeAt(pos);
      break;
    case "sell":
      result = game.sellAt(pos);
      break;
    default:
      result = game.placeTower(pos);
      break;
  }
  if (!result.ok) showToast(result.reason);
});

canvas.addEventListener("mousemove", (ev) => {
  const pos = canvasPoint(ev, canvas);
  game.setCursor(pos);
});

canvas.addEventListener("mouseleave", () => game.clearCursor());

function updateUI(state) {
  waveEl.textContent = state.wave;
  scrapEl.textContent = state.scrap;
  hpEl.textContent = state.hp;
  hpBar.style.width = `${
    Math.max(0, Math.min(1, state.hp / state.maxHP || 1)) * 100
  }%`;
  waveBar.style.width = `${state.waveProgress() * 100}%`;
  setStateBadge(state.state);
}

function setStateBadge(gameState) {
  stateEl.textContent =
    gameState === "running"
      ? "Live"
      : gameState === "victory"
      ? "Victory"
      : gameState === "over"
      ? "Overrun"
      : "Idle";
  stateEl.classList.toggle("pill-running", gameState === "running");
  stateEl.classList.toggle("pill-victory", gameState === "victory");
  stateEl.classList.toggle("pill-over", gameState === "over");
}

function toggleWallMode() {
  const nextMode = currentMode === "wall" ? "turret" : "wall";
  setBuildMode(nextMode);
}

function setBuildMode(mode) {
  currentMode = mode;
  wallMode = mode === "wall";
  const isTurret = mode === "turret";
  const isWall = mode === "wall";
  selectTurretBtn?.classList.toggle("active", isTurret);
  selectWallBtn?.classList.toggle("active", isWall);
  selectTrapBtn?.classList.toggle("active", mode === "trap");
  selectUpgradeBtn?.classList.toggle("active", mode === "upgrade");
  selectSellBtn?.classList.toggle("active", mode === "sell");
  wallBtn.classList.toggle("is-active", isWall);
  wallBtn.textContent = isWall ? "Wall Mode: ON" : "Wall Mode";
  if (modeEl)
    modeEl.textContent =
      mode === "trap"
        ? "Trap"
        : mode === "upgrade"
        ? "Upgrade"
        : mode === "sell"
        ? "Sell"
        : isWall
        ? "Wall"
        : "Turret";

  const targetTab =
    mode === "trap" ? "trap" : mode === "upgrade" ? "upgrade" : "build";
  if (targetTab !== currentTab) {
    setActiveTab(targetTab, false);
  }
}

function setActiveTab(tab, adjustMode = true) {
  currentTab = tab;
  tabButtons.forEach((b) => {
    const isActive = b.dataset.tab === tab;
    b.classList.toggle("active", isActive);
    b.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  tabPanels.forEach((panel) => {
    const show = panel.dataset.tabPanel === tab;
    panel.hidden = !show;
  });

  if (adjustMode) {
    if (tab === "build")
      setBuildMode(currentMode === "wall" ? "wall" : "turret");
    else if (tab === "trap") setBuildMode("trap");
    else if (tab === "upgrade") setBuildMode("upgrade");
  }
}

function canvasPoint(event, canvasEl) {
  const rect = canvasEl.getBoundingClientRect();
  const scaleX = canvasEl.width / rect.width;
  const scaleY = canvasEl.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function showToast(message) {
  if (!message) return;
  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 1200);
}
