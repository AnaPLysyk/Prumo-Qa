'use strict';
// Traduções do painel de atividades v41; registros (ferramentas, estados, perguntas) não são traduzidos.
Object.assign(window.PRUMO_EN, {
  'Baixar instalador no site oficial': 'Download installer from the official site',
  'Clientes, agentes e o worker trabalhando, em tempo real. Só aparecem ligações que os registros deste computador comprovam.': 'Clients, agents and the worker at work, in real time. Only links proven by this computer\'s records are shown.',
  'Clientes → núcleo Prumo': 'Clients → Prumo core', 'Orchestrator → agentes': 'Orchestrator → agents', 'Worker → rotinas': 'Worker → routines',
  '{n} operações registradas': '{n} recorded operations', '{n} conversas': '{n} conversations', '{n} execuções': '{n} runs',
  '{n} conversas roteadas': '{n} routed conversations', '{n} respostas delegadas pelo chat': '{n} answers delegated by the chat', '{n} execuções na fila do projeto': '{n} runs in the project queue',
  '{n} tentativas': '{n} attempts', '{a} achados · {g} lacunas': '{a} findings · {g} gaps', 'resposta local': 'local answer', 'fontes: {f}': 'sources: {f}',
  'Ao vivo': 'Live', 'Zoom': 'Zoom', 'Afastar': 'Zoom out', 'Aproximar': 'Zoom in', 'Ajustar à tela': 'Fit to screen', 'Tela cheia': 'Full screen', 'Tela cheia indisponível nesta janela.': 'Full screen is unavailable in this window.',
  'Arraste para mover, use a pinça ou Ctrl + roda para o zoom. Teclado: setas movem, + e − aproximam, 0 ajusta à tela. Cada linha liga registros gravados neste computador.': 'Drag to move, pinch or Ctrl + wheel to zoom. Keyboard: arrows move, + and − zoom, 0 fits to screen. Each line links records stored on this computer.',
  'Canvas de atividades dos agentes': 'Agent activity canvas', 'Pulso: registrado nos últimos 90 s': 'Pulse: recorded in the last 90 s', 'Delegação do chat à IA externa': 'Chat delegation to external AI',
  'ATIVO': 'ACTIVE', 'Guia do sistema': 'System guide', '+{n} anteriores': '+{n} older', 'Ver em Execuções': 'View in Runs', 'Ver no Histórico': 'View in History',
  'Nenhuma atividade registrada ainda': 'No activity recorded yet',
  'Quando um cliente MCP chamar o núcleo, o chat responder ou o worker executar uma rotina, a janela aparece aqui. Nenhum agente executando foi inferido.': 'When an MCP client calls the core, the chat answers or the worker runs a routine, its window appears here. No running agent was inferred.',
  'Histórico do núcleo indisponível.': 'Core history unavailable.', 'Execuções indisponíveis.': 'Runs unavailable.',
  'Conversa com {a}': 'Conversation with {a}', 'Gravada somente neste computador. Resposta {m}.': 'Stored on this computer only. Answer: {m}.', 'local, sem modelo de IA': 'local, no AI model',
  'Execução {r}': 'Run {r}', 'Registro da fila do worker. Evidência e logs completos ficam em Execuções.': 'Worker queue record. Full evidence and logs are in Runs.', 'Abrir Execuções': 'Open Runs',
  // Avaliação do atendimento no chat (2.10)
  'Útil': 'Helpful', 'Não ajudou': 'Not helpful',
  // Abas de Testes sem tradução (a heurística do teste de idioma não as detecta)
  'Casos Qase': 'Qase cases', 'CI e GitHub': 'CI and GitHub',
  // Aviso automático de versão nova (2.10.1)
  'Com o aviso automático ligado (padrão), o Prumo consulta só a release mais recente do repositório oficial no GitHub ao abrir e a cada 6 horas, mesmo minimizado na bandeja, e avisa uma vez por versão: no sino e com uma notificação do Windows. Você também pode verificar a qualquer momento pelo botão acima. É enviada apenas uma requisição HTTPS comum (sem logs, projetos, caminhos ou identificadores); o servidor remoto vê, como em qualquer conexão, o seu endereço IP. Isto não é anonimato. Nada é baixado nem instalado automaticamente.': 'With automatic notice on (default), Prumo queries only the latest release of the official repository on GitHub when it opens and every 6 hours, even minimized to the tray, and tells you once per version: on the bell and with a Windows notification. You can also check at any time with the button above. Only a plain HTTPS request is sent (no logs, projects, paths or identifiers); the remote server sees your IP address, as in any connection. This is not anonymity. Nothing is downloaded or installed automatically.',
  'Avisar quando houver versão nova (consulta o GitHub ao abrir e a cada 6 horas)': 'Notify me when a new version is available (checks GitHub on opening and every 6 hours)',
  // Projeto selecionado que é pasta com contrato local (2.10.2)
  'Projeto selecionado: {n}. É uma pasta com contrato local, listada no fim desta página.': 'Selected project: {n}. It is a folder with a local contract, listed at the end of this page.', 'Ver pasta': 'View folder',
  // Descrições pesquisáveis dos painéis da Ajuda (2.10.2)
  'Verificar se há versão nova e atualizar com um clique: o Prumo baixa o instalador oficial, confere o SHA-256 e reabre atualizado. Aviso automático, sino e som.': 'Check for a new version and update with one click: Prumo downloads the official installer, checks the SHA-256 and reopens updated. Automatic notice, bell and sound.',
  'Histórico de versões: novidades, segurança, compatibilidade, limitações conhecidas e migração de dados de cada versão.': 'Version history: what is new, security, compatibility, known limitations and data migration for each version.',
  'Integrações técnicas: operações IPC da janela e ferramentas MCP para agentes de IA, com permissões, erros e proteções.': 'Technical integrations: window IPC operations and MCP tools for AI agents, with permissions, errors and protections.',
  'Privacidade e dados deste computador: pasta de dados, categorias, retenção, exportação e exclusão.': 'Privacy and data on this computer: data folder, categories, retention, export and deletion.',
  // Atualizar com um clique (2.10.2)
  'Atualizar agora': 'Update now', 'Conferindo a release oficial…': 'Checking the official release…', 'Baixando o instalador e conferindo o SHA-256…': 'Downloading the installer and checking the SHA-256…', 'A consulta não foi concluída; tente de novo.': 'The check did not complete; try again.',
  // Cérebro com teste de pergunta e Painel com orquestrações na coluna (2.11)
  'Orquestrações': 'Orchestrations', 'Palavras de roteamento': 'Routing words', '{n} palavras': '{n} words', 'Termos aprendidos': 'Learned terms', '{n} termos': '{n} terms', 'Vocabulário': 'Vocabulary',
  'Testar uma pergunta': 'Test a question', 'Simular': 'Simulate', 'Limpar': 'Clear', 'Ex.: oi, quais testes de API falharam?': 'E.g.: hi, which API tests failed?',
  'Mostra o caminho que o chat faria agora com esta pergunta. Não chama IA e não grava nada.': 'Shows the path the chat would take now with this question. It does not call AI and records nothing.',
  'Orquestraria: ': 'Would orchestrate: ', 'Responderia: ': 'Would answer: ', ' · este agente participa': ' · this agent takes part', ' · outro agente atende': ' · another agent answers',
  '{n} pts': '{n} pts', 'menção': 'mention', 'aprendido +{n}': 'learned +{n}', 'Nenhuma palavra conhecida: o Prumo Orchestrator atende por padrão.': 'No known word: Prumo Orchestrator answers by default.',
  'Se este agente responder: {s} trechos de Skill ({o} ficam de fora) e {c} conhecimentos aprovados. Os usados acendem no anel.': 'If this agent answers: {s} Skill excerpts ({o} left out) and {c} approved knowledge items. The ones used light up on the ring.',
  'Termos considerados: {t}': 'Terms considered: {t}', 'Testar e consultar o cérebro': 'Test and inspect the brain', 'Neurônios acesos': 'Lit neurons', 'Ticket → caso → automação → execução → evidência → defeito.': 'Ticket → case → automation → run → evidence → defect.',
});
