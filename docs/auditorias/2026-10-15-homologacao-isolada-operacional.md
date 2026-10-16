# Homologação isolada — Jira KAN e Qase PQ

Data: 15/10/2026. **Situação: pré-voo preparado; homologação real NOT_RUN.**

## Como o isolamento funciona

O aplicativo utiliza PRUMO_DATA_DIR para os registros do Prumo e a subpasta app como userData do Electron. O launcher manual em ferramentas/homologacao/preparar-ambiente.mjs:

- No modo padrão ou com --verificar: apenas inspeciona os arquivos necessários. Não cria perfil, abre banco, abre janela ou acessa a rede.
- Com --iniciar: somente após comando manual explícito, cria perfil novo no TEMP e inicia o Electron compilado com a variável PRUMO_DATA_DIR apontada para esse perfil.
- Não herda variáveis de ambiente de credenciais, NODE_OPTIONS ou PRUMO_* já existentes, e não copia as contas do perfil normal em LOCALAPPDATA\PrumoQA.
- Não desativa a confirmação nativa, as permissões por canal nem a escrita remota desligada por padrão.
- Preserva o perfil temporário após sair para possível revisão manual. Não faz deploy, push ou escrita remota automática.

## Passo 1 — pré-voo somente leitura, permitido agora

No PowerShell:

    Set-Location 'C:\Users\DELL\projetos-github\Prumo-Qa'
    node ferramentas/homologacao/preparar-ambiente.mjs --verificar

O resultado esperado contém PREPARADO_SEM_INICIAR. Este modo foi verificado sem abrir Electron.

## Passo 2 — somente com exceção manual explicitamente autorizada

    node ferramentas/homologacao/preparar-ambiente.mjs --iniciar

O script mostrará PERFIL_ISOLADO=..., sem misturar com o perfil normal. No primeiro acesso, crie uma conta local sintética. Antes da homologação real, **substitua os tokens que já foram expostos no chat** e configure apenas as contas de teste. Encerre por Sair do Prumo na bandeja, pois fechar a janela apenas a oculta.

## Critérios de homologação

| Etapa | Ação no Prumo | Evidência necessária |
| --- | --- | --- |
| P0 | Instância isolada e conta local nova | Perfil TEMP distinto do normal; sem conexões copiadas |
| J1 | Conectar Jira e selecionar projeto KAN | Identidade e escopo corretos, leitura de tickets |
| J2 | Criar ticket após prévia e confirmação nativa | ID retornado e GET do mesmo ticket pelo Jira |
| J3 | Editar descrição e comentar | Dados persistidos e confirmados por releitura remota |
| Q1 | Conectar Qase e selecionar projeto PQ | Suítes/casos obtidos do projeto correto |
| Q2 | Criar suíte e caso após confirmação nativa | IDs e campos confirmados por leitura da API Qase |
| Q3 | Associar caso ao ticket Jira de teste | Associação jira-cloud correta e mapa de vínculos atualizado |
| Q4 | Criar plano e run a partir dos casos | Composição confirmada; run criada não significa run executada |
| F1 | Desligar escrita nos serviços | Novos envios recusados, evidências preservadas |

Em cada etapa registrar PASS, FAIL, BLOCKED ou NOT_RUN e evidências mascaradas. Não apagar objetos remotos sem aprovação específica.

## Política e estado

O arquivo AGENTS.md afirma: **Nenhum teste pode tocar banco ou projeto externo**. Portanto o launcher não participa do runner automático, e --iniciar NÃO foi executado. O Chromium cria arquivos de armazenamento mesmo com perfil isolado; essa homologação manual só pode avançar após a exceção consciente e restrita pela pessoa responsável. Não alterar AGENTS.md nem simular aprovação.

A jornada real P0–F1 continua NOT_RUN. Complemento: docs/auditorias/2026-10-15-roteiro-homologacao-jira-qase.md.

## Validação técnica do pré-voo

- Pré-verificação executada na máquina Windows: PREPARADO_SEM_INICIAR (sem execução do Electron).
- Três testes unitários do iniciador: **3/3 PASS**, inclusive argumentos recusados.
- Check protegido: **549 testes no total, 512 PASS e 37 FAIL por bloqueio intencional de testes de navegador**. Código de saída 1; não equivale a aprovação global. Log em %LOCALAPPDATA%\Temp\prumo-check-preparar-homologacao-20261015.log.
- O isolamento garantido pelo launcher é da **pasta local de dados**. Ele NÃO é uma restrição de rede que imponha KAN/PQ ao nível do sistema operacional. Os serviços e recursos devem ser conferidos na janela antes de habilitar qualquer escrita; toda autorização remota segue exigindo confirmação nativa.
- Nada foi executado com --iniciar. Nenhum commit, push ou deploy foi realizado.
