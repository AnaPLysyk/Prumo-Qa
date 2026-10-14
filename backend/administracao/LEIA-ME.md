# administracao — backend

Administração: configurações gerais, usuários, permissões, monitoramento e documentação técnica.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `acessoConfiguracao.ts` | Canal acesso:configuracao: Ler as configurações gerais de acesso. |
| `acessoSalvar.ts` | Canal acesso:salvar: Salvar as configurações gerais de acesso. |
| `administracaoCodigo.ts` | Canal administracao:codigo: Mostrar o código de um arquivo do aplicativo na Documentação viva (somente leitura, só arquivos do mapa). |
| `administracaoMapa.ts` | Canal administracao:mapa: Mostrar a documentação viva desta versão: tela, interface, canais, backend e testes. |
| `contaCadastrar.ts` | Canal conta:cadastrar: Criar a própria conta pela tela de entrada (pode aguardar aprovação). |
| `contaEntrar.ts` | Canal conta:entrar: Entrar com login e senha. |
| `contaPerfil.ts` | Canal conta:perfil: Trocar o próprio nome de exibição. |
| `contaRecuperar.ts` | Canal conta:recuperar: Definir senha nova com o código de recuperação. |
| `contaSair.ts` | Canal conta:sair: Encerrar a sessão de quem está no Prumo. |
| `contaSenha.ts` | Canal conta:senha: Trocar a própria senha, inclusive a temporária. |
| `contaSessao.ts` | Canal conta:sessao: Saber se o login está ligado, quem está na sessão e o que cada tela permite. |
| `papeisExcluir.ts` | Canal papeis:excluir: Excluir um papel que ninguém usa. |
| `papeisListar.ts` | Canal papeis:listar: Listar os papéis e a matriz de permissões por tela. |
| `papeisSalvar.ts` | Canal papeis:salvar: Criar ou alterar um papel e o nível de cada tela. |
| `plataformaAgentes.ts` | Canal plataforma:agentes: Ler a configuração geral dos agentes da plataforma. |
| `plataformaSalvar.ts` | Canal plataforma:salvar: Ligar ou desligar agentes, IA externa e orquestração em todos os projetos. |
| `usuariosAlterar.ts` | Canal usuarios:alterar: Aprovar, trocar papel ou nome, desativar ou reativar uma conta. |
| `usuariosAtivar.ts` | Canal usuarios:ativar: Ligar o login criando a primeira conta, de administrador. |
| `usuariosCriar.ts` | Canal usuarios:criar: Criar conta para outra pessoa com senha temporária. |
| `usuariosDesbloquear.ts` | Canal usuarios:desbloquear: Desbloquear conta travada por tentativas erradas. |
| `usuariosExcluir.ts` | Canal usuarios:excluir: Excluir conta pendente ou desativada. |
| `usuariosListar.ts` | Canal usuarios:listar: Listar as contas com papel, estado e último acesso. |
| `usuariosSenha.ts` | Canal usuarios:senha: Redefinir a senha de outra pessoa com senha temporária. |

## banco/

Onde os dados são lidos e gravados neste computador (arquivos JSON e SQLite na pasta de dados do Prumo).

| Arquivo | O que faz |
| --- | --- |
| `gravarAgentesDaPlataforma.ts` | Grava a configuração geral dos agentes da plataforma conferindo o formato antes. |
| `gravarContas.ts` | Grava contas.json conferindo o formato antes (cópia temporária e troca, sem atalhos). |
| `lerAgentesDaPlataforma.ts` | Lê a configuração geral dos agentes da plataforma (agentes-plataforma.json); sem arquivo vale o padrão. |
| `lerCodigoDoAplicativo.ts` | Lê o código de um arquivo do aplicativo para a Documentação viva, do codigo.json gerado no build (só caminhos que existem nele). |
| `lerContas.ts` | Lê as contas, os papéis e a configuração de acesso (contas.json); sem arquivo, o login está desligado. |
| `lerMapaDoAplicativo.ts` | Lê o mapa da Documentação viva que o build gerou em dist/documentacao/mapa.json, com limite de tamanho e formato conferido. |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `agentesDaPlataforma.ts` | Configuração geral dos agentes da plataforma: quais respondem, se a IA externa pode ser usada e se o Orchestrator combina agentes. |
| `conferirAcessoAoCanal.ts` | Confere, antes de atender um canal da janela, se há sessão válida e se o papel da pessoa permite aquela tela e nível. |
| `contas.ts` | O que a própria pessoa faz com a conta: ativar o login, entrar, sair, se cadastrar, recuperar o acesso, trocar a senha e o nome. |
| `gestaoDeContas.ts` | Gestão de contas pela Administração: listar, criar com senha temporária, aprovar, trocar papel, desativar, redefinir senha, desbloquear e excluir. |
| `papeis.ts` | Papéis e permissões por tela, e a configuração geral de acesso (cadastro, inatividade e bloqueio), decididos na Administração. |
| `senhas.ts` | Resume senhas e códigos de recuperação com scrypt e sal próprio, confere em tempo constante e exige senha mínima. |
| `sessao.ts` | Sessão de quem entrou no Prumo: fica só na memória do processo principal e termina ao sair, ao fechar o Prumo ou por inatividade. |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `acessoDosCanais.ts` | Tela e nível que cada canal da janela exige quando o login está ligado; canal novo sem classificação não compila. |
| `agentesDaPlataforma.ts` | Formato da configuração geral dos agentes da plataforma, decidida só na Administração. |
| `contas.ts` | Formato das contas locais, dos papéis com permissão por tela e das configurações gerais de acesso. |
| `mapaDoAplicativo.ts` | Formato do mapa da Documentação viva: telas com interface, canais IPC, backend por papel e testes, gerado do código no build. |
