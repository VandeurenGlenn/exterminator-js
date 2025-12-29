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
  get victoryOverlay() {
    return document.getElementById("victory-overlay");
  },
  victoryTitle: document.getElementById("victory-title"),
  victoryDetail: document.getElementById("victory-detail"),
  victoryMenuBtn: document.getElementById("victory-menu"),
  victoryNextBtn: document.getElementById("victory-next"),
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
  const isVictory = state.state === "victory";
  dom.startBtn.style.display = isRunning || isVictory ? "none" : "flex";
  dom.pauseBtn.style.display = isRunning ? "flex" : "none";

  // Show pause overlay when paused
  const isPaused = state.state === "running" && state.isPaused;
  if (dom.pauseOverlay) {
    dom.pauseOverlay.style.display = isPaused ? "flex" : "none";
  }

  if (dom.victoryOverlay) {
    dom.victoryOverlay.style.display = isVictory ? "flex" : "none";
  }
}

export function updateVictoryOverlay(state) {
  if (!dom.victoryOverlay) return;
  const mission = Number(state.mission) || 1;
  const nextMission = mission < 3 ? String(mission + 1) : null;
  if (dom.victoryTitle) {
    dom.victoryTitle.textContent =
      mission >= 3 ? "Endless Cleared!" : "Mission Cleared";
  }
  if (dom.victoryDetail) {
    dom.victoryDetail.textContent = `You finished wave ${state.wave} on Mission ${state.mission}.`;
  }
  if (dom.victoryNextBtn) {
    dom.victoryNextBtn.disabled = !nextMission;
    dom.victoryNextBtn.textContent = nextMission
      ? `Next Mission (${nextMission})`
      : "Next Mission Unavailable";
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
