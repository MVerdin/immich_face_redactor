const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const { ImmichClient, ImmichError } = require('./immich-client');
const { createLogger } = require('./logger');

const logger = createLogger();
let window;

process.on('uncaughtException', (error) => {
  logger.error('Unhandled Electron main-process exception.', error);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Electron main-process promise rejection.', reason);
});

function createWindow() {
  window = new BrowserWindow({ width: 940, height: 720, minWidth: 650, minHeight: 450,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false } });
  window.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}
ipcMain.handle('log-path', () => logger.file);
ipcMain.handle('load-people', async (_, { serverUrl, token }) => {
  if (!serverUrl?.trim() || !token?.trim()) throw new ImmichError('Enter both a server URL and API token.');
  try {
    const client = new ImmichClient(serverUrl, token.trim(), { logger });
    const people = await client.listPeople();
    const thumbnails = {};
    for (const person of people) {
      try { thumbnails[person.id] = (await client.getPersonThumbnail(person.id)).toString('base64'); }
      catch (error) { logger.warn(`Could not load thumbnail for person ${person.id}`, error); }
    }
    return { people, thumbnails };
  } catch (error) { logger.error('Could not load people from Immich.', error); throw new Error(error.message || 'Immich request failed.'); }
});
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
