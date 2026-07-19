// Jest setup file
// Mock electron modules

jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/tmp/test'),
    whenReady: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    quit: jest.fn()
  },
  ipcMain: {
    handle: jest.fn(),
    removeHandler: jest.fn()
  },
  dialog: {
    showSaveDialog: jest.fn(),
    showOpenDialog: jest.fn()
  },
  shell: {
    openExternal: jest.fn()
  },
  BrowserWindow: jest.fn()
}));

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
