// Simuladores exclusivamente unitários: identificados por módulos reais do backend.
module.exports = {
  "agentes/repositorioPerfil.js": {
    "lerPerfil": "lerPerfil",
    "salvarPerfil": "salvarPerfil"
  },
  "agentes/banco/operacoesDeConhecimento.js": {
    "listarConhecimentos": "listarConhecimentos",
    "registrarConhecimento": "registrarConhecimento",
    "apagarConhecimento": "apagarConhecimento",
    "conhecimentosRelevantes": "relevantes"
  },
  "agentes/repositorioAprendizados.js": {
    "decidirConhecimento": "decidirConhecimento",
    "aprenderTermos": "aprenderTermos",
    "pesosAprendidos": "pesosAprendidos",
    "vocabularioDoAgente": "vocabularioDoAgente",
    "esquecerTermo": "esquecerTermo"
  },
  "agentes/repositorioAtendimentos.js": {
    "registrarAtendimento": "registrarAtendimento",
    "avaliarAtendimento": "avaliarAtendimento",
    "listarAtendimentos": "listarAtendimentos"
  },
  "agentes/banco/estadoConhecimento.js": {
    "estadoConhecimento": "estadoConhecimento"
  },
  "agentes/banco/operacoesDeSkills.js": {
    "listarTrechosDeSkill": "listarTrechosDeSkill",
    "registrarTrechosDeSkill": "registrarTrechosDeSkill",
    "decidirTrechoDeSkill": "decidirTrechoDeSkill"
  },
  "agentes/regras/conhecimentoParaIA.js": {
    "conhecimentoParaIA": "conhecimentoParaIA"
  }
};
