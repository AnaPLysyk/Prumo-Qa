# Segurança e limites de confiança

## Autenticação online (MVP em desenvolvimento, ainda não publicada)

A nova arquitetura mantém o login visual em `frontend/login/`, a autorização e a sessão IPC em `backend/login/` e a API central no Render em `backend/login/servidor/`. O processo principal do Electron envia e-mail e senha por HTTPS para Better Auth, que valida os hashes de senha, os e-mails e as sessões em PostgreSQL. A senha **não é gravada nos arquivos locais do Prumo**; o cookie de sessão fica somente no processo principal, sem acesso do Renderer. Sair revoga a sessão remota e encerra a sessão local. Pastas de dados são separadas por identidade autenticada, mas arquivos já presentes no perfil do Windows não são automaticamente apagados e não estão protegidos de outros usuários com acesso ao mesmo perfil do sistema operacional.

O servidor de autenticação ainda não está pronto para contas reais: sem URL HTTPS, segredo forte, banco persistente, migração e envio de e-mail configurados, o acesso deve recusar. O PostgreSQL gratuito atual expira em 12/11/2026, portanto não deve guardar contas reais sem plano de persistência. Os trechos abaixo documentam o **login legado**, não descrevem o comportamento futuro do Better Auth.

## Preparação do banco de contas central

O serviço de produção é `prumo-qa-servico` e o PostgreSQL interno é `prumo-qa-contas-db`. O Blueprint conecta `DATABASE_URL` pelo nome do banco; a declaração em `render.yaml` **não configura automaticamente** serviços já criados pela API. Conferir a conexão efetiva em **Render › prumo-qa-servico › Environment**; não abrir acesso público ao PostgreSQL. A credencial publicada em uma conversa deve ser rotacionada antes do uso com contas reais.

Na mesma tela, `BETTER_AUTH_URL` deve ser `https://prumo-qa-servico.onrender.com`, `BETTER_AUTH_SECRET` deve ser gerado aleatoriamente (mínimo de 32 caracteres), e `RESEND_API_KEY` e `PRUMO_EMAIL_REMETENTE` devem ser configurados para um domínio remetente verificado. Não inserir essas credenciais em Git, logs, testes ou mensagens. A ausência de qualquer parte deixa `/api/auth/*` e `/saude/autenticacao` indisponíveis (503), mantendo outras rotas operacionais.

A migração de produção **não é automática**. A partir do backend remoto, depois de garantir plano de persistência para o banco, conexão interna, rotação de senha e backup verificado:

1. Executar `npm run auth:migrar:prod` com as variáveis do ambiente de produção para consultar a quantidade de alterações, sem gravar nada.
2. Revisar o preview, confirmar backup recuperável e autorizar explicitamente `PRUMO_APROVAR_MIGRACAO_PROD=SIM`, `PRUMO_BACKUP_CONFIRMADO=SIM`, `PRUMO_CREDENCIAL_ROTACIONADA=SIM` **somente no processo manual de migração**, não como variáveis permanentes do servidor.
3. Executar `npm run auth:migrar:prod` novamente e conferir `/saude/autenticacao` (HTTP 200). O endpoint verifica conexão **e** tabelas `user`, `session`, `account`, `verification` e `rateLimit` (usada para limitar tentativas por banco). Antes disso, 503 é o estado seguro.
4. Validar cadastro, confirmação de e-mail, login, logout e recuperação de senha em uma conta de teste, sem publicar senhas ou tokens.

O PostgreSQL gratuito do Render informa exclusão em 12/11/2026, salvo atualização do plano. Não usar essa instância como armazenamento definitivo de contas reais sem uma solução de continuidade/backup.

## Preparação do login social central (GitHub e Google)

O servidor Better Auth aceita GitHub e Google como **provedores de identidade**, sem confundir essa autorização com as conexões de repositórios realizadas depois do login. Cada provedor só é habilitado se tiver **Client ID e Client Secret**, configurados exclusivamente no Render:

- GitHub: `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET`. Callback HTTPS no OAuth App: `https://prumo-qa-servico.onrender.com/api/auth/callback/github`. Escopos de perfil e e-mail, **sem** `repo`.
- Google: `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`. URI de redirecionamento autorizada: `https://prumo-qa-servico.onrender.com/api/auth/callback/google`.

Um par incompleto não habilita o provedor nem altera o acesso por e-mail. O próprio login social **não está habilitado na interface Electron remota** até existir e ser testado o retorno seguro navegador → aplicativo, com verificação de estado, PKCE, proteção contra sessão trocada e vínculo explícito de contas antigas. A implementação de OAuth local legado é separada e não deve receber credenciais do Better Auth. Não adicionar Client Secrets ao instalador ou ao Git.

O instalador registra o protocolo `com.anaplysyk.prumoqa`, e o servidor carrega o plugin oficial `@better-auth/electron` somente com `PRUMO_OAUTH_DESKTOP_ATIVO=SIM`. **Não configurar essa variável no Render ainda**: o fluxo de tela web, transferência PKCE, verificação do callback e armazenamento seguro da sessão no Electron ainda não estão integrados. O cadastro por e-mail e as conexões de repositórios não dependem do protocolo.

## Em poucas palavras

O Prumo limita o que pode ler e executar, pede confirmação do sistema para ações protegidas e guarda tokens no cofre do sistema quando há suporte. O login central foi projetado para separar contas do Prumo, mas não é uma barreira de segurança entre pessoas que compartilham a mesma conta do sistema operacional. Os testes automatizados não comprovam uma autenticação humana real, e o Prumo não é uma sandbox: comandos e dependências do próprio projeto ainda precisam ser confiáveis. O instalador não tem assinatura digital; confira o SHA-256, sabendo que ele não confirma quem criou o arquivo.

## Sistemas e consolidação 2.13

O Windows mantém o broker CredUI/LogonUser. No macOS, o pedido usa autenticação administrativa do sistema via AppleScript, com o escopo passado como dado. No Linux, uma janela zenity/kdialog apresenta o escopo e pkexec/polkit autoriza a chamada; sem esses componentes o pedido é bloqueado. Esses mecanismos podem usar autorização administrativa em cache do sistema e não têm a garantia do broker Windows de exigir a senha da mesma conta em cada pedido. O nome registrado em macOS/Linux é o usuário do processo, não uma identidade autenticada retornada pelo sistema. Escopo inválido ou expirado é recusado antes e depois do diálogo. Testes usam executores sintéticos; não comprovam autenticação humana nesses sistemas.

Credenciais usam o cofre do Electron (DPAPI, Keychain ou Secret Service/KWallet). O backend `basic_text` do Linux é recusado. A gravação JSON sincroniza o arquivo temporário em disco antes da substituição. Ao atingir o limite de autorizações, só registros sem poder vigente podem liberar espaço; autorizações vigentes não são descartadas. Tokens fine-grained do GitHub e tokens Atlassian são mascarados também sem rótulo, e respostas MCP preservam o código contratual do erro.

## Login local e permissões — legado (2.12)

- **O Prumo não abre sem entrar (2.14).** Sem nenhuma conta, só o primeiro acesso é atendido: criar a primeira conta, de Administrador, ou guardar o Client ID e o segredo do GitHub/Google para criá-la pelo provedor (`acesso:github`, `acesso:google`). Quem está num computador sem contas vira Administrador de qualquer jeito, então isso não amplia o acesso; assim que existe uma conta, configurar o provedor volta a exigir a Administração. Todos os outros canais recusam com `LOGIN_SETUP_REQUIRED` e a janela mostra só a entrada. Antes de entrar também atendem o idioma da janela (só na janela, salvo nas preferências depois do login) e `site:abrir` (endereço fixo do site oficial, com confirmação nativa). Criar a conta cria `acessos.json` na pasta `plataforma` dos dados, separado de `contas.json` (contas de serviço Jira/Qase/GitHub).
- **Senhas** nunca ficam em texto: só resumo scrypt com sal próprio. A senha temporária aparece uma única vez. Não existe mais código de recuperação: a senha nova sai de um código mandado ao e-mail (veja abaixo). Respostas, logs e diagnóstico nunca os contêm; erro de login não diz se o usuário existe.
- **Sessão** só na memória do processo principal, com expiração por inatividade e bloqueio da conta após tentativas erradas (ambos configuráveis). Nada de token no renderer.
- **Autorização no backend:** `registrarCanal` confere, a cada pedido, a sessão e o nível (Sem acesso, Ver, Usar) do papel na tela do canal (`backend/login/tipos/acessoDosCanais.ts`). Esconder item de menu não é a autorização. Todo canal novo precisa de uma regra ali (o compilador recusa o contrário).
- **Papéis:** o Administrador é fixo; o cadastro público nunca cria administrador; o último administrador não pode ser excluído nem rebaixado; alterar o papel ou desativar uma conta vale no próximo pedido da pessoa.
- **Limites:** o worker, a bandeja e o servidor MCP seguem com a conta do Windows e as políticas de cada projeto; a confirmação nativa para executar e publicar continua obrigatória. O login não isola dados de quem compartilha a mesma conta do Windows.

## Cadastro e senha nova por e-mail

- **Três caminhos para a conta:** e-mail confirmado por código, GitHub ou Google. O cadastro por e-mail pede nome, e-mail e senha; a conta só nasce com o código de 6 dígitos que chegou nesse e-mail. **Esqueci a senha** manda outro código ao e-mail da conta.
- **O que sai do computador:** só quando a pessoa clica em **Enviar código**, o e-mail, o código, a finalidade (`CADASTRO` ou `SENHA`) e o idioma vão por HTTPS ao serviço do Prumo (`backend/login/servidor/`, no Render), que manda a mensagem pelo Resend. Senha, nome e dados de projeto nunca saem. O endereço do serviço é fixo no código; `PRUMO_SERVICO` só o troca por outro HTTPS ou por `http://127.0.0.1` (testes).
- **No aplicativo:** o código é sorteado com `crypto.randomInt`, guardado só como resumo SHA-256 com sal aleatório, na memória do processo principal, por 10 minutos e uma única vez. Cinco erros invalidam o código; outro envio para o mesmo e-mail só depois de 60 segundos. Fechar o Prumo descarta tudo. Código errado em **Esqueci a senha** conta para o bloqueio da conta, como senha errada.
- **Sem revelar quem tem conta:** em **Esqueci a senha**, e-mail sem conta (ou de conta desativada) recebe a mesma resposta e nada é enviado. No cadastro, e-mail já usado é recusado (`EMAIL_TAKEN`), como o login repetido era.
- **No serviço:** não há banco; nada fica guardado. Pedido fora do formato é recusado (só e-mail, código de 6 dígitos, finalidade e idioma; texto do e-mail fixo). Limites: 3 códigos por e-mail a cada 10 minutos, 10 por dia, 30 por IP por hora e 300 no total por hora. O registro mascara o e-mail e nunca mostra o código. A chave do Resend fica só nas variáveis do serviço, nunca no aplicativo distribuído.
- **Limites conhecidos:** o serviço é público (qualquer um pode pedir que ele mande um código a um e-mail; os limites seguram o abuso). Os contadores ficam na memória e zeram quando o serviço reinicia. Sem internet ou com o serviço fora do ar, não dá para criar conta por e-mail nem pedir senha nova; GitHub, Google e a senha temporária da Administração continuam funcionando. Contas antigas guardam o resumo do código de recuperação, que não é mais aceito.

## Chamados de suporte (2.17)

- **Sem GitHub para quem abre:** o chamado sai pelo serviço do Prumo (`backend/suporte/servidor/`), que o grava como issue num repositório **privado** da equipe com um token fine-grained restrito a esse repositório (Issues e Contents). O token fica só nas variáveis do serviço.
- **O que sai do computador:** só quando a pessoa clica em **Enviar chamado**, depois da revisão: o texto revisado (segredo bloqueia o envio), o nome e o e-mail da conta e só o que ela marcou (versão, sistema, diagnóstico), mais os anexos escolhidos. Logs, evidências e código do projeto nunca vão sozinhos.
- **Anexos:** escolhidos no diálogo do sistema; o caminho fica no processo principal e a janela recebe só um id. Tipo pela assinatura do arquivo (PNG, JPEG, WebP, MP4, WebM), extensão coerente, tamanho e quantidade limitados, conferidos de novo no envio e de novo no serviço. Arquivo que não é comum (atalho, pasta) é recusado.
- **Chave do chamado:** 256 bits aleatórios, mostrados uma vez ao aplicativo e guardados no cofre do sistema (`chamados-de-suporte.json` só tem a versão protegida). O serviço guarda só o resumo SHA-256. Chave errada e chamado inexistente respondem igual. Cada conta só lista e abre os próprios chamados.
- **Administração › Chamados:** só contas com a marca admin. A chave de administração do serviço (32+ caracteres) fica no cofre do sistema e nunca volta para a janela; o serviço a compara em tempo constante e bloqueia por uma hora o IP com 10 erros. Anexos chegam à janela só se o tipo for imagem ou vídeo permitido e são mostrados por `blob:` (a CSP da janela passou a aceitar `blob:` em `img-src` e `media-src`, nada de origem externa).
- **No repositório:** o texto da pessoa vai dentro de blocos de código com cerca maior que qualquer sequência do texto (menção, link e HTML sem efeito) e caracteres de controle e de direção de texto são removidos. Os anexos só são gravados em `chamados/<número>/` com nome limpo.
- **Limites:** 10 chamados por IP por hora e 200 no total; anexos e leituras com limite por IP; corpo de até 32 KB para o texto. Os registros do serviço não mostram texto, nome, e-mail nem chaves.

## Verificação em duas etapas (2.17)

- Ligada na conta (**Minha conta**, pede a senha atual) ou exigida pela Administração para todas as contas com e-mail. Depois da senha certa, a sessão **não** abre: o núcleo manda um código de 6 dígitos ao e-mail da conta (finalidade `ENTRADA`, que a janela não consegue pedir para um e-mail qualquer) e devolve só um desafio aleatório e o e-mail mascarado.
- O código vale 10 minutos, uma vez, com 5 tentativas; o desafio vale 10 minutos e fica só na memória. Código errado conta para o bloqueio da conta, como senha errada. A mensagem avisa para trocar a senha se a pessoa não tentou entrar.
- Contas sem e-mail e entradas pelo GitHub ou Google não passam pela segunda etapa (o provedor já autentica).

## Isolamento entre contas (2.17)

- **Perfil e histórico com os agentes são de cada conta:** **Meu perfil** (como chamar, papel, experiência, foco e a autorização de compartilhar com a IA) e os atendimentos dos agentes ficam ligados à conta da sessão. Outra conta no mesmo computador não vê, não usa e não avalia nada disso.
- **Sem sessão, nada pessoal:** worker, bandeja, servidor MCP e linha de comando rodam sem conta do Prumo; nesses caminhos o perfil é vazio e nada pessoal é gravado. A IA externa conectada por MCP não recebe nome nem papel de ninguém.
- **Dados antigos:** o perfil gravado antes da 2.17 (um por computador), os atendimentos sem dono e as conversas com texto de até a 2.9 continuam no disco, mas não aparecem para nenhuma conta.
- **Agentes criados pela pessoa:** ficam no núcleo (`plataforma/agentes-pessoais.json`) com dono e projeto. Só o dono vê, edita e exclui; público, as outras contas veem só para leitura (sem o id do dono); a Administração não vê os privados. A janela não escolhe o dono. As prévias que ficavam no armazenamento da janela (até a 2.16, visíveis a todas as contas do computador) passam a ser privadas de quem abrir a tela Agentes primeiro e saem desse armazenamento.
- **O que continua compartilhado, de propósito:** projetos, conhecimento aprovado dos agentes, testes, runs e evidências são da equipe, conforme o papel de cada um. O login não isola pessoas que usam o mesmo usuário do sistema operacional: quem tem acesso aos arquivos dessa pasta tem acesso aos dados.

## Entrar com GitHub ou Google

- O Client ID fica em `acessos.json`; o Client Secret só no cofre do sistema, nunca na janela, em log ou no arquivo. Sem configuração o botão de entrar não aparece e o canal recusa (`GITHUB_LOGIN_NOT_CONFIGURED`, `GOOGLE_LOGIN_NOT_CONFIGURED`). No primeiro acesso os botões **Criar conta com o GitHub/Google** aparecem sempre e, sem configuração, pedem o Client ID e o segredo antes da autorização.
- O Prumo abre o navegador (PKCE S256 e `state` aleatório) e escuta um endereço local temporário em 127.0.0.1, porta aleatória, por 5 minutos. Só atende `GET /callback` com o Host exato e o `state` certo; o resto é recusado sem derrubar a tentativa. Cancelar, negar ou esgotar o tempo fecha o endereço.
- Pessoa nova nasce PENDENTE, sem senha, com o papel de novos cadastros. Conta pendente, desativada ou bloqueada não ganha sessão nem conexão, e o token é descartado. Só a primeira conta de uma instalação sem contas nasce Administrador.
- A identidade é o provedor mais o id numérico, nunca o login nem o e-mail.
- GitHub: escopos `read:user repo` (o `repo` lista repositórios privados). A conexão criada é só leitura; escrever exige habilitar e confirmar. Google: `openid email profile`, sem conexão, e o token é descartado depois de ler o perfil.

## IDE de Testes: escrita de arquivos (2.13)

- **Canal único:** `testes:gravar`. Grava ou cria só arquivo de teste (`*.spec.*`, `*.test.*`, `*.feature`, `test_*.py`), ou pipeline do GitHub Actions (`.github/workflows/*.yml`, sem subpastas; a confirmação avisa que é CI/CD e que só vale depois de enviado ao GitHub), dentro da pasta vinculada ao projeto, sem link simbólico (de arquivo ou de pasta), em pasta que não seja `node_modules`, `.git`, `dist`, `.prumo` e similares, e até 300 KB de texto.
- **Confirmação nativa do Windows** a cada gravação, com a pasta, o arquivo e o efeito (arquivo novo ou conteúdo substituído). A página não consegue simular essa caixa.
- **Sem sobrescrever o que a pessoa não viu:** a gravação leva o SHA-256 do conteúdo lido; se o arquivo mudou fora do Prumo, é recusada (`TEST_FILE_CHANGED`); criar sobre um arquivo existente também (`TEST_FILE_EXISTS`). A troca é atômica (arquivo temporário e renomeação) e o fim de linha original (CRLF) é preservado.
- **Segredos:** arquivo cujo conteúdo teria algo mascarado não é aberto para edição, para que a máscara nunca seja gravada por cima do valor real nem o valor real apareça na janela.
- O editor (CodeMirror 5) vem embutido no aplicativo e não usa rede nem `eval`; nada é executado ao editar. Com o login ligado, o canal exige o nível Usar na tela Testes.

## Trazer o repositório do GitHub (2.13)

- **Canal `espacos:trazer`**, com confirmação nativa do Windows (repositório, destino e efeito). Só `https://github.com/<dono>/<repositório>.git`, montado a partir do repositório vinculado e validado (sem `..`, barras extras ou caracteres que mudem o endereço).
- **Git do computador, credenciais do próprio git.** O Prumo não entrega a credencial dele ao git: o ambiente do processo filho não herda variáveis com `token`, `secret`, `password`, `api_key` ou `credential` nem `GIT_*`; repositório privado depende do Git Credential Manager da própria pessoa.
- **Opções fixas:** hooks desligados, `protocol.allow=never` (só https), `core.symlinks=false`, `core.autocrlf=false`, `transfer.fsckObjects=true`, sem submódulos, 50 commits e sem tags; tempo limite de 10 minutos.
- **Destino fixo** em `%LOCALAPPDATA%\PrumoQA
epositorios\<projeto>\<repositório>`. Atualizar só avança (fast-forward) e só numa pasta que o Prumo trouxe e cujo remoto confere; divergência é recusada sem tocar no trabalho local. Clone que falha apaga a pasta pela metade.
- Depois do clone a pasta é vinculada pelo mesmo caminho de sempre (contrato proposto e confirmado). Nada do repositório é executado.

## Refatoração da branch em desenvolvimento

Os handlers IPC exigem o `webContents` da janela principal registrada, seu frame principal e a URL exata de `index.html`. Abrir uma cópia da mesma página em outra janela não concede acesso aos canais. Argumentos continuam sujeitos aos esquemas; esta alteração não concede capacidades novas.

O seletor de testes catalogados recusa flags de migração e executável instalado na execução normal. Capturas de revisão usam o bootstrap exclusivo dos testes, conhecimento em memória e serviços sintéticos; não comprovam credenciais externas, autenticação humana ou persistência SQLite.

## Evolução 2.10.2

- **Contrato proposto para qualquer pasta de código.** Ao vincular uma pasta sem `qa.project.json`, o aplicativo lê só a lista de arquivos da raiz (sem recursão, sem seguir links, sem itens sensíveis nem pastas geradas), detecta a stack e propõe um contrato v2. O arquivo só é criado depois da confirmação nativa do Windows, que mostra pastas, comandos e observações; é a **única** escrita do Prumo na pasta do projeto. Nunca sobrescreve um contrato existente (gravação exclusiva) e, se o arquivo não passar no validador do núcleo, é apagado. O caminho vem do seletor do sistema, nunca da janela.
- **Comandos conservadores.** Só `npm run <script>` para scripts que existem no `package.json` e parecem de teste, build, lint ou typecheck (no máximo 10). Scripts com e2e, integração, deploy, publicação, migração, seed ou banco entram em `blockedByDefault`. Outras stacks (Python, Go, Java, .NET, Rust, PHP, Ruby) ficam somente leitura: o executor continua aceitando apenas node e npm. Executar continua exigindo aprovação humana a cada rodada ou escopo aprovado.
- **Arquivo do worker ilegível** (por exemplo, zerado por queda de energia) é renomeado para diagnóstico e recriado; nenhum erro de bandeja ou worker impede a janela de abrir.
- O CLI continua sem criar manifesto.

## Evolução 2.8

- **Residente na bandeja.** Fechar a janela só a esconde; o worker de agendamentos continua no mesmo processo do aplicativo. Não há serviço do Windows, tarefa agendada nem instalação de driver. Iniciar com o Windows é opcional e vem desligado. "Sair do Prumo" encerra o worker e a árvore de processos filhos (`taskkill /T /F`), registra a interrupção e libera a trava. Computador desligado ou suspenso: nada executa e o horário fica registrado como perdido.
- **Execução agendada sem contornar a aprovação humana.** O broker nativo (`aprovar.exe`) não foi alterado. A pessoa aprova uma vez um escopo exato (projeto, capability, ambiente, hash do comando e das fontes), com validade de até 30 dias, limite de usos e revogação. Mudou algo no escopo: BLOCKED. Não existe autorização global nem para comando arbitrário; o esquema da rotina recusa campos desconhecidos e a capability precisa estar no manifesto. Descrição de ticket nunca é comando.
- **Única escrita remota: comentário Jira.** POST a `https://<instancia>.atlassian.net/rest/api/3/issue/<KEY>/comment`, caminho e host fixos, IP público fixado, sem redirects, corpo limitado, projeto do ticket conferido. Manual: prévia e confirmação nativa com o texto. Agendado: política aprovada por ticket, tipo, validade e quantidade. Idempotência local mais busca do marcador no ticket. Não altera status, não cria nem edita tickets, não publica no Qase. O texto é montado só de dados locais e mascarado.
- **k6.** Executável oficial procurado só em pastas absolutas do PATH, sem shell, ambiente mínimo, usuários virtuais e duração com teto, destino `localhost` em ambiente local, produção bloqueada, mesmo escopo por hash da execução agendada.
- **Preferências e dados.** Tema, idioma, início com o Windows e avisos ficam em `preferencias.json` (por usuário do Windows). Agenda, fila, autorizações e publicações ficam em `plataforma\`. Nada disso contém credencial. A ponte da janela continua sem `ipcRenderer` livre: avisos do worker chegam por consulta periódica a um canal validado.
- **Limites de confiança.** Arquivos locais podem ser editados por quem controla a conta Windows; hashes detectam corrupção, não adulteração por administrador. A autenticação humana do Windows em execução agendada real não foi verificada em teste automatizado; os testes simulam o consentimento no runner. Veja [AGENDAMENTOS.md](AGENDAMENTOS.md).

## Evolução 2.7

Credenciais desktop de Jira/Qase/GitHub são protegidas exclusivamente pelo `safeStorage` do Electron/DPAPI no Windows. Não são herdadas do ChatGPT, devolvidas aos agentes nem persistidas em texto claro. Sem proteção, a configuração falha. O processo principal faz somente GET nos hosts oficiais permitidos, com DNS público fixado no socket TLS, timeout, limite de 2 MiB e redirects recusados. Não há servidor HTTP local nem escrita em serviços. Consulte [SERVICOS.md](SERVICOS.md) para endpoints, permissões, limites e identidade Qase por conexão.

Projetos Prumo têm UUID independente da pasta local opcional. Leituras e relações são limitadas ao vínculo selecionado, à instância e à conexão; nomes iguais não associam projetos. Não há cache persistido de respostas. Logs guardam somente metadados. Importação Jira é explícita e entra como RASCUNHO, com prévia nativa; compartilhamento de contexto ao MCP mantém o opt-in existente. Dados remotos não são instruções executáveis. Associações declaradas não são cobertura comprovada. Instrumentação de API simulada existe só no runner, não no app distribuído.

## Evolução 2.6

O diagnóstico de integração inspeciona configurações por projeção de metadados, sem devolver segredos; o teste executa exclusivamente o runtime e servidor do próprio Prumo, nunca command/args/env livres encontrados na configuração externa. A consulta SDK é `consultar_evidencias`, sem capability executável. Evidência de protocolo fica em `integracoes`, fora do projeto; SDK não conta como uso observado Codex/Claude. Identidade declarada não é autenticação, e registros antigos não comprovam UTILIZADO nesta tela.

O histórico registra referências de contextos efetivamente incluídos na resposta ou consultados na revisão: id, versão, hash, estado e finalidade; no máximo 100 por operação. Não registra texto privado, título, origem textual ou aprovador. Disponibilidade não comprova obediência do modelo. Campos novos são opcionais para manter logs anteriores legíveis.

Além da atualização descrita historicamente abaixo, a 2.6 permite consulta **explícita** de chamados públicos: GET somente em `api.github.com/repos/AnaPLysyk/Prumo-Qa/issues/<n>` e `/events?per_page=100`. Sem cookies, credenciais, redirecionamento ou upload; timeout de 8 s por requisição e até 1 MiB de resposta. O número vem de esquema estrito. Texto de issue é dado exibido por textContent; nenhum comando é formado a partir dele. Status e datas vêm dos rótulos/eventos retornados, com histórico parcial declarado; issue fechada não comprova correção publicada.

O site é gerado somente de fontes públicas selecionadas de ajuda, segurança, contratos e versões. Não inclui históricos locais, laboratório, requisitos privados ou dados de projetos; o navegador do visitante não acessa o núcleo nem o filesystem local. HTTPS do site não substitui assinatura de código Windows.

A raiz absoluta é escolhida no CLI ou na configuração local do cliente MCP. Tools não aceitam raiz nem comando livre. Não há descoberta de outros diretórios, cadastro global ou transferência de contexto entre projetos. Contrato v1 é recusado: migre explicitamente para v2.

Manifestos usam validação estrita de tipos e campos. Caminhos relativos, existência de contexto/cwd/entrypoint, arquivos regulares, tamanho, symlinks/junctions, traversal, caminhos absolutos, UNC e streams NTFS são verificados. Links são recusados inclusive quando apontam para dentro da raiz. `.env`, chaves, configurações de credenciais, Git, dependências e builds não entram no contexto. Arquivos grandes/binários são recusados ou omitidos com indicação. Leitura do contexto limita 2.000 entradas, 20 níveis, 256 KiB por arquivo e 8 MiB totais; retorno de conteúdo é truncado em 12.000 caracteres por fonte.

Conteúdo consultado é dado não confiável, nunca ordem. O núcleo não executa instruções encontradas em documentos. Uma Skill orienta a IA hospedeira contra prompt injection, mas não controla o modelo nem impede que outro software use o shell diretamente.

## Aprovação humana local

`qa run unit` registra BLOCKED sem consentimento. `qa approve unit` (ou tool com `solicitarAprovacao: true`) abre CredUI nativo do Windows. A pessoa vê projeto, raiz, capability, comando, hash do escopo e expiração, e digita sua senha Windows. O broker verifica a identidade com `LogonUser` e exige o SID da conta atual. A senha não é aceita por argumento, MCP, stdin da IA, arquivo, variável ou token; é usada em memória e não é registrada. Não há armazenamento nem reutilização de aprovação. Cancelamento, erro de autenticação, plataforma sem broker e expiração bloqueiam.

O consentimento vale uma vez, no mesmo processo, por no máximo dois minutos e para o hash do manifesto, raiz, comando, ambiente permitido, entrypoints e fontes do contexto. O escopo é recalculado antes de criar o subprocesso. Não há endpoint de “gerar aprovação”. `approved:true` é recusado pelos schemas MCP/CLI. A IA pode solicitar a janela, mas não substitui a autenticação.

O broker implementado exige senha de conta Windows compatível com LogonUser; não implementa PIN/Windows Hello, biometria, passkeys nem aprovação remota. O build compila ferramentas/empacotamento/aprovar.cs em dist/aprovar.exe com o compilador .NET do Windows PowerShell, sem alterar ExecutionPolicy; em execução o Node inicia o executável nativo. O teste automatizado comprova compilação do P/Invoke, contratos e recusa de flags/escopo expirado; **não comprova uma autenticação humana**. Testes do executor usam um double explícito apenas no processo de teste. Nenhum modo de produção permite esse double ou uma variável para desabilitar aprovação.

Essa barreira protege a interface do produto contra autorização fabricada pela IA. Não é isolamento contra administrador, credencial roubada ou processo malicioso com os mesmos direitos que possa alterar o binário/broker, chamar APIs Windows ou executar diretamente o código do projeto. CredUI é uma janela nativa; não alegamos desktop seguro. A conta deve manter sua senha fora dos arquivos lidos por agentes. Instale o Prumo em diretório protegido para uso em ambientes adversariais.

## Execução

Sem shell no spawn do núcleo. `node` aceita entrypoints locais ou `--test` com arquivos explícitos; eval, loaders, opções arbitrárias e globs são recusados. `npm` aceita apenas `run <script>` e resolve npm-cli.js junto ao executável Node, sem executar npm.cmd por shell. O npm usa seu próprio mecanismo de scripts: um script aprovado pode executar outros comandos. Portanto **scripts do projeto precisam ser confiáveis e revisados**. O Prumo não é sandbox do sistema operacional.

Somente SystemRoot/WINDIR (Windows), allowlist explícita e metadados internos da rodada atravessam para o subprocesso. PATH, HOME, NODE_OPTIONS, NODE_TEST_CONTEXT e segredos não são herdados. Para npm, PATH é construído explicitamente com o diretório do Node e System32; o npm acrescenta seus bins locais. Variáveis sensíveis ou que reconfiguram runtime são recusadas por nome. Valores permitidos são mascarados nas saídas, assim como padrões comuns de tokens, senhas, Bearer, URLs com credenciais e chaves privadas. Redação não reconhece todos os formatos possíveis: não use segredos em dados sintéticos.

Timeout e limite agregado de stdout/stderr encerram a árvore (taskkill /T no Windows, grupo de processos no Unix). Timeout/falha de spawn/limite/artefato inválido são BLOCKED. Exit code não zero é FAIL e nunca é apagado por um relatório PASS. A causa funcional/automação deve ser diagnosticada; o núcleo não adivinha.

A aprovação cobre arquivos declarados e entrypoint, não dependências transitivas fora do contexto nem alterações concorrentes após o último preflight. Permissões de host restritas e workspace estável são necessários. Scripts confiáveis ainda podem ler/gravar além da raiz ou acessar rede; não há garantia de sandbox ou contenção de scripts adversariais.

## Evidências

Cada job usa UUID, timestamps, hash da raiz e manifesto, comando sem valores de ambiente, autenticação sem senha, status da rodada, exit code, logs redigidos e casos fornecidos pelo runner. O runner recebe PRUMO_JOB_ID e PRUMO_RESULT_FILE. Relatórios exigem jobId atual, IDs únicos e evidência não vazia. Arquivo de rodada anterior não é reutilizado. Sem relatório individual, exit 0 não produz casos PASS.

Hashes verificam corrupção de payload/log. Eles não são assinatura contra reescrita por quem pode editar arquivos. Resultado do runner é fonte declarada, não atestado independente de correção. Sem registro/critério, consulta retorna NOT_RUN. BLOCKED é tentativa impedida por política/pré-condição/ambiente; NOT_RUN é ausência de execução/evidência ou caso não realizado pelo runner.

Dados permanecem em `.prumo` da raiz; projetos readonly não criam diretórios nem evidências. Contrato externo é permitido apenas com readOnly=true e commands={}; ajuda a inspecionar G3 sem editar seu repositório. G3 não tem capability executável nesta configuração. E2E continua bloqueado até revisão e prova concreta de servidor/banco isolados; nome de banco ou texto de manifesto sozinho não é essa prova.

## Observabilidade 2.1

A afirmação acima sobre `.prumo` refere-se às evidências de execução, preservadas da versão 2.0. Atividades novas ficam exclusivamente no diretório local do usuário, fora da raiz analisada, inclusive em readonly. `PRUMO_DATA_DIR` pode escolher outra pasta absoluta externa. A raiz confiável é canonizada pelo núcleo; o diretório de atividades deriva de SHA256(raiz + NUL + id). Não há índice global de projetos nem consulta cruzada. Nome/id de projeto, raiz e manifesto são identificados por hashes no arquivo; o terminal usa o contrato local para exibir o nome. Hash não é anonimização criptográfica de um valor adivinhável.

Pino escreve somente uma projeção definida pelo produto: origem categorizada, ferramenta conhecida, horários, estado, contagens, catálogo de tipos, código controlado e UUID de evidência. Entradas MCP malformadas também geram operações, mas seus valores livres não entram no log. Não há dump de argumentos/respostas, mensagens de erro arbitrárias, env, credenciais, conteúdo de arquivo ou requisito. A identificação Codex/Claude é declarada no handshake e pode ser falsificada por outro cliente; não autentica a pessoa. Término significa resposta produzida pelo servidor, não confirmação de entrega pela IA ou de aplicação de sugestões.

Cada chamada abre um JSONL exclusivo (`wx`, UUID), escreve início, fecha/fsync; só o seu término faz append nesse arquivo. Isso separa escritas concorrentes entre processos sem lock compartilhado ou daemon. Pastas são criadas com modo 0700 e arquivos 0600 onde o SO aplica esses modos; no Windows o diretório do perfil depende das ACLs herdadas. Verificamos symlinks/junctions em ancestrais, arquivos regulares, hardlinks, schema, vínculo raiz/projeto, pares início/término, contagens e SHA256. Não é sandbox contra outro processo com os mesmos direitos alterando o filesystem entre verificações, nem trilha assinada à prova de adulteração pelo dono da conta.

Limites: 10.000 arquivos, 32 KiB por arquivo, 32 MiB por leitura. Não há retenção destrutiva automática; arquivamento é manual, com escritores parados. Consulta informa registros inválidos e não os conta. Linha final parcial preserva o início válido e mostra erro de integridade. Inícios sem término permanecem observáveis e não são classificados como teste executado. Métricas com corrupção são parciais e CLI retorna 3. Consultar histórico não altera contadores.

Falha de escrita de atividade mantém o resultado do núcleo e avisa em stderr (`PRUMO_OBSERVABILITY_ERROR`, fase e UUID), nunca no stdout MCP. CLI usa 3 quando só a observabilidade falha, preservando 1/2 de falhas/bloqueios do núcleo. MCP mantém a resposta contratual: operadores devem capturar stderr. Disco indisponível impede registrar o evento; não alegamos contabilidade completa dessas chamadas. Em produção, monitore stderr e mantenha diretório de dados gravável. Os testes reproduzem falha no início/término e preservação de FAIL/BLOCKED.

`prumo conectar codex` apresenta destino e comando; alteração exige a confirmação textual exibida em terminal interativo. `--json`, execução não interativa e confirmação incorreta não escrevem configuração. A inspeção oficial de servidores precede a adição: nome existente ou inspeção falha impede sobrescrita. Não execute outro configurador concorrente durante essa operação. O comando manual exibido continua sujeito à revisão da pessoa. Nenhuma conexão configurada equivale a permissão de execução protegida.

## Aplicativo 2.3: rede, dados e exclusão

- A janela continua sem rede (CSP e filtro de requisições). A **única** saída é a verificação de atualização, feita pelo processo principal com destino fixo (`https://api.github.com/repos/AnaPLysyk/Prumo-Qa/releases/latest`), sem corpo, cookies ou redirecionamento, com timeout e resposta validada por esquema. O endereço da página de download é reconstruído a partir da tag validada, nunca copiado da resposta. Nada é baixado ou executado.
- **2.10.1: aviso automático de versão nova.** Por padrão (opção "Avisar quando houver versão nova", que a pessoa pode desligar em Ajuda › Atualizações), o aplicativo instalado faz essa mesma consulta ao abrir e a cada 6 horas, inclusive minimizado na bandeja, e avisa uma vez por versão no sino e por notificação do Windows. Mesmo destino fixo, mesma validação, nenhum dado da pessoa enviado; o servidor vê o IP, como em qualquer conexão. Fora do pacote (desenvolvimento e testes) a consulta automática só usa o servidor local de teste.
- Exclusão de dados locais exige confirmação nativa, restringe-se a arquivos de formato conhecido, recusa links simbólicos, hardlinks e pastas substituídas por junction, e informa falhas parciais. Não existe como ferramenta MCP.
- O diagnóstico IPC grava só metadados e tem teto diário; não entra nas métricas.
- Limites: o instalador não é assinado; o checksum SHA-256 da release detecta corrupção ou troca do arquivo, não prova autoria.

## Aplicativo 2.5: suporte e avisos de versão

- **Suporte não envia nada.** O aplicativo só prepara o relato e, após revisão e confirmação nativa, abre no navegador o formulário oficial `https://github.com/AnaPLysyk/Prumo-Qa/issues/new`; o endereço é reconstruído no processo principal e validado, a página não escolhe destino. Quem publica é a pessoa. Issues de repositório público são públicas.
- **Nada é anexado automaticamente:** versão, sistema e diagnóstico (só metadados) dependem de marcação; logs, evidências, contextos, caminhos e código nunca entram. Segredos detectados (tokens, chaves privadas, senhas atribuídas) bloqueiam o envio e não são repetidos na revisão; e-mail, telefone, CPF e caminhos locais apenas geram aviso. A revisão é heurística.
- **Texto de issue é dado.** A triagem (`.github/workflows/triagem.yml`) só aplica rótulos, não faz checkout, não interpola o texto em comandos, não corrige código nem altera a `main`. Nenhuma IA exclui contextos, publica issues ou altera configurações externas: essas ações não existem como ferramenta MCP.
- **Avisos de versão:** preferências locais (`preferencias.json`); consulta somente ao GitHub oficial, sob demanda ou, se ligado, uma vez ao abrir; nenhum serviço, tarefa agendada, download ou instalação automática; o som toca no máximo uma vez por versão.

## Aplicativo 2.9: escrita externa, agentes e catálogo

- **Escrita desligada por padrão**, por projeto e serviço (Conexões). Cada operação mostra a prévia, pede confirmação nativa do Windows e só então envia. Rotas de escrita em lista fechada por serviço; sem DELETE, sem redirecionamento, IP público fixado e tamanho limitado.
- **Idempotência**: a chave é o resumo do projeto, da operação e dos parâmetros; um marcador `prumo-xxxxxxxxxx` vai em rótulo, descrição ou comentário. Após resposta perdida o Prumo reconcilia lendo o serviço; repetir não duplica. O resultado só vira CONFIRMADA depois de reler.
- **GitHub**: escrita apenas em branches `prumo/...`, nunca na principal, sem force push e fora de `.github/`; o Pull Request nasce como rascunho.
- **Agentes**: as políticas por capacidade valem no servidor MCP a cada chamada (8 ferramentas desde a 2.10, com `propor_aprendizado`). A IA só cria rascunhos locais com limite por hora; não cria nem reutiliza aprovações humanas e não acessa credenciais.
- **Agendamento**: rotinas agendadas só publicam resultados no Qase com uma política aprovada para a run (validade e usos); sem política os resultados ficam locais.
- **Catálogo de testes**: leitura estática da pasta vinculada, sem seguir links simbólicos, com limite de arquivos e tamanho; o conteúdo é dado, nunca instrução.
- **Assistente do Início e flutuante (orquestrador)**: cada pergunta vai para um agente local (uma especialização por área) que responde com dados deste computador, sem rede nem modelo de IA. A memória de até seis turnos fica na janela e muda com o projeto. Novas conversas não persistem pergunta nem resposta: `conhecimento.db` guarda perfil local, conhecimentos com estado explícito, vocabulário corrigido e metadados do atendimento/avaliação. Só conhecimento APROVADO participa das respostas; sugestões de conversa ou IA ficam RASCUNHO. Conversas antigas em `conversas/<projeto>.jsonl` continuam legíveis e podem ser excluídas com confirmação nativa. O perfil da pessoa (nome, papel, experiência, foco) alimenta só o assistente local; Claude Code/Codex recebem experiência, foco e papel da conta apenas com `compartilharComIa` ligado (padrão desligado), tratados como dados e não como instrução; o foco tem no máximo 160 caracteres, sem caracteres de controle.
- **IA externa opcional no chat**: Claude Code ou Codex só são chamados quando a pessoa autoriza o provedor (confirmação nativa, revogável) e o escolhe no chat. O Prumo executa o CLI `.exe` local sem shell, com ambiente mínimo e tempo limite de 120 s; atalhos `.cmd` não são usados. São enviados ao CLI a pergunta, os trechos APROVADOS da Skill do agente que combinam com a pergunta (no máximo 8 KB, escolhidos em `skills.db`) e os fatos locais usados na resposta; o CLI usa a conta e as regras do próprio provedor. Falha, ausência ou falta de autorização voltam para a resposta local, com aviso. A resposta sempre identifica quem a produziu.
- **Escopo do CLI delegado**: a execução usa uma pasta temporária vazia, sem carregar configuração do repositório conectado. Claude recebe lista vazia de ferramentas e de servidores MCP, hooks desabilitados e sessão sem persistência. Codex ignora configuração de usuário e desabilita hooks, apps, plugins e execução shell; usa sandbox read-only, sessão efêmera e não pode escalar permissões. São flags do CLI instalado: versões incompatíveis falham e a resposta local informa o problema. Isso depende da aplicação correta dessas restrições pelo executável do provedor; não é uma sandbox independente contra um executável adulterado. O prompt pode ser processado pela conta externa autorizada. Falha ao guardar metadados ou sugestões de aprendizado aparece como aviso, sem apagar a resposta bem-sucedida da IA.
- **Banco de Skills (`skills.db`)**: SQLite local separado do `conhecimento.db`, na mesma pasta de dados, com as mesmas defesas (recusa de atalhos e de arquivo com mais de um vínculo, segredos mascarados, limites). Cada Skill fica em trechos com origem (PRUMO, PESSOA, IMPORTADO, IA), estado e, quando importada, fonte e licença. Os trechos do Prumo são sincronizados com a pasta `backend/agentes/skills/` do aplicativo a cada versão; um trecho descartado pela pessoa continua descartado enquanto o texto não muda. O que a equipe escreve nasce APROVADO; importado e IA nascem RASCUNHO e só entram no prompt depois de aprovados. A importação lê uma pasta já presente no computador, escolhida no seletor de pastas do sistema (nunca um caminho vindo da janela), aceita só `SKILL.md` e `references/*.md` (até 64 KB cada, sem binário e sem atalho), ignora scripts e recusa pasta sem licença aberta reconhecida (MIT, Apache-2.0, BSD, ISC, 0BSD, Unlicense, CC0, CC-BY, CC-BY-SA). Nada é baixado nem executado. Trecho de Skill é instrução para a IA externa, por isso depende de aprovação humana; ele não autoriza comandos, testes, agendamentos nem publicação. Se o banco não abrir, o chat usa só as Skills que acompanham o aplicativo.
- **Testes do ciclo de IA**: o runner substitui a persistência de conhecimento e de Skills por memória e executores externos por funções sintéticas. Nenhum SQLite ou conta externa é acessado por esses testes; eles validam contratos, roteamento, interface, isolamento e falhas observáveis, sem comprovar autenticação real do provedor nem persistência SQLite.
- **Prumo QA (rodapé)**: o botão abre a URL fixa do site oficial (`https://prumo-qa-docs.onrender.com/`) só após confirmação nativa.
- Limite: as escritas foram exercitadas contra serviços simulados; o instalador não é assinado.


## Ciclo do assistente e conhecimento local

O chat novo mantém até seis turnos apenas na memória da janela, separados por projeto; grava metadados de atendimento (agente, modo, fontes e avaliação), sem pergunta/resposta completa. Conversas antigas não são migradas nem apagadas silenciosamente. Perfil, conhecimentos e vocabulário ficam no SQLite local `conhecimento.db`, com limites, redação de segredos e recusa de links. Não é um banco remoto nem autenticação de identidade.

Aprendizados vindos de IA ou conversa nascem RASCUNHO. Aprovação/descarte são ações explícitas da pessoa na janela; a ferramenta MCP `propor_aprendizado` só propõe e respeita políticas. Compartilhar conhecimentos com a IA externa usa a permissão de contextos do projeto. Um conhecimento aprovado continua sendo dado: não autoriza comandos, testes, agendamentos ou publicação.

As verificações automatizadas do conhecimento usam uma implementação em memória no processo de teste. A janela de desenvolvimento é iniciada por um bootstrap exclusivo dos testes que substitui o módulo de persistência; o aplicativo distribuído não possui flag para ativar esse substituto. Serviços são simulados e fixtures locais não comprovam autenticação remota real.
