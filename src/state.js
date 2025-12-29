export class GameState {
  constructor() {
    this.currentMode = null;
    this.currentTab = "build";
    this.wallMode = false;
    this.selectedDifficulty = "easy";
    this.selectedMission = "1";
    this.soundVolume = 0.7;
  }

  setMode(mode) {
    this.currentMode = mode;
    this.wallMode = mode === "wall";
  }

  setTab(tab) {
    this.currentTab = tab;
  }

  setDifficulty(difficulty) {
    this.selectedDifficulty = difficulty;
  }

  setMission(mission) {
    this.selectedMission = mission;
  }

  setSoundVolume(volume) {
    this.soundVolume = Math.min(1, Math.max(0, volume));
  }
}
