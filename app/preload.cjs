'use strict';
// Ponte mínima: a página só enxerga estas funções. Nenhum ipcRenderer, require ou caminho livre é exposto.
// Cada função corresponde a um canal do catálogo (src/contratos.ts); testes conferem a correspondência.
const { contextBridge, ipcRenderer } = require('electron');
const chamar = (canal, args) => ipcRenderer.invoke('prumo:' + canal, args);
contextBridge.exposeInMainWorld('prumo', Object.freeze({
  info: () => chamar('app:info'),
  projetos: () => chamar('projetos:listar'),
  escolherProjeto: () => chamar('projetos:escolher'),
  adicionarDemo: () => chamar('projetos:demo'),
  desvincular: (root) => chamar('projetos:desvincular', { root }),
  visao: (root) => chamar('projeto:visao', { root }),
  logs: (root, filter) => chamar('projeto:logs', { root, filter }),
  historico: (root, filter) => chamar('projeto:historico', { root, filter }),
  evidencias: (root, jobId) => chamar('projeto:evidencias', { root, jobId }),
  conexoes: (root) => chamar('projeto:conexoes', { root }),
  conectar: (root, client) => chamar('conexao:aplicar', { root, client }),
  exportarLogs: (root) => chamar('logs:exportar', { root }),
  ajuda: () => chamar('ajuda:documentos'),
  versoes: () => chamar('ajuda:versoes'),
  integracoes: () => chamar('ajuda:integracoes'),
  verificarAtualizacao: () => chamar('atualizacao:verificar'),
  abrirRelease: () => chamar('atualizacao:abrir'),
  resumoDados: () => chamar('dados:resumo'),
  excluirDados: (escopo, root) => chamar('dados:excluir', escopo === 'diagnostico' ? { escopo } : { escopo, root }),
  diagnostico: () => chamar('diagnostico:listar'),
  contextosListar: (root, filter) => chamar('contextos:listar', { root, filter }),
  contextosObter: (root, id) => chamar('contextos:obter', { root, id }),
  contextosSalvar: (root, dados) => chamar('contextos:salvar', { root, id: dados.id, substituir: dados.substituir, dados: dados.dados }),
  contextosAprovar: (root, id) => chamar('contextos:aprovar', { root, id }),
  contextosDesatualizar: (root, id) => chamar('contextos:desatualizar', { root, id }),
  contextosConflito: (root, id, outroId) => chamar('contextos:conflito', { root, id, outroId }),
  contextosExcluir: (root, id) => chamar('contextos:excluir', { root, id }),
  contextosMcp: (root, habilitar) => chamar('contextos:mcp', { root, habilitar })
}));
