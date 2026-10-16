# login — backend

Login: entrar, sair, cadastrar, recuperar e trocar a senha, a sessão e a conferência de acesso de cada canal da janela.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `contaCadastrar.ts` | Canal conta:cadastrar: Criar a própria conta por e-mail na tela de entrada, com o código de confirmação (pode aguardar aprovação). |
| `contaCodigo.ts` | Canal conta:codigo: Mandar um código de 6 dígitos ao e-mail, para confirmar o cadastro ou definir senha nova. |
| `contaConfirmarentrada.ts` | Canal conta:confirmarentrada: Terminar a entrada em duas etapas com o código mandado ao e-mail da conta. |
| `contaDuasetapas.ts` | Canal conta:duasetapas: Ligar ou desligar a própria verificação em duas etapas (pede a senha atual). |
| `contaEntrar.ts` | Canal conta:entrar: Entrar com login e senha. |
| `contaGithubestado.ts` | Canal conta:githubestado: Ver como está a entrada pelo GitHub, ou desistir dela. |
| `contaGithubiniciar.ts` | Canal conta:githubiniciar: Abrir o navegador para entrar ou se cadastrar pelo GitHub. |
| `contaGoogleestado.ts` | Canal conta:googleestado: Ver como está a entrada pelo Google, ou desistir dela. |
| `contaGoogleiniciar.ts` | Canal conta:googleiniciar: Abrir o navegador para entrar ou se cadastrar pelo Google. |
| `contaPerfil.ts` | Canal conta:perfil: Trocar o próprio nome de exibição. |
| `contaRecuperar.ts` | Canal conta:recuperar: Definir senha nova com o código mandado ao e-mail da conta. |
| `contaReenviarentrada.ts` | Canal conta:reenviarentrada: Mandar outro código da entrada em duas etapas em andamento. |
| `contaSair.ts` | Canal conta:sair: Encerrar a sessão de quem está no Prumo. |
| `contaSenha.ts` | Canal conta:senha: Trocar a própria senha, inclusive a temporária. |
| `contaSessao.ts` | Canal conta:sessao: Saber se o login está ligado, quem está na sessão e o que cada tela permite. |

## banco/

Onde os dados são lidos e gravados neste computador (arquivos JSON e SQLite na pasta de dados do Prumo).

| Arquivo | O que faz |
| --- | --- |
| `gravarContas.ts` | Grava acessos.json conferindo o formato antes (cópia temporária e troca, sem atalhos). |
| `lerContas.ts` | Lê as contas, os papéis e a configuração de acesso (acessos.json); sem arquivo, o login está desligado. |

## integracoes/

Conversa com serviços de fora (Jira, Qase, GitHub ou IA), sempre pelos endereços oficiais.

| Arquivo | O que faz |
| --- | --- |
| `chamarHttps.ts` | Uma chamada HTTPS dos logins por provedor: host numa lista fechada, tempo limite e resposta limitada a 1 MB. |
| `enviarCodigoPorEmail.ts` | Pede ao serviço do Prumo que mande o código de 6 dígitos ao e-mail da pessoa; só o e-mail, o código, a finalidade e o idioma saem do computador. |
| `githubOauth.ts` | Fala com o GitHub só nos dois endereços fixos do login: troca o código pelo token e lê quem acabou de autorizar. |
| `googleOauth.ts` | Fala com o Google só nos dois endereços fixos do login: troca o código pelo token e lê quem acabou de autorizar. |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `codigosPorEmail.ts` | Códigos de 6 dígitos mandados por e-mail para confirmar o cadastro, definir senha nova ou entrar (duas etapas): só na memória, valem 10 minutos, uma vez, com até 5 tentativas. |
| `conferirAcessoAoCanal.ts` | Confere, antes de atender um canal da janela, se há sessão válida e se o papel da pessoa permite aquela tela e nível. |
| `configuracaoDoLogin.ts` | Configuração do login por GitHub e Google neste computador: Client ID em acessos.json, segredo só no cofre do sistema, e as ligações reais de cada fluxo. |
| `contas.ts` | O que a própria pessoa faz com a conta: criar a primeira conta, entrar, sair, se cadastrar por e-mail, definir senha nova pelo e-mail, trocar a senha e o nome. |
| `entradaPeloGithub.ts` | Entrar ou se cadastrar pelo GitHub: a lógica é a mesma do Google (entradaPorProvedor.ts); aqui só ficam os nomes que o GitHub usa. |
| `entradaPorProvedor.ts` | Entrar ou se cadastrar por um provedor externo (GitHub ou Google): abre o navegador, o provedor devolve a pessoa a este computador (127.0.0.1) e a conta entra já. |
| `senhas.ts` | Resume senhas com scrypt e sal próprio, confere em tempo constante e exige senha mínima. |
| `sessao.ts` | Sessão de quem entrou no Prumo: fica só na memória do processo principal e termina ao sair, ao fechar o Prumo ou por inatividade. |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `acessoDosCanais.ts` | Tela e nível que cada canal da janela exige quando o login está ligado; canal novo sem classificação não compila. |
| `contas.ts` | Formato das contas locais, dos papéis com permissão por tela e das configurações gerais de acesso. |
