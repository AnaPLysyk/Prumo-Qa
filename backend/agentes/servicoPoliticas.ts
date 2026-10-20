/** servicoPoliticas: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import { Registro, registro, Configuracao, idsEsp, EstadoCapacidade, capacidades, especializacoes } from "./tipos/persona.js";
import { lerLocal, gravarLocal } from "../compartilhado/banco/persistenciaLocal.js";
import { especializacaoLigada } from "../administracao/servico.js";
import { obterEspaco } from "../projetos/banco/projetos.js";
import { gravarPreferencias, lerPreferencias } from "../configuracoes/servico.js";

// --- servicoPoliticas ---
// ── configuracaoDosAgentes ──
export const lerConfiguracaoDosAgentes = (b?: string) => lerLocal<Registro>('agentes.json', registro, { version: 1, itens: [] }, b);

/** Persistência das políticas validada pelo contrato do arquivo. */
export const gravarConfiguracaoDosAgentes = (dados: Registro, base?: string) =>
  gravarLocal("agentes.json", registro.parse(dados), base);

// ── servicoPoliticas ──
/** Sem configuração salva vale o padrão: todas as especializações habilitadas e as políticas padrão (comportamento anterior à 2.9). */
export function configuracaoDoEspaco(espacoId: string, b?: string): Configuracao {
  const i = lerConfiguracaoDosAgentes(b).itens.find(x => x.espacoId === espacoId);
  // Administração: especialização desligada na plataforma fica fora em todos os projetos, inclusive no MCP.
  return i ? { especializacoes: i.especializacoes.filter(e => idsEsp.includes(e as never) && especializacaoLigada(e, b)), politicas: i.politicas, padrao: false } : { especializacoes: idsEsp.filter(e => especializacaoLigada(e, b)), politicas: {}, padrao: true };
}

export function salvarConfiguracao(espacoId: string, c: { especializacoes: string[]; politicas: Record<string, string> }, por: string, b?: string, agora = new Date()) {
  obterEspaco(espacoId, b); const esp = [...new Set(c.especializacoes)]; if (esp.some(e => !idsEsp.includes(e as never))) throw new Error('AGENT_SPECIALIZATION_UNKNOWN');
  const pol: Record<string, 'PERMITIDO' | 'EXIGE_AUTORIZACAO' | 'BLOQUEADO'> = {};
  for (const [cap, estado] of Object.entries(c.politicas)) { const d = capacidades.find(x => x.id === cap); if (!d) throw new Error('AGENT_CAPABILITY_UNKNOWN'); if (!d.editavel.includes(estado as EstadoCapacidade)) throw new Error('AGENT_POLICY_NOT_ALLOWED: ' + cap + ' não aceita ' + estado); pol[cap] = estado as 'PERMITIDO' | 'EXIGE_AUTORIZACAO' | 'BLOQUEADO'; }
  const r = lerConfiguracaoDosAgentes(b); r.itens = r.itens.filter(i => i.espacoId !== espacoId); r.itens.push({ espacoId, especializacoes: esp, politicas: pol, alteradoEm: agora.toISOString(), por: por.slice(0, 200) });
  gravarConfiguracaoDosAgentes(r, b); return configuracaoDoEspaco(espacoId, b);
}

// ── servicoCapacidades ──
export function capacidadeEfetiva(
  espacoId: string | null,
  capacidade: string,
  base?: string
): { estado: EstadoCapacidade; motivo: string } {
  const definicao = capacidades.find(item => item.id === capacidade);
  if (!definicao) return { estado: 'BLOQUEADO', motivo: 'Capacidade desconhecida.' };
  if (definicao.padrao === 'SOMENTE_PESSOA') {
    return { estado: 'SOMENTE_PESSOA', motivo: definicao.explicacao };
  }

  const configuracao = espacoId
    ? configuracaoDoEspaco(espacoId, base)
    : { especializacoes: [...idsEsp], politicas: {} as Configuracao['politicas'], padrao: true };
  const politica = configuracao.politicas[capacidade] ?? definicao.padrao;
  if (politica === 'BLOQUEADO') {
    return { estado: 'BLOQUEADO', motivo: 'Bloqueada pela política deste projeto.' };
  }

  const habilitadas = especializacoes.filter(
    item => (configuracao.especializacoes as string[]).includes(item.id)
      && (item.capacidades as readonly string[]).includes(capacidade)
  );
  if (!habilitadas.length) {
    return { estado: 'BLOQUEADO', motivo: 'Nenhuma especialização habilitada inclui esta capacidade.' };
  }

  return {
    estado: politica,
    motivo: politica === 'EXIGE_AUTORIZACAO'
      ? 'Permitida, mas cada execução exige autorização humana nativa.'
      : 'Permitida pelas especializações: ' + habilitadas.map(item => item.rotulo).join(', ') + '.'
  };
}

export function exigirCapacidade(espacoId: string | null, capacidade: string, base?: string) {
  const avaliada = capacidadeEfetiva(espacoId, capacidade, base);
  if (avaliada.estado === 'BLOQUEADO' || avaliada.estado === 'SOMENTE_PESSOA') {
    throw Object.assign(
      new Error(`POLICY_BLOCKED: ${avaliada.motivo}`),
      { codigo: 'POLICY_BLOCKED' }
    );
  }
  return avaliada;
}

/** Matriz usada pela interface e pela ferramenta listar_politicas. */
export function matrizDePoliticas(espacoId: string | null, base?: string) {
  return capacidades.map(definicao => {
    const avaliada = capacidadeEfetiva(espacoId, definicao.id, base);
    return {
      id: definicao.id,
      rotulo: definicao.rotulo,
      ferramenta: definicao.ferramenta,
      estado: avaliada.estado,
      motivo: avaliada.motivo,
      editavel: definicao.editavel,
      explicacao: definicao.explicacao
    };
  });
}

// --- autorizarDelegacaoDeIa ---
/** Autoriza ou revoga a delegação do chat ao Claude Code/Codex. Chamado só após confirmação nativa da pessoa. */
export function autorizarDelegacaoDeIa(provedor: 'claude' | 'codex', valor: boolean, base?: string) { const p = lerPreferencias(base); return gravarPreferencias({ ...p, ia: { ...p.ia, delegacao: { ...p.ia.delegacao, [provedor]: valor } } }, base); }
