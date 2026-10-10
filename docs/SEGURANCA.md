# Segurança e limites de confiança

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

## Observabilidade 2.1

A afirmação acima sobre `.prumo` refere-se às evidências de execução, preservadas da versão 2.0. Atividades novas ficam exclusivamente no diretório local do usuário, fora da raiz analisada, inclusive em readonly. `PRUMO_DATA_DIR` pode escolher outra pasta absoluta externa. A raiz confiável é canonizada pelo núcleo; o diretório de atividades deriva de SHA256(raiz + NUL + id). Não há índice global de projetos nem consulta cruzada. Nome/id de projeto, raiz e manifesto são identificados por hashes no arquivo; o terminal usa o contrato local para exibir o nome. Hash não é anonimização criptográfica de um valor adivinhável.

Pino escreve somente uma projeção definida pelo produto: origem categorizada, ferramenta conhecida, horários, estado, contagens, catálogo de tipos, código controlado e UUID de evidência. Entradas MCP malformadas também geram operações, mas seus valores livres não entram no log. Não há dump de argumentos/respostas, mensagens de erro arbitrárias, env, credenciais, conteúdo de arquivo ou requisito. A identificação Codex/Claude é declarada no handshake e pode ser falsificada por outro cliente; não autentica a pessoa. Término significa resposta produzida pelo servidor, não confirmação de entrega pela IA ou de aplicação de sugestões.

Cada chamada abre um JSONL exclusivo (`wx`, UUID), escreve início, fecha/fsync; só o seu término faz append nesse arquivo. Isso separa escritas concorrentes entre processos sem lock compartilhado ou daemon. Pastas são criadas com modo 0700 e arquivos 0600 onde o SO aplica esses modos; no Windows o diretório do perfil depende das ACLs herdadas. Verificamos symlinks/junctions em ancestrais, arquivos regulares, hardlinks, schema, vínculo raiz/projeto, pares início/término, contagens e SHA256. Não é sandbox contra outro processo com os mesmos direitos alterando o filesystem entre verificações, nem trilha assinada à prova de adulteração pelo dono da conta.

Limites: 10.000 arquivos, 32 KiB por arquivo, 32 MiB por leitura. Não há retenção destrutiva automática; arquivamento é manual, com escritores parados. Consulta informa registros inválidos e não os conta. Linha final parcial preserva o início válido e mostra erro de integridade. Inícios sem término permanecem observáveis e não são classificados como teste executado. Métricas com corrupção são parciais e CLI retorna 3. Consultar histórico não altera contadores.

Falha de escrita de atividade mantém o resultado do núcleo e avisa em stderr (`PRUMO_OBSERVABILITY_ERROR`, fase e UUID), nunca no stdout MCP. CLI usa 3 quando só a observabilidade falha, preservando 1/2 de falhas/bloqueios do núcleo. MCP mantém a resposta contratual: operadores devem capturar stderr. Disco indisponível impede registrar o evento; não alegamos contabilidade completa dessas chamadas. Em produção, monitore stderr e mantenha diretório de dados gravável. Os testes reproduzem falha no início/término e preservação de FAIL/BLOCKED.

`prumo conectar codex` apresenta destino e comando; alteração exige a confirmação textual exibida em terminal interativo. `--json`, execução não interativa e confirmação incorreta não escrevem configuração. A inspeção oficial de servidores precede a adição: nome existente ou inspeção falha impede sobrescrita. Não execute outro configurador concorrente durante essa operação. O comando manual exibido continua sujeito à revisão da pessoa. Nenhuma conexão configurada equivale a permissão de execução protegida.

## Aplicativo 2.3: rede, dados e exclusão

- A janela continua sem rede (CSP e filtro de requisições). A **única** saída é a verificação de atualização, iniciada por você, feita pelo processo principal com destino fixo (`https://api.github.com/repos/AnaPLysyk/Prumo-Qa/releases/latest`), sem corpo, cookies ou redirecionamento, com timeout e resposta validada por esquema. O endereço da página de download é reconstruído a partir da tag validada, nunca copiado da resposta. Nada é baixado ou executado.
- Exclusão de dados locais exige confirmação nativa, restringe-se a arquivos de formato conhecido, recusa links simbólicos, hardlinks e pastas substituídas por junction, e informa falhas parciais. Não existe como ferramenta MCP.
- O diagnóstico IPC grava só metadados e tem teto diário; não entra nas métricas.
- Limites: o instalador não é assinado; o checksum SHA-256 da release detecta corrupção ou troca do arquivo, não prova autoria.

## Aplicativo 2.5: suporte e avisos de versão

- **Suporte não envia nada.** O aplicativo só prepara o relato e, após revisão e confirmação nativa, abre no navegador o formulário oficial `https://github.com/AnaPLysyk/Prumo-Qa/issues/new`; o endereço é reconstruído no processo principal e validado, a página não escolhe destino. Quem publica é a pessoa. Issues de repositório público são públicas.
- **Nada é anexado automaticamente:** versão, sistema e diagnóstico (só metadados) dependem de marcação; logs, evidências, contextos, caminhos e código nunca entram. Segredos detectados (tokens, chaves privadas, senhas atribuídas) bloqueiam o envio e não são repetidos na revisão; e-mail, telefone, CPF e caminhos locais apenas geram aviso. A revisão é heurística.
- **Texto de issue é dado.** A triagem (`.github/workflows/triagem.yml`) só aplica rótulos, não faz checkout, não interpola o texto em comandos, não corrige código nem altera a `main`. Nenhuma IA exclui contextos, publica issues ou altera configurações externas: essas ações não existem como ferramenta MCP.
- **Avisos de versão:** preferências locais (`preferencias.json`); consulta somente ao GitHub oficial, sob demanda ou, se ligado, uma vez ao abrir; nenhum serviço, tarefa agendada, download ou instalação automática; o som toca no máximo uma vez por versão.
