// Simuladores exclusivamente unitários: identificados por módulos reais do backend.
module.exports = {
  "agentes/banco/perfil.js": {
    "lerPerfil": "lerPerfil",
    "salvarPerfil": "salvarPerfil"
  },
  "agentes/banco/conhecimento.js": {
    "listarConhecimentos": "listarConhecimentos",
    "registrarConhecimento": "registrarConhecimento",
    "apagarConhecimento": "apagarConhecimento",
    "conhecimentosRelevantes": "relevantes",
    "estadoConhecimento": "estadoConhecimento"
  },
  "agentes/banco/atendimentos.js": {
    "registrarAtendimento": "registrarAtendimento",
    "avaliarAtendimento": "avaliarAtendimento",
    "listarAtendimentos": "listarAtendimentos",
    "decidirConhecimento": "decidirConhecimento",
    "aprenderTermos": "aprenderTermos",
    "pesosAprendidos": "pesosAprendidos",
    "vocabularioDoAgente": "vocabularioDoAgente",
    "esquecerTermo": "esquecerTermo"
  },
  "agentes/banco/skills.js": {
    "listarTrechosDeSkill": "listarTrechosDeSkill",
    "registrarTrechosDeSkill": "registrarTrechosDeSkill",
    "decidirTrechoDeSkill": "decidirTrechoDeSkill"
  },
  "agentes/regras/conhecimentoParaIA.js": {
    "conhecimentoParaIA": "conhecimentoParaIA"
  }
};
