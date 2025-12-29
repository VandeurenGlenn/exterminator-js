// DOM element references
export const dom = {
  canvas: document.getElementById("game"),
  waveEl: document.getElementById("wave"),
  scrapEl: document.getElementById("scrap"),
  hpEl: document.getElementById("hp"),
  hpBar: document.getElementById("hp-bar"),
  waveBar: document.getElementById("wave-bar"),
  startBtn: document.getElementById("start"),
  restartBtn: document.getElementById("restart"),
  pauseBtn: document.getElementById("pause"),
  toastEl: document.getElementById("toast"),
  startScreen: document.getElementById("start-screen"),
  beginBtn: document.getElementById("begin-game"),
  selectTurretBtn: document.getElementById("select-turret"),
  selectSniperBtn: document.getElementById("select-sniper"),
  selectWallBtn: document.getElementById("select-wall"),
  selectTrapBtn: document.getElementById("select-trap"),
  selectUpgradeBtn: document.getElementById("select-upgrade"),
  selectUpgradeDamageBtn: document.getElementById("select-upgrade-damage"),
  selectUpgradeSpeedBtn: document.getElementById("select-upgrade-speed"),
  selectSellBtn: document.getElementById("select-sell"),
  soundVolumeInput: document.getElementById("sound-volume"),
  soundVolumeLabel: document.getElementById("sound-volume-label"),
  tabButtons: Array.from(document.querySelectorAll(".build-tab")),
  tabPanels: Array.from(document.querySelectorAll(".build-list")),
  get pauseOverlay() {
    return document.getElementById("pause-overlay");
  },
};

export function updateStats(state) {
  dom.waveEl.textContent = state.wave;
  dom.scrapEl.textContent = state.scrap;
  dom.hpEl.textContent = state.hp;
  dom.hpBar.style.width = `${
    Math.max(0, Math.min(1, state.hp / state.maxHP || 1)) * 100
  }%`;
  dom.waveBar.style.width = `${state.waveProgress() * 100}%`;
}

export function updateButtonStates(state) {
  const isRunning = state.state === "running" && !state.isPaused;
  dom.startBtn.style.display = isRunning ? "none" : "flex";
  dom.pauseBtn.style.display = isRunning ? "flex" : "none";

  // Show pause overlay when paused
  const isPaused = state.state === "running" && state.isPaused;
  if (dom.pauseOverlay) {
    dom.pauseOverlay.style.display = isPaused ? "flex" : "none";
  }
}

export function setTabActive(tab) {
  dom.tabButtons.forEach((b) => {
    const isActive = b.dataset.tab === tab;
    b.classList.toggle("active", isActive);
    b.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  dom.tabPanels.forEach((panel) => {
    const show = panel.dataset.tabPanel === tab;
    panel.hidden = !show;
  });
}

export function setBuildButtonActive(mode) {
  const isTurret = mode === "turret";
  const isSniper = mode === "sniper";
  const isWall = mode === "wall";
  dom.selectTurretBtn?.classList.toggle("active", isTurret);
  dom.selectSniperBtn?.classList.toggle("active", isSniper);
  dom.selectWallBtn?.classList.toggle("active", isWall);
  dom.selectTrapBtn?.classList.toggle("active", mode === "trap");
  dom.selectUpgradeBtn?.classList.toggle(
    "active",
    mode === "upgrade" || mode === "upgrade-damage" || mode === "upgrade-speed"
  );
  dom.selectUpgradeDamageBtn?.classList.toggle(
    "active",
    mode === "upgrade-damage"
  );
  dom.selectUpgradeSpeedBtn?.classList.toggle(
    "active",
    mode === "upgrade-speed"
  );
  dom.selectSellBtn?.classList.toggle("active", mode === "sell");
}

export function setDifficultyButtonActive(difficulty) {
  document
    .querySelectorAll(".start-screen [data-difficulty]")
    .forEach((b) =>
      b.classList.toggle("active", b.dataset.difficulty === difficulty)
    );
}

export function setMissionButtonActive(mission) {
  document
    .querySelectorAll(".start-screen [data-mission]")
    .forEach((b) =>
      b.classList.toggle("active", b.dataset.mission === mission)
    );
}
