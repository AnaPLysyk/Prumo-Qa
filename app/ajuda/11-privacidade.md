# Política de privacidade (rascunho)

Rascunho técnico consistente com o funcionamento atual. Requer revisão humana e jurídica antes de qualquer distribuição ampla. Não afirma conformidade com leis ou certificações.

## O que é armazenado, e onde

- **Histórico de operações**: %LOCALAPPDATA%\PrumoQA\projects. Identificadores com hash, ferramenta, cliente declarado, estado, duração, contagens de achados e referências a evidências. Não guarda o texto de requisitos nem respostas completas.
- **Diagnóstico da interface**: %LOCALAPPDATA%\PrumoQA\diagnostico. Somente canal, estado, duração, código e correlação das chamadas da janela; nunca argumentos, caminhos ou conteúdo. Não entra nas métricas.
- **Testes de protocolo**: %LOCALAPPDATA%\PrumoQA\integracoes. UUID, cliente selecionado, hashes de projeto/configuração, horários e resultado de handshake/listagem/leitura. Não armazenam conteúdo das evidências consultadas nem credenciais. Sem retenção automática; limite de 1000 registros por projeto. A exclusão de histórico operacional não apaga esses registros separados; arquivamento é manual com os processos parados.
- **Contextos**: %LOCALAPPDATA%\PrumoQA\contextos. Requisitos e regras que você cadastra, por projeto, com histórico verificável. Só vão ao agente de IA se você habilitar essa opção para o projeto, e então o provedor da IA conectada pode processar o texto.
- **Projetos vinculados**: %LOCALAPPDATA%\PrumoQA\vinculos.json (caminhos locais que você escolheu).
- **Evidências de execução**: pasta .prumo/evidencias dentro de cada projeto, com logs mascarados.
- **Dados internos da janela**: %LOCALAPPDATA%\PrumoQA\app.
- **Agenda e execuções (2.8)**: %LOCALAPPDATA%\PrumoQA\plataforma (agenda.json, fila.json, autorizacoes.json, publicacoes-jira.json e worker-trava.json). Rotinas, resultados, autorizações (com validade e hash do escopo, nunca senha) e o texto dos comentários preparados para o Jira. Não guardam credenciais nem respostas remotas.
- **Preferências**: %LOCALAPPDATA%\PrumoQA\preferencias.json, por usuário do Windows: tema, idioma, avisos e se o Prumo inicia com o Windows (desligado por padrão).

## Retenção

Sem retenção automática: nada é apagado sozinho. Você exclui quando quiser, em Privacidade e dados.

## O que é enviado a terceiros

Nas consultas explícitas Jira/Qase/GitHub, o processo principal envia a credencial ao host oficial do serviço, junto dos IDs, filtros e parâmetros de paginação escolhidos. Nenhum documento, código ou log local é anexado. Respostas não são persistidas como cache nem transferidas automaticamente para IA. Tokens ficam protegidos pelo Windows em plataforma/credenciais.json; metadados de conexões/vínculos ficam em plataforma, com contextos de projetos manuais na estrutura própria espacos. Remover conexão elimina a credencial; remover vínculo preserva histórico.

Ao publicar um comentário de resultado no Jira (manual, depois da sua confirmação, ou agendado com uma política aprovada por você), o processo principal envia ao Jira Cloud do projeto vinculado, com a sua credencial, o texto do comentário: ticket, tipo, ambiente, contagem de cenários, resumo das falhas e a referência local da evidência. Nenhum arquivo, log completo ou caminho é anexado. As rotinas de k6 enviam tráfego de teste somente ao destino que você declarou.

O servidor MCP responde ao cliente de IA que o iniciou. O que ele devolve (contexto autorizado, análises, evidências) passa a ser tratado por esse cliente e por seu provedor. O Prumo não recebe as conversas da IA.

Para avisar de versões novas, o aplicativo consulta a release mais recente no GitHub ao abrir e a cada 6 horas (aviso automático, ligado por padrão e desligável em Ajuda › Atualizações) e quando você clica em verificar. É uma requisição HTTPS sem enviar logs, projetos, caminhos ou identificadores. Como em qualquer conexão, o servidor remoto vê o seu endereço IP e dados normais de rede; isso não é anonimato.

A preferência de verificar ao abrir é opcional. Consultar chamado faz GET público ao GitHub oficial usando somente o número informado, sem autenticação, upload ou sincronização de dados. Preparar suporte é local; abrir o formulário ou o chamado usa o navegador após confirmação nativa. Quem publica relatos e comentários é você.

## O que não é coletado

Nenhuma telemetria, rastreamento, upload de logs ou sincronização. Exportar logs é ação sua e grava apenas onde você escolher.

## Desinstalação

Desinstalar remove o programa, mas mantém seus dados e evidências.
