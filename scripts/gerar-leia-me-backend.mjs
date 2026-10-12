// Gera backend/LEIA-ME.md e backend/<tela>/LEIA-ME.md a partir da primeira linha de cada arquivo.
// Rode com: npm run leia-me. Um teste compara o resultado com os arquivos gravados, então o LEIA-ME nunca fica velho.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const raiz = 'backend';
export const telas = {
  inicio: 'Início: o painel do projeto e o assistente local que responde com os dados deste computador, sem IA.',
  projetos: 'Projetos: projetos do Prumo, pastas de código vinculadas e o contrato qa.project.json.',
  contextos: 'Contextos: requisitos, regras, critérios e decisões do projeto, com aprovação humana e histórico verificável.',
  tickets: 'Tickets: tickets do Jira e propostas de caso e de bug em rascunho, publicadas só com confirmação.',
  testes: 'Testes: catálogo de testes da pasta, análise de testes, runs do Qase e publicação de resultados.',
  agendamentos: 'Agendamentos: rotinas, fila de trabalhos, worker residente, autorizações prévias e k6.',
  execucoes: 'Execuções: executar uma capacidade com aprovação humana, histórico de execuções e comentário de resultado no Jira.',
  evidencias: 'Evidências: o que cada execução produziu, guardado com integridade dentro de .prumo do projeto.',
  rastreabilidade: 'Rastreabilidade: o mapa de ligações entre tickets, casos, runs, execuções e evidências.',
  metricas: 'Métricas: números reais calculados das execuções e do diário de operações.',
  historico: 'Histórico: operações do projeto consolidadas (início e término).',
  logs: 'Logs: diário de operações do CLI e do MCP e o diagnóstico técnico da janela.',
  conexoes: 'Conexões: contas de Jira, Qase e GitHub, leitura e escrita controlada nesses serviços e a conexão das IAs pelo MCP.',
  agentes: 'Agentes: chat com agentes, banco de conhecimento, políticas da IA e o servidor MCP.',
  suporte: 'Suporte: relato de bug, melhoria ou sugestão revisado localmente e consulta de chamados.',
  ajuda: 'Ajuda: documentos, versões, integrações técnicas e privacidade dos dados.',
  configuracoes: 'Configurações (Ajustes): preferências da pessoa — tema, idioma, avisos e som.',
  atualizacoes: 'Atualizações (sino): consulta de versão nova, aviso automático e atualização com um clique.',
  administracao: 'Administração: configurações gerais, usuários, permissões, monitoramento e documentação técnica.',
  aplicativo: 'Aplicativo: a janela do Windows, a bandeja, os avisos e o registro de todos os canais da janela (IPC).',
  terminal: 'Terminal: o comando prumo (CLI).',
  compartilhado: 'Compartilhado: só o que várias telas usam de verdade — segurança, erros, textos, contrato do projeto e pasta de dados.',
};
export const papeis = {
  api: 'Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.',
  regras: 'O que a tela decide: validações, cálculos e os passos de cada ação.',
  banco: 'Onde os dados são lidos e gravados neste computador (arquivos JSON e SQLite na pasta de dados do Prumo).',
  integracoes: 'Conversa com serviços de fora (Jira, Qase, GitHub ou IA), sempre pelos endereços oficiais.',
  tipos: 'Formato dos dados, listas fixas e limites. Não tem funções.',
  worker: 'O trabalhador que roda as rotinas sozinho, um trabalho por vez.',
  autorizacoes: 'Autorizações prévias e políticas aprovadas pela pessoa, com validade e limite de usos.',
  k6: 'Teste de desempenho com o executável oficial do k6, com limites e produção bloqueada.',
  aprovacao: 'A janela de senha do Windows que autoriza uma execução.',
  chat: 'O chat: escolhe o agente, responde com dados locais e, se autorizado, consulta Claude ou Codex.',
  politicas: 'O que a IA pode ou não pedir neste projeto, conferido a cada chamada.',
  mcp: 'O servidor MCP que as IAs usam: ferramentas, roteiros e o registro de cada chamada.',
  escrita: 'Escrita externa: catálogo de operações, permissão por projeto, prévia, envio único e conferência.',
  github: 'Operações no GitHub: branch prumo/..., commit de teste e Pull Request rascunho.',
  ia: 'Conexão do Codex e do Claude com o Prumo pelo MCP: proposta, configuração e teste.',
  diagnostico: 'Diagnóstico técnico das chamadas da janela (só metadados).',
  versoes: 'Histórico de versões do Prumo.',
  privacidade: 'Quanto espaço os dados ocupam e o que fica só neste computador.',
  janela: 'A janela do aplicativo e a confirmação nativa do Windows.',
  bandeja: 'O ícone do Prumo na bandeja do Windows e seu menu.',
  avisos: 'Avisos enviados à janela (eventos do worker e pedidos para abrir uma tela).',
  seguranca: 'Proteções usadas por todas as telas: caminhos seguros, sem atalhos, segredos mascarados.',
  projeto: 'Leitura e validação do contrato qa.project.json de uma pasta.',
  erros: 'Erros com código fixo e jeitos seguros de tratar falhas.',
  texto: 'Pequenas funções de texto usadas em várias telas.',
  runs: 'Runs do Qase preparadas, executadas e publicadas pelo Prumo.',
  conhecimento: 'Banco de conhecimento dos agentes.',
  conversas: 'Conversas antigas do chat (até a 2.9).',
};
const primeiraLinha = (arq) => { const l = fs.readFileSync(arq, 'utf8').split(/\r?\n/); const p = l[0].startsWith('#!') ? l[1] : l[0]; return (/^\/\*\* (.*) \*\/$/.exec(p ?? '') ?? [, '(sem descrição)'])[1]; };
const tabela = (pasta) => {
  const arqs = fs.readdirSync(pasta).filter((n) => n.endsWith('.ts')).sort((a, b) => a.localeCompare(b));
  return ['| Arquivo | O que faz |', '| --- | --- |', ...arqs.map((n) => `| \`${n}\` | ${primeiraLinha(path.join(pasta, n)).replaceAll('|', '\\|')} |`)].join('\n');
};

export function gerarLeiaMe() {
  const saida = new Map();
  const pastasTela = fs.readdirSync(raiz, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  const indice = ['# Backend do Prumo QA', '', 'Arquivo gerado por `npm run leia-me` a partir da primeira linha de cada arquivo. Não edite à mão.', '',
    'Cada pasta tem o nome de uma tela do aplicativo (a mesma pasta existe em `frontend/`). Dentro dela: `api/` recebe os pedidos da janela, `regras/` decide, `banco/` lê e grava os dados deste computador, `integracoes/` fala com serviços de fora e `tipos/` descreve o formato dos dados.', '',
    '## Portas de entrada', '', '| Arquivo | O que faz |', '| --- | --- |',
    ...['aplicativo.ts', 'cli.ts', 'mcp.ts'].map((n) => `| \`${n}\` | ${primeiraLinha(path.join(raiz, n))} |`), '',
    '## Telas', '', '| Pasta | Para que serve |', '| --- | --- |', ...pastasTela.map((t) => `| [\`${t}/\`](${t}/LEIA-ME.md) | ${telas[t] ?? '(sem explicação)'} |`), ''];
  saida.set(path.join(raiz, 'LEIA-ME.md'), indice.join('\n'));
  for (const t of pastasTela) {
    const dir = path.join(raiz, t); const linhas = [`# ${t} — backend`, '', telas[t] ?? '(sem explicação)', '', 'Arquivo gerado por `npm run leia-me`. Não edite à mão.', ''];
    const soltos = fs.readdirSync(dir).filter((n) => n.endsWith('.ts'));
    if (soltos.length) linhas.push('## Nesta pasta', '', tabela(dir), '');
    for (const sub of fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
      linhas.push(`## ${sub}/`, '', papeis[sub] ?? '(sem explicação)', '', tabela(path.join(dir, sub)), '');
    }
    saida.set(path.join(dir, 'LEIA-ME.md'), linhas.join('\n'));
  }
  return saida;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const [arq, texto] of gerarLeiaMe()) fs.writeFileSync(arq, texto);
  console.log('LEIA-ME do backend atualizados.');
}
