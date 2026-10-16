# Suporte e triagem (2.5)

## Em poucas palavras

O aplicativo prepara o relato no seu computador. Você revisa o texto e escolhe se quer exportá-lo ou abrir o formulário oficial do GitHub. O aplicativo não envia o chamado. Issues no GitHub são públicas; não inclua senhas, tokens, código privado ou dados pessoais.

## Evolução 2.6: relato local e acompanhamento

O Markdown exportado traz frontmatter com `id: LOCAL-<hash>`, categoria, `status: rascunho_local` e origem aplicativo. A versão só entra se marcada. O hash identifica o conteúdo local; não é um número global nem uma issue recebida. GitHub emite o número real depois do envio humano.

**Consultar chamado** usa somente o número para consultar a issue oficial e até 100 eventos públicos. A tela mostra status por rótulo, atualização da issue, responsável quando disponível e eventos de alteração; ausência/conflito de rótulos e histórico parcial são explícitos. O aplicativo não grava nem sincroniza uma segunda base e não altera status. **Abrir chamado** pede confirmação nativa e abre o endereço oficial para acompanhar ou responder por comentário. Notificações são as do GitHub, conforme preferência do autor.

Os cinco rótulos e suas cores têm fonte em `docs/catalogo/suporte-status.json`: recebido, em análise, em desenvolvimento, implementado e concluído. Mantenha somente um rótulo de status por issue. A triagem aplica recebido apenas quando não existe status; as transições posteriores são humanas. Implementado indica código incorporado; disponível exige a release publicada indicada na resolução. Concluído exige explicação da resolução, não só fechamento.

Finalidade dos dados opcionais: versão identifica o build (package.json); sistema indica compatibilidade (os.platform/release/arch); diagnóstico informa erros IPC (somente metadados). IP, hostname, hardware e usuário Windows não são anexados automaticamente. Textos longos encurtados na URL não substituem o Markdown completo exportado.

## Fluxo da central de Suporte

1. **Preparar localmente** (`suporte:preparar`): o backend (`backend/suporte/regras/prepararRelato.ts`) valida o relato com esquema estrito, monta o texto Markdown e revisa a privacidade. Não há rede nem gravação.
2. **Revisar**: a interface mostra o texto exato, os bloqueios (segredos) e os avisos (e-mail, telefone, CPF, caminhos locais).
3. **Abrir no GitHub** (`suporte:abrir`) ou **Exportar** (`suporte:exportar`): o processo principal refaz a preparação (não confia no que a página já calculou), recusa se houver bloqueio, valida que o endereço é `https://github.com/AnaPLysyk/Prumo-Qa/issues/new` e pede uma **confirmação nativa** antes de abrir o navegador. A exportação usa o diálogo nativo de salvar.

## Garantias

- Nenhuma issue é criada pelo aplicativo: ele só abre o formulário oficial pré-preenchido; quem envia é a pessoa, no navegador.
- Versão, sistema e diagnóstico só entram se marcados. Logs, evidências, contextos, código e caminhos do projeto nunca são anexados.
- Não há e-mail de suporte inventado; o canal é o GitHub Issues. O aviso de que a issue é pública aparece antes do envio.
- O endereço é reconstruído no processo principal a partir do esquema validado; texto do relato não altera destino, comando ou arquivo.
- Textos longos são encurtados no endereço (limite ≈ 7000 caracteres) e a interface informa; a exportação local guarda o texto completo.

## Templates

`.github/ISSUE_TEMPLATE/{bug,melhoria,sugestao}.yml` usam os campos `descricao`, `passos`, `esperado` e `ambiente`, que o Prumo preenche pela URL. `config.yml` desativa issues em branco e aponta falhas de segurança para o relato privado de vulnerabilidade.

## Triagem segura

`.github/workflows/triagem.yml` disponibiliza os cinco rótulos de status do catálogo quando essa configuração é publicada ou quando o workflow é acionado manualmente, sem criar ou alterar chamados. Ao abrir ou reabrir uma issue, aplica recebido somente quando não há status, além dos rótulos `tipo: bug|melhoria|sugestão|indefinido` e `triagem: pendente` com base no prefixo do título. Ele:

- não faz checkout do código nem executa scripts do repositório;
- não interpola título ou corpo em comandos de shell (o texto é lido como dado pela API);
- não responde com texto gerado, não corrige código, não abre pull request e não toca na branch `main`.

Correções continuam sendo feitas por uma pessoa (ou por um agente sob supervisão), por pull request ou commit revisado, nunca disparadas automaticamente por texto de issue.

## Notificações de atualização

Preferências em `%LOCALAPPDATA%\PrumoQA\preferencias.json` (`verificarAoIniciar`, `som`, `silenciar`, versão vista, versão já notificada e a última release conhecida). O backend (`backend/atualizacoes/regras/registrarConsultaDeVersao.ts`) decide e **grava** quando o som deve tocar: no máximo uma vez por versão, nunca com `silenciar` e nunca com o som desligado. A interface apenas obedece e sintetiza dois tons curtos com Web Audio (sem arquivo de áudio nem biblioteca). Sem serviço, tarefa agendada ou consulta em segundo plano.
