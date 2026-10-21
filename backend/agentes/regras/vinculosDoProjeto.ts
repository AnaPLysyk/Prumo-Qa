/** O que os agentes precisam saber de cada projeto: onde ele está ligado em cada ferramenta e o que o Prumo pode fazer ali. Sem segredo e sem caminho completo. */
import path from "node:path";
import { listarEspacos, obterEspaco } from "../../projetos/banco/projetos.js";
import { duplicidadesDoEspaco } from "../../projetos/unicidadeDosVinculos.js";
import { Espaco, Servico } from "../../projetos/contratos.js";
import { escritaHabilitada } from "../../conexoes/escrita/permissoes.js";
import { catalogoOperacoes } from "../../conexoes/escrita/catalogoOperacoes.js";
import { MapaDeVinculos, VinculoDoProjeto } from "../tipos/vinculos.js";

const LEITURAS: Record<Servico, string[]> = {
  jira: ['tickets', 'campos', 'comentários', 'transições', 'histórico'],
  qase: ['casos', 'suites', 'planos', 'runs', 'defeitos'],
  github: ['repositório', 'branches', 'commits', 'pull requests', 'issues', 'workflows']
};
const NOMES: Record<Servico, string> = { jira: 'Jira', qase: 'Qase', github: 'GitHub' };
const SERVICOS: Servico[] = ['jira', 'qase', 'github'];

/** Endereço legível de onde o vínculo aponta (nunca o endereço da API nem credencial). */
function enderecoLegivel(servico: Servico, chave: string, instancia: string) {
  if (servico === 'github') return `github.com/${chave}`;
  if (servico === 'qase') return `app.qase.io/project/${chave}`;
  try { return new URL(instancia).host; } catch { return 'site do Jira'; }
}

/** O mapa do projeto, só com o que está gravado nele: vínculo por UUID de projeto, estado da última verificação e escrita habilitada por serviço. */
export function mapaDeVinculosDoProjeto(espacoOuId: string | Espaco, base?: string): MapaDeVinculos {
  const espaco = typeof espacoOuId === 'string' ? obterEspaco(espacoOuId, base) : espacoOuId;
  const vinculos: VinculoDoProjeto[] = espaco.vinculos.map(v => {
    const escrita = escritaHabilitada(espaco.id, v.servico, base);
    const situacao = v.desligado ? 'DESLIGADO' : v.estado === 'VALIDO' ? 'ATIVO' : 'PRECISA_REVISAO';
    return { servico: v.servico, situacao, estado: v.estado, chave: v.recurso.chave, nome: v.recurso.nome,
      endereco: enderecoLegivel(v.servico, v.recurso.chave, v.recurso.instancia), escrita,
      leitura: LEITURAS[v.servico], escritas: escrita ? catalogoOperacoes.filter(o => o.servico === v.servico).map(o => o.rotulo) : [] };
  });
  return { projeto: { id: espaco.id, nome: espaco.nome }, manual: { ativo: espaco.manualAtivo !== false },
    pastaLocal: { vinculada: !!espaco.pastaLocal, nome: espaco.pastaLocal ? path.basename(espaco.pastaLocal) : null },
    vinculos, semVinculo: SERVICOS.filter(s => !vinculos.some(v => v.servico === s)), duplicidades: duplicidadesDoEspaco(espaco, listarEspacos(base)) };
}

/** Frases curtas em português, na ordem em que um agente precisa decidir: onde está ligado, se está ativo e o que pode fazer. */
export function linhasDoMapaDeVinculos(mapa: MapaDeVinculos): string[] {
  const linhas = [`Projeto "${mapa.projeto.nome}": cada ferramenta abaixo é o único destino deste projeto; nunca use outro projeto ou repositório.`];
  for (const v of mapa.vinculos) {
    const onde = `${NOMES[v.servico]}: ${v.servico === 'github' ? 'repositório' : 'projeto'} ${v.chave} (${v.nome}) em ${v.endereco}`;
    if (v.situacao === 'DESLIGADO') linhas.push(`${onde} · DESLIGADO: não consulte nem envie nada até a pessoa ligar em Projetos.`);
    else if (v.situacao === 'PRECISA_REVISAO') linhas.push(`${onde} · precisa de verificação (estado ${v.estado}): avise a pessoa em vez de agir.`);
    else linhas.push(`${onde} · ativo · lê ${v.leitura.join(', ')} · ${v.escrita ? `pode propor, com confirmação da pessoa: ${v.escritas.join(', ')}` : 'só leitura (a escrita está desligada neste projeto)'}.`);
  }
  if (mapa.semVinculo.length) linhas.push(`Sem vínculo neste projeto: ${mapa.semVinculo.map(s => NOMES[s]).join(', ')}. Não invente destino; peça para vincular em Projetos.`);
  for (const d of mapa.duplicidades) linhas.push(`ATENÇÃO: ${d.onde === 'local' ? 'a pasta local' : `o mesmo ${d.onde === 'github' ? 'repositório' : 'projeto'} ${NOMES[d.onde]}`} também está no projeto "${d.projeto}" do Prumo. Não aja neste destino até a pessoa resolver em Projetos.`);
  linhas.push(mapa.pastaLocal.vinculada ? `Pasta local: vinculada (${mapa.pastaLocal.nome}).` : 'Pasta local: não vinculada.');
  linhas.push(mapa.manual.ativo ? 'Manual/Prumo: ativo (casos, propostas e tickets locais).' : 'Manual/Prumo: desativado (nada novo é criado localmente; registros antigos continuam).');
  return linhas;
}
