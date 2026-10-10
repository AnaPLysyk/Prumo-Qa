# Suporte e triagem (2.5)

## Fluxo da central de Suporte

1. **Preparar localmente** (`suporte:preparar`): o núcleo (`src/suporte.ts`) valida o relato com esquema estrito, monta o texto Markdown e revisa a privacidade. Não há rede nem gravação.
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

`.github/workflows/triagem.yml` roda quando uma issue é aberta ou reaberta e **só aplica rótulos** (`tipo: bug|melhoria|sugestão|indefinido`, `triagem: pendente`) com base no prefixo do título. Ele:

- não faz checkout do código nem executa scripts do repositório;
- não interpola título ou corpo em comandos de shell (o texto é lido como dado pela API);
- não responde com texto gerado, não corrige código, não abre pull request e não toca na branch `main`.

Correções continuam sendo feitas por uma pessoa (ou por um agente sob supervisão), por pull request ou commit revisado, nunca disparadas automaticamente por texto de issue.

## Notificações de atualização

Preferências em `%LOCALAPPDATA%\PrumoQA\preferencias.json` (`verificarAoIniciar`, `som`, `silenciar`, versão vista, versão já notificada e a última release conhecida). O núcleo (`src/preferencias.ts`) decide e **grava** quando o som deve tocar: no máximo uma vez por versão, nunca com `silenciar` e nunca com o som desligado. A interface apenas obedece e sintetiza dois tons curtos com Web Audio (sem arquivo de áudio nem biblioteca). Sem serviço, tarefa agendada ou consulta em segundo plano.
