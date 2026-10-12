/** Monta o relatório Markdown local com apenas os dados autorizados. */
import os from 'node:os';
import { hash } from '../../projeto.js';
import { rotulo, type Solicitacao, type Contexto } from './definirSolicitacao.js';

/** Texto do relatório (Markdown), incluindo só o que a pessoa autorizou. */
export function montarCorpo(s: Solicitacao, c: Contexto) {
  const idLocal = 'LOCAL-' + hash(JSON.stringify({ categoria:s.categoria,titulo:s.titulo,descricao:s.descricao,esperado:s.esperado,passos:s.passos })).slice(0,16);
  const ambiente: string[] = [];
  if (s.incluirVersao) ambiente.push(`Prumo QA ${c.versao}`);
  if (s.incluirSistema) ambiente.push(`Sistema: ${os.platform()} ${os.release()} (${os.arch()})`);
  if (s.incluirDiagnostico) ambiente.push('Diagnóstico da interface (somente metadados):\n' + (c.diagnostico || '(nenhum evento registrado)'));
  return {
    descricao: s.descricao, esperado: s.esperado ?? '', passos: s.passos ?? '', ambiente: ambiente.join('\n'),
    idLocal,
    markdown: ['---', `id: ${idLocal}`, `tipo: ${s.categoria}`, 'status: rascunho_local', 'origem: aplicativo', ...(s.incluirVersao ? [`versao: ${JSON.stringify(c.versao)}`] : []), '---', '', `# [${rotulo[s.categoria]}] ${s.titulo}`, '', 'Identificador local do relato; não é número de chamado GitHub.', '', '## Descrição', s.descricao,
      ...(s.esperado ? ['', s.categoria === 'bug' ? '## Comportamento esperado' : '## Benefício esperado', s.esperado] : []),
      ...(s.passos ? ['', '## Passos para reproduzir', s.passos] : []), ...(ambiente.length ? ['', '## Ambiente', ambiente.join('\n')] : [])].join('\n')
  };
}
