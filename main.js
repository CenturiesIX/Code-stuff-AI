// Build/run: npm install && npm start
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { readFileSafe } = require('./src/services/fileReader');
const { detectLanguage } = require('./src/services/languageDetector');
const { parseCodeStructure } = require('./src/services/codeParser');
const { generateExplanation } = require('./src/services/explanationGenerator');

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false
    },
    title: 'Code Explainer'
  });

  mainWindow.loadFile(path.join(__dirname, 'src/ui/index.html'));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File',
          accelerator: 'Ctrl+O',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('trigger-open-file');
            }
          }
        },
        {
          label: 'Save Explanation',
          accelerator: 'Ctrl+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('trigger-save');
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Code Explainer',
              message: 'Load a code file to generate human-friendly explanations.'
            });
          }
        }
      ]
    },
    {
      label: 'About',
      submenu: [
        {
          label: 'About Code Explainer',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About',
              message: 'Code Explainer\nVersion 1.0.0\nDesktop helper for understanding source code.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createMainWindow();
  buildMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('open-file-dialog', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select a code file',
    properties: ['openFile'],
    filters: [
      { name: 'Code Files', extensions: ['js', 'ts', 'py', 'java', 'cs', 'cpp', 'c', 'rb', 'go', 'rs', 'php', 'html', 'css', 'json', 'txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (canceled || !filePaths || filePaths.length === 0) {
    return { error: 'No file selected.' };
  }

  const filePath = filePaths[0];
  const fileData = readFileSafe(filePath);
  if (fileData.error) {
    return { error: fileData.error };
  }

  const language = detectLanguage(filePath);
  const structure = parseCodeStructure(fileData.content, language);
  const explanation = generateExplanation({
    filePath,
    content: fileData.content,
    language,
    structure
  });

  return { filePath, language, explanation };
});

ipcMain.handle('save-explanation', async (_event, payload) => {
  const { defaultPath, content } = payload;
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save Explanation',
    defaultPath: defaultPath || 'explanation.txt',
    filters: [{ name: 'Text Files', extensions: ['txt'] }]
  });

  if (canceled || !filePath) {
    return { canceled: true };
  }

  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { saved: true, filePath };
  } catch (error) {
    return { error: `Unable to save file: ${error.message}` };
  }
});
