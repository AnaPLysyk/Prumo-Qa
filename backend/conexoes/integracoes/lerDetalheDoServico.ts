/** Faz as consultas de detalhe (metadados, transições, histórico, anexos, workflows, commits...) de Jira, Qase e GitHub. */
import { codificarParaUrl } from '../../compartilhado/texto.js';
import { ErroServico } from './ErroServico.js';
import { ContextoServico } from '../tipos/adaptador.js';
import { Filtros, OperacaoExtra, Pg } from '../tipos/leituras.js';
import { ParametrosConsulta } from '../tipos/ParametrosConsulta.js';
import { ResultadoConsulta } from '../tipos/ParametrosConsulta.js';
import { consultarMetadadosJira } from './consultasJira.js';
import { consultarCamposTipoJira } from './consultasJira.js';
import { consultarTransicoesJira } from './consultasJira.js';
import { consultarAnexosJira } from './consultasJira.js';
import { consultarHistoricoJira } from './consultasJira.js';
import { consultarPlanoQase } from './qase.js';
import { consultarCamposSistemaQase } from './qase.js';
import { consultarArquivosGithub } from './github.js';
import { consultarWorkflowsGithub } from './github.js';
import { consultarJobsGithub } from './github.js';
import { consultarArtefatosGithub } from './github.js';
import { consultarRevisoesGithub } from './github.js';
import { consultarCommitGithub } from './github.js';
import { consultarIssuesGithub } from './github.js';
import { consultarAmbientesQase, consultarCamposPersonalizadosQase, consultarMarcosQase } from './qase.js';
import { Recurso } from '../../projetos/contratos.js';

export async function lerDetalheDoServico(ctx: ContextoServico, rec: Recurso, op: OperacaoExtra, p: Pg, id?: string, f: Filtros = {}): Promise<ResultadoConsulta> {
  const ticket = () => { if (!id || !/^[A-Z][A-Z0-9_]*-\d+$/.test(id)) throw new ErroServico('SERVICE_RESPONSE_INVALID'); return id; };
  const numero = () => { if (!id || !/^\d{1,15}$/.test(id)) throw new ErroServico('SERVICE_RESPONSE_INVALID'); return id; };
  const repo = `/repos/${rec.chave.split('/').map(codificarParaUrl).join('/')}`; const pg = `per_page=${p.limite}&page=${Math.floor(p.offset / p.limite) + 1}`;
  const prox = (n: number) => (n === p.limite ? p.offset + n : null);
  const parametros: ParametrosConsulta = { ctx, rec, p, id, f, repo, pg, prox, ticket, numero };
  switch (op) {
    case 'metadados': {
      const resposta = await consultarMetadadosJira(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'campos-tipo': {
      const resposta = await consultarCamposTipoJira(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'transicoes': {
      const resposta = await consultarTransicoesJira(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'anexos': {
      const resposta = await consultarAnexosJira(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'historico': {
      const resposta = await consultarHistoricoJira(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'plano': {
      const resposta = await consultarPlanoQase(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'campos-sistema': {
      const resposta = await consultarCamposSistemaQase(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'arquivos': {
      const resposta = await consultarArquivosGithub(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'workflows': {
      const resposta = await consultarWorkflowsGithub(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'jobs': {
      const resposta = await consultarJobsGithub(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'artefatos': {
      const resposta = await consultarArtefatosGithub(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'revisoes': {
      const resposta = await consultarRevisoesGithub(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'commit': {
      const resposta = await consultarCommitGithub(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'issues': {
      const resposta = await consultarIssuesGithub(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'marcos': {
      const resposta = await consultarMarcosQase(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'ambientes': {
      const resposta = await consultarAmbientesQase(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'campos-personalizados': {
      const resposta = await consultarCamposPersonalizadosQase(parametros);
      if (resposta !== null) return resposta;
      break;
    }
  }
  throw new ErroServico('SERVICE_WRITE_BLOCKED'); // operação não existe neste serviço
}
