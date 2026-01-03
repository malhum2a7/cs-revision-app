// public/electron.js
const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const iconPath = path.join(__dirname, "logo512.png");
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#0b1020",
    show: true,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    win.loadURL("http://localhost:3000");
    // devtools OFF unless you explicitly open them
    // win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../build/index.html"));
  }
}

app.whenReady().then(() => {
  if (process.platform === "linux") {
    app.setIcon(path.join(__dirname, "logo512.png"));
  }
  if (process.platform === "darwin" && app.dock) {
    app.dock.setIcon(path.join(__dirname, "logo512.png"));
  }
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
