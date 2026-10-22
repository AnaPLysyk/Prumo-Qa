/** Catálogo da Documentação Viva: telas, responsabilidades e canais IPC, sem duplicar arquivos de leitura. */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const raiz = 'backend';
export const telas = {
  contas: 'Contas: cadastro e autenticação online, recuperação por e-mail e administração de acessos; profissão não concede privilégio.',
  inicio: 'Início: o painel do projeto e o assistente local que responde com os dados deste computador, sem IA.',
  projetos: 'Projetos: projetos do Prumo, pastas de código vinculadas e o contrato qa.project.json.',
  tickets: 'Tickets: tickets do Jira e propostas de caso e de bug em rascunho, publicadas só com confirmação.',
  testes: 'Testes: IDE, Repositório, Runs e Planos — casos, automações, execuções com aprovação humana, evidências, vínculos e o comentário de resultado no Jira.',
  agendamentos: 'Agendamentos: rotinas, fila de trabalhos, worker residente, autorizações prévias e k6.',
  metricas: 'Métricas: números reais calculados das execuções e do diário de operações.',
  voz: 'Voz: transcrição local do que a pessoa fala (Whisper), sem enviar áudio para fora; o modelo é baixado uma vez, com confirmação.',
  logs: 'Logs: o que o aplicativo e as IAs fizeram, e o histórico das operações do projeto consolidado para o chat e as métricas.',
  conexoes: 'Conexões: contas de Jira, Qase e GitHub, leitura e escrita controlada nesses serviços e a conexão das IAs pelo MCP.',
  agentes: 'Agentes: as especializações, o chat, o Cérebro, as Skills, o conhecimento e os contextos do projeto (requisitos, regras, critérios e decisões, com aprovação humana).',
  suporte: 'Suporte: relato de bug, melhoria ou sugestão revisado localmente e consulta de chamados.',
  ajuda: 'Ajuda: documentos, versões, integrações técnicas e privacidade dos dados.',
  configuracoes: 'Configurações (Ajustes): preferências da pessoa — tema, idioma, avisos e som.',
  atualizacoes: 'Atualizações (sino): consulta de versão nova, aviso automático e atualização com um clique.',
  administracao: 'Administração: configurações gerais, usuários, papéis e permissões, agentes da plataforma, monitoramento e documentação técnica.',
  login: 'Login: entrar, sair, cadastrar, recuperar e trocar a senha, a sessão e a conferência de acesso de cada canal da janela.',
  aplicativo: 'Aplicativo: a janela do Windows, a bandeja, os avisos e o registro de todos os canais da janela (IPC).',
  terminal: 'Terminal: o comando prumo (CLI).',
  compartilhado: 'Compartilhado: só o que várias telas usam de verdade — segurança, erros, textos, contrato do projeto e pasta de dados.',
};
export const papeis = {
  controlador: 'Controller: recebe os pedidos IPC, validações e confirmações e encaminha à lógica do serviço; permissões continuam por canal.',
  servico: 'Service: reúne o ciclo de vida e as regras de negócio de uma funcionalidade.',
  repositorio: 'Repository: lê, grava, atualiza e remove dados no banco ou armazenamento local.',
  contratos: 'Schemas e tipos para entradas, saídas e validação de dados.',
  api: 'Infraestrutura central de registro e validação dos canais IPC.',
  regras: 'Serviços e regras de negócio existentes, a consolidar por ciclo funcional.',
  banco: 'Repositórios existentes em JSON e SQLite, a consolidar por domínio.',
  integracoes: 'Conversa com serviços de fora (Jira, Qase, GitHub ou IA), sempre pelos endereços oficiais.',
  tipos: 'Contratos existentes, listas e limites de cada domínio.',
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
  skills: 'As Skills dos agentes (SKILL.md e referências) que acompanham o aplicativo; viram trechos aprovados no banco de Skills.',
  reporters: 'Relatores (Playwright e node:test) que gravam o resultado de cada caso no formato do Prumo, para usar nos projetos.',
  exemplos: 'Projeto de demonstração e planos de exemplo usados pela demonstração e pelos testes.',
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
  servidor: 'Rotas HTTP desta área que rodam no Render; login e suporte continuam nas suas próprias pastas. Diferente dos canais IPC do Electron.',
};

/** Obtém o controlador real de cada canal IPC e documenta sua localização automaticamente. */
export function gerarArquivosDosCanais() {
  const arquivos = fs.readdirSync(raiz, { recursive: true }).map(String)
    .filter(n => path.basename(n).startsWith('controlador') && n.endsWith('.ts'));
  const porFuncao = new Map();
  for (const rel of arquivos) {
    const caminho = path.join(raiz, rel).split(path.sep).join('/');
    const texto = fs.readFileSync(caminho, 'utf8');
    for (const m of texto.matchAll(/export (?:const|async function|function) ([A-Za-z][A-Za-z0-9_]*)/g)) {
      if (porFuncao.has(m[1])) throw new Error('Controlador repetido: ' + m[1]);
      porFuncao.set(m[1], caminho);
    }
  }
  const registro = fs.readFileSync(path.join(raiz, 'aplicativo', 'api', 'registrarCanaisIpc.ts'), 'utf8');
  const linhas = []; const vistos = new Set();
  for (const m of registro.matchAll(/registrarCanal\('([a-z]+:[a-z]+)',\s*([A-Za-z][A-Za-z0-9_]*)\)/g)) {
    const [, canal, nome] = m;
    if (vistos.has(canal)) throw new Error('Canal repetido: ' + canal);
    vistos.add(canal);
    const arquivo = porFuncao.get(nome);
    if (!arquivo) throw new Error('Canal sem controlador: ' + canal + ' -> ' + nome);
    linhas.push([canal, "  '" + canal + "': '" + arquivo + " > " + nome + "',"]);
  }
  linhas.sort((a,b) => a[0].localeCompare(b[0]));
  return '/** Local de atendimento de cada canal. Gerado automaticamente dos controladores. */\nexport const arquivosDosCanais: Record<string, string> = {\n' + linhas.map(l => l[1]).join('\n') + '\n};\n';
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const destino=path.join(raiz,'aplicativo','api','arquivosDosCanais.ts');
  const texto = gerarArquivosDosCanais();
  if (!fs.existsSync(destino) || fs.readFileSync(destino,'utf8') !== texto) fs.writeFileSync(destino,texto);
  console.log('Catálogo de canais da Documentação Viva atualizado.');
}
