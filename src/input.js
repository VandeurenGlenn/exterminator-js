export function setupInputHandlers(game, handlers) {
  // Keyboard shortcuts: 1 Turret, 2 Wall, 3 Trap, 4 Upgrade, 5 Sell, Space start, P pause, R restart
  document.addEventListener("keydown", (ev) => {
    // Avoid interfering with typing in form elements
    const tag = (ev.target && ev.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    switch (ev.key) {
      case "1":
        handlers.setBuildMode("turret");
        break;
      case "2":
        handlers.setBuildMode("wall");
        break;
      case "3":
        handlers.setBuildMode("trap");
        break;
      case "4":
        handlers.setBuildMode("upgrade");
        break;
      case "5":
        handlers.setBuildMode("sell");
        break;
      case " ":
        ev.preventDefault();
        handlers.toggleStart();
        break;
      case "r":
      case "R":
        handlers.restart();
        break;
      case "p":
      case "P":
        handlers.togglePause();
        break;
      case "Escape":
        handlers.setBuildMode(null);
        break;
      default:
        break;
    }
  });
}

export function setupCanvasHandlers(canvas, game, handlers) {
  canvas.addEventListener("click", (event) => {
    const pos = canvasPoint(event, canvas);
    handlers.handleCanvasClick(pos);
  });

  canvas.addEventListener("mousemove", (event) => {
    const pos = canvasPoint(event, canvas);
    game.cursorPos = pos;
  });

  canvas.addEventListener("mouseleave", () => {
    game.cursorPos = null;
  });
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

export function setupBuildModeHandlers(dom, handlers) {
  dom.selectTurretBtn?.addEventListener("click", () =>
    handlers.setBuildMode("turret")
  );
  dom.selectWallBtn?.addEventListener("click", () =>
    handlers.setBuildMode("wall")
  );
  dom.selectTrapBtn?.addEventListener("click", () =>
    handlers.setBuildMode("trap")
  );
  dom.selectUpgradeBtn?.addEventListener("click", () =>
    handlers.setBuildMode("upgrade")
  );
  dom.selectSellBtn?.addEventListener("click", () =>
    handlers.setBuildMode("sell")
  );
}

export function setupTabHandlers(dom, handlers) {
  dom.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      handlers.switchTab(tab);
    });
  });
}

export function setupGameControlHandlers(dom, handlers) {
  dom.startBtn.addEventListener("click", () => handlers.toggleStart());
  dom.restartBtn.addEventListener("click", () => handlers.restart());
  dom.pauseBtn?.addEventListener("click", () => handlers.togglePause());
}

export function setupStartScreenHandlers(dom, handlers) {
  dom.startScreen.querySelectorAll("[data-difficulty]").forEach((btn) => {
    btn.addEventListener("click", () => {
      handlers.setDifficulty(btn.dataset.difficulty);
    });
  });

  dom.startScreen.querySelectorAll("[data-mission]").forEach((btn) => {
    btn.addEventListener("click", () => {
      handlers.setMission(btn.dataset.mission);
    });
  });

  dom.soundVolumeInput?.addEventListener("input", (e) => {
    const val = Number(e.target.value);
    handlers.setSoundVolume(val);
    if (dom.soundVolumeLabel) {
      dom.soundVolumeLabel.textContent = `${Math.round(val * 100)}%`;
    }
  });

  dom.beginBtn?.addEventListener("click", () => {
    handlers.beginGame();
  });
}
