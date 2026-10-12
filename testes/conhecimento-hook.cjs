// Entrada exclusiva do runner: mantém a janela real e substitui só conhecimento por memória.
const { registerHooks } = require('node:module');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
// Propaga a substituição aos subprocessos Node dos fixtures, nunca ao aplicativo distribuído.
const requireHook = '--require ' + JSON.stringify(__filename);
if (!(process.env.NODE_OPTIONS ?? '').includes(__filename)) process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, requireHook].filter(Boolean).join(' ');
const fixture = pathToFileURL(path.join(__dirname, 'conhecimento-falso.mjs')).href;
const nomes = ['tiposConhecimento','estadosConhecimento','limitesConhecimento','caminhoConhecimento','lerPerfil','normalizarNome','salvarPerfil','listarConhecimentos','registrarConhecimento','decidirConhecimento','apagarConhecimento','norm','termos','relevantes','aprenderTermos','pesosAprendidos','vocabularioDoAgente','esquecerTermo','registrarAtendimento','avaliarAtendimento','listarAtendimentos','estadoConhecimento','conhecimentoParaIA'];
registerHooks({ load(url, context, nextLoad) {
  if (url.endsWith('/dist/conhecimento.js')) return { format: 'module', shortCircuit: true, source: `import { memoria } from ${JSON.stringify(fixture)};\n` + nomes.map(n => `export const ${n} = memoria.${n};`).join('\n') };
  return nextLoad(url, context);
} });
