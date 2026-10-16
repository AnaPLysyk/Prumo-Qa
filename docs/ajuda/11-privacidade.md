# Política de privacidade (rascunho)

Eu escrevi este rascunho a partir do que o Prumo faz hoje. Ele ainda precisa de revisão jurídica antes de distribuição ampla e não afirma conformidade com leis ou certificações.

## Onde ficam os dados

Tudo fica na pasta de dados do Prumo neste computador:

- Windows: %LOCALAPPDATA%\PrumoQA
- macOS: ~/Library/Application Support/PrumoQA
- Linux: ~/.local/share/prumo-qa

Dentro dela:

- **projects**: histórico de operações (identificadores com hash, ferramenta, cliente declarado, estado, duração, contagens). Não guarda o texto de requisitos nem respostas completas.
- **diagnostico**: canal, estado, duração e código das chamadas da janela; nunca argumentos, caminhos ou conteúdo.
- **integracoes**: testes de protocolo MCP (cliente, hashes, horários, resultado). Até 1000 registros por projeto; não guarda credenciais.
- **contextos**: requisitos e regras que você cadastra, com histórico.
- **plataforma**: contas de login (só resumos de senha, nunca a senha), projetos, conexões e vínculos, tokens protegidos pelo cofre do sistema (DPAPI no Windows, Keychain no macOS, gnome-keyring ou KWallet no Linux), agenda, fila, autorizações (validade e hash do escopo, nunca senha), rascunhos locais e registro das operações externas.
- **preferencias.json**: tema, idioma, avisos e se o Prumo inicia com o sistema (desligado por padrão).

Na pasta de cada projeto, **.prumo** guarda evidências e relatórios das execuções, com logs mascarados.

Nada é apagado sozinho. Você exclui quando quiser, em **Ajuda › Privacidade e dados**. Desinstalar mantém os dados.

## O que sai deste computador

- **Jira, Qase e GitHub**: só quando você consulta ou publica. Vai a sua credencial ao endereço oficial do serviço, com os filtros escolhidos ou o conteúdo que você revisou e confirmou (ticket, defeito, issue, comentário, caso, run, resultado). Nenhum código, log completo ou caminho local é anexado sem você escolher o arquivo.
- **IA por MCP**: o servidor responde ao cliente de IA que o iniciou. O que ele devolve passa a ser tratado por esse cliente e pelo provedor dele. Contextos só vão se você habilitar para o projeto.
- **IA externa no chat** (opcional): se você autorizar, a pergunta e os fatos locais usados na resposta vão ao Claude ou Codex instalado, com a sua conta.
- **k6**: tráfego de teste só para o destino que você declarou.
- **Atualizações**: consulta HTTPS à release mais recente no GitHub (ao abrir, a cada 6 horas e quando você clica), sem enviar dados seus. O servidor vê o seu IP, como em qualquer conexão.
- **Suporte**: consultar um chamado faz GET público ao GitHub pelo número. Abrir formulário ou chamado usa o navegador, depois da sua confirmação; quem publica é você.

## O que não é coletado

Nenhuma telemetria, rastreamento, upload de logs ou sincronização. Exportar logs é ação sua e grava só onde você escolher.
