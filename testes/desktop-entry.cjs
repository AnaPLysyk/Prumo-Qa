require('./conhecimento-hook.cjs');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { app } = require('electron');
const repo = path.resolve(__dirname, '..');
app.setAppPath(repo);
// A entrada de teste é um arquivo, então o Electron não lê package.json sozinho.
app.getVersion = () => require(path.join(repo, 'package.json')).version;
import(pathToFileURL(path.join(__dirname, '..', 'dist', 'desktop', 'main.js')).href);
