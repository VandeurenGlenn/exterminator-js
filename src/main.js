import { Game } from "./game.js";
import {
  dom,
  updateStats,
  updateButtonStates,
  setTabActive,
  setBuildButtonActive,
  setDifficultyButtonActive,
  setMissionButtonActive,
} from "./ui.js";
import { GameState } from "./state.js";
import {
  setupInputHandlers,
  setupCanvasHandlers,
  setupBuildModeHandlers,
  setupTabHandlers,
  setupGameControlHandlers,
  setupStartScreenHandlers,
} from "./input.js";
import { audio } from "./audio.js";

// Initialize game state
const gameState = new GameState();

// Initialize game
const game = new Game(dom.canvas, onGameStateChange);
game.draw();
gameState.setTab("build");

// Initialize audio and start background music on start screen
audio.init();
audio.setMasterVolume(gameState.soundVolume);
audio.startMusic();

// Ensure audio context starts on user interaction (required by most browsers)
function resumeAudioContext() {
  if (audio.ctx && audio.ctx.state === "suspended") {
    audio.ctx.resume();
  }
  document.removeEventListener("click", resumeAudioContext);
  document.removeEventListener("touchstart", resumeAudioContext);
}
document.addEventListener("click", resumeAudioContext);
document.addEventListener("touchstart", resumeAudioContext);

// UI update callback
function onGameStateChange(state) {
  updateStats(state);
  updateButtonStates(state);
}

// Input handlers
const handlers = {
  setBuildMode(mode) {
    gameState.setMode(mode);
    game.setBuildMode(mode);
    setBuildButtonActive(mode);

    if (mode) {
      const targetTab =
        mode === "trap"
          ? "trap"
          : mode === "upgrade" ||
            mode === "upgrade-damage" ||
            mode === "upgrade-speed"
          ? "upgrade"
          : "build";
      if (targetTab !== gameState.currentTab) {
        gameState.setTab(targetTab);
        setTabActive(targetTab);
      }
    }
  },

  switchTab(tab) {
    gameState.setTab(tab);
    setTabActive(tab);

    if (tab === "build") {
      const buildModes = ["turret", "sniper", "wall"];
      const fallback = "turret";
      const mode = buildModes.includes(gameState.currentMode)
        ? gameState.currentMode
        : fallback;
      this.setBuildMode(mode);
    } else if (tab === "trap") {
      this.setBuildMode("trap");
    } else if (tab === "upgrade") {
      if (
        gameState.currentMode === "upgrade-damage" ||
        gameState.currentMode === "upgrade-speed"
      ) {
        this.setBuildMode(gameState.currentMode);
      } else {
        this.setBuildMode("upgrade-damage");
      }
    }
  },

  handleCanvasClick(pos) {
    let result = { ok: true };

    switch (gameState.currentMode) {
      case "turret":
        result = game.placeTower(pos, "standard");
        break;
      case "sniper":
        result = game.placeTower(pos, "sniper");
        break;
      case "wall":
        result = game.placeWall(pos);
        break;
      case "trap":
        result = game.placeTrap(pos);
        break;
      case "upgrade":
        result = game.upgradeTower(game.findTowerAt(pos), "damage");
        break;
      case "upgrade-damage":
        result = game.upgradeTower(game.findTowerAt(pos), "damage");
        break;
      case "upgrade-speed":
        result = game.upgradeTower(game.findTowerAt(pos), "speed");
        break;
      case "sell":
        result = game.sellAt(pos);
        break;
      default:
        result = { ok: false, reason: "Select a build mode" };
        break;
    }

    if (!result.ok) showToast(result.reason);
  },

  toggleStart() {
    if (game.state === "running") {
      game.togglePause();
    } else {
      game.start();
    }
  },

  restart() {
    game.restart();
  },

  togglePause() {
    game.togglePause();
  },

  setDifficulty(difficulty) {
    gameState.setDifficulty(difficulty);
    setDifficultyButtonActive(difficulty);
    audio.playClick();
  },

  setMission(mission) {
    gameState.setMission(mission);
    setMissionButtonActive(mission);
    audio.playClick();
  },

  setSoundVolume(volume) {
    gameState.setSoundVolume(volume);
    audio.setMasterVolume(volume);
  },

  beginGame() {
    audio.init();
    audio.setMasterVolume(gameState.soundVolume);
    audio.stopMusic();
    game.setDifficulty(gameState.selectedDifficulty);
    game.setMission(gameState.selectedMission);
    dom.startScreen.classList.add("hidden");
  },

  getCurrentMode() {
    return gameState.currentMode;
  },
};

// Setup all event handlers
setupGameControlHandlers(dom, handlers);
setupBuildModeHandlers(dom, handlers);
setupTabHandlers(dom, handlers);
setupInputHandlers(game, handlers);
setupCanvasHandlers(dom.canvas, game, handlers);
setupStartScreenHandlers(dom, handlers);

// Initialize UI
setBuildButtonActive(gameState.currentMode);
setTabActive(gameState.currentTab);
if (dom.soundVolumeInput) {
  dom.soundVolumeInput.value = gameState.soundVolume;
  if (dom.soundVolumeLabel) {
    dom.soundVolumeLabel.textContent = `${Math.round(
      gameState.soundVolume * 100
    )}%`;
  }
}

// Toast utility
function showToast(message) {
  if (!message) return;
  dom.toastEl.textContent = message;
  dom.toastEl.classList.add("show");
  setTimeout(() => dom.toastEl.classList.remove("show"), 1200);
}
