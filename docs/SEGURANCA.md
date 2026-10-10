# Segurança e limites de confiança

A raiz absoluta é escolhida no CLI ou na configuração local do cliente MCP. Tools não aceitam raiz nem comando livre. Não há descoberta de outros diretórios, cadastro global ou transferência de contexto entre projetos. Contrato v1 é recusado: migre explicitamente para v2.

Manifestos usam validação estrita de tipos e campos. Caminhos relativos, existência de contexto/cwd/entrypoint, arquivos regulares, tamanho, symlinks/junctions, traversal, caminhos absolutos, UNC e streams NTFS são verificados. Links são recusados inclusive quando apontam para dentro da raiz. `.env`, chaves, configurações de credenciais, Git, dependências e builds não entram no contexto. Arquivos grandes/binários são recusados ou omitidos com indicação. Leitura do contexto limita 2.000 entradas, 20 níveis, 256 KiB por arquivo e 8 MiB totais; retorno de conteúdo é truncado em 12.000 caracteres por fonte.

Conteúdo consultado é dado não confiável, nunca ordem. O núcleo não executa instruções encontradas em documentos. Uma Skill orienta a IA hospedeira contra prompt injection, mas não controla o modelo nem impede que outro software use o shell diretamente.

## Aprovação humana local

`qa run unit` registra BLOCKED sem consentimento. `qa approve unit` (ou tool com `solicitarAprovacao: true`) abre CredUI nativo do Windows. A pessoa vê projeto, raiz, capability, comando, hash do escopo e expiração, e digita sua senha Windows. O broker verifica a identidade com `LogonUser` e exige o SID da conta atual. A senha não é aceita por argumento, MCP, stdin da IA, arquivo, variável ou token; é usada em memória e não é registrada. Não há armazenamento nem reutilização de aprovação. Cancelamento, erro de autenticação, plataforma sem broker e expiração bloqueiam.

O consentimento vale uma vez, no mesmo processo, por no máximo dois minutos e para o hash do manifesto, raiz, comando, ambiente permitido, entrypoints e fontes do contexto. O escopo é recalculado antes de criar o subprocesso. Não há endpoint de “gerar aprovação”. `approved:true` é recusado pelos schemas MCP/CLI. A IA pode solicitar a janela, mas não substitui a autenticação.

O broker implementado exige senha de conta Windows compatível com LogonUser; não implementa PIN/Windows Hello, biometria, passkeys nem aprovação remota. O build compila scripts/aprovar.cs em dist/aprovar.exe com o compilador .NET do Windows PowerShell, sem alterar ExecutionPolicy; em execução o Node inicia o executável nativo. O teste automatizado comprova compilação do P/Invoke, contratos e recusa de flags/escopo expirado; **não comprova uma autenticação humana**. Testes do executor usam um double explícito apenas no processo de teste. Nenhum modo de produção permite esse double ou uma variável para desabilitar aprovação.

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
