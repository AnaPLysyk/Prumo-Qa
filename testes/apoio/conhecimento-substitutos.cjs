// Simuladores exclusivamente unitários, agrupados pelo módulo real. Todos ficam no Prumo QA.
module.exports = {
  "agentes/repositorioPerfil.js": {
    "lerPerfil": "lerPerfil",
    "salvarPerfil": "salvarPerfil"
  },
  "agentes/banco/listarConhecimentos.js": {
    "listarConhecimentos": "listarConhecimentos"
  },
  "agentes/banco/registrarConhecimento.js": {
    "registrarConhecimento": "registrarConhecimento"
  },
  "agentes/repositorioAprendizados.js": {
    "decidirConhecimento": "decidirConhecimento",
    "aprenderTermos": "aprenderTermos",
    "pesosAprendidos": "pesosAprendidos",
    "vocabularioDoAgente": "vocabularioDoAgente",
    "esquecerTermo": "esquecerTermo"
  },
  "agentes/banco/apagarConhecimento.js": {
    "apagarConhecimento": "apagarConhecimento"
  },
  "agentes/banco/conhecimentosRelevantes.js": {
    "conhecimentosRelevantes": "relevantes"
  },
  "agentes/repositorioAtendimentos.js": {
    "registrarAtendimento": "registrarAtendimento",
    "avaliarAtendimento": "avaliarAtendimento",
    "listarAtendimentos": "listarAtendimentos"
  },
  "agentes/banco/estadoConhecimento.js": {
    "estadoConhecimento": "estadoConhecimento"
  },
  "agentes/banco/listarTrechosDeSkill.js": {
    "listarTrechosDeSkill": "listarTrechosDeSkill"
  },
  "agentes/banco/registrarTrechosDeSkill.js": {
    "registrarTrechosDeSkill": "registrarTrechosDeSkill"
  },
  "agentes/banco/decidirTrechoDeSkill.js": {
    "decidirTrechoDeSkill": "decidirTrechoDeSkill"
  },
  "agentes/regras/conhecimentoParaIA.js": {
    "conhecimentoParaIA": "conhecimentoParaIA"
  }
};
