const fs = require('node:fs');
const path = require('node:path');

function defaultLogDirectory() {
  if (process.platform === 'win32') return path.join(process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local'), 'ImmichFaceRedactor', 'logs');
  if (process.platform === 'darwin') return path.join(process.env.HOME || '', 'Library', 'Logs', 'ImmichFaceRedactor');
  return path.join(process.env.XDG_STATE_HOME || path.join(process.env.HOME || '', '.local', 'state'), 'immich-face-redactor');
}

function createLogger(directory = defaultLogDirectory()) {
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, 'immich-face-redactor.log');
  const write = (level, message, error) => {
    const detail = error ? ` ${error.stack || error.message || error}` : '';
    const line = `${new Date().toISOString()} ${level} ${message}${detail}\n`;
    try {
      if (fs.existsSync(file) && fs.statSync(file).size >= 2 * 1024 * 1024) {
        for (let i = 3; i >= 1; i--) {
          const old = `${file}.${i}`;
          if (i === 3 && fs.existsSync(old)) fs.rmSync(old);
          else if (fs.existsSync(old)) fs.renameSync(old, `${file}.${i + 1}`);
        }
        if (fs.existsSync(file)) fs.renameSync(file, `${file}.1`);
      }
      fs.appendFileSync(file, line, 'utf8');
    } catch (_) { /* logging must never take down the application */ }
  };
  write('INFO', 'Application logging started.');
  return { file, info: (m) => write('INFO', m), warn: (m, e) => write('WARN', m, e), error: (m, e) => write('ERROR', m, e) };
}

module.exports = { defaultLogDirectory, createLogger };
