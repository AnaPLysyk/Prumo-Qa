/** Escreve o resumo do contrato proposto que aparece na confirmação do Windows (pastas, comandos, observações). */
import { PropostaContrato } from '../tipos/contrato.js';

/** Texto do diálogo de aprovação: o que será gravado, em linguagem simples. */
export function resumirContratoProposto(p: PropostaContrato) {
  const m = p.manifesto; const lista = (a: string[]) => (a.length ? a.join(', ') : 'nenhuma');
  return [
    `Pasta: ${p.raiz}`,
    `Stack detectada: ${p.stacks.length ? p.stacks.map((s) => `${s.nome} (${s.evidencias.join(', ')})`).join('; ') : 'nenhuma conhecida'}`,
    `Documentação: ${lista(m.context.documentation)}`, `Testes: ${lista(m.context.tests)}`, `Código: ${lista(m.context.code)}`,
    `Comandos: ${Object.keys(m.commands).length ? Object.entries(m.commands).map(([k, c]) => `${k} = ${typeof c === 'string' ? c : c.executable + ' ' + c.args.join(' ')}`).join('; ') : 'nenhum (somente leitura)'}`,
    ...p.observacoes,
    '',
    'Será criado só o arquivo qa.project.json na raiz da pasta. Nenhum outro arquivo é alterado e nada é executado agora: cada execução continua pedindo a sua aprovação. Você pode editar o arquivo depois.'
  ].join('\n');
}
