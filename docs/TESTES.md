# Testes e CI/CD

## Onde ficam os testes

No aplicativo Prumo QA, `testes/unitario/<camada>/<tela>/*.test.mjs` é o local reservado aos testes unitários de frontend e backend; o inventário dos arquivos antigos ainda está sendo revisado. `testes/` contém exclusivamente `unitario/`. O executor `testes/unitario/executar.mjs` fica com os unitários. Os nove auxiliares e dados fictícios estão versionados somente no Prumo QA Lab (`automacao/prumo-qa/recursos-unitarios/`). O executor monta esses arquivos temporariamente, recusa sobrescrever recursos existentes e os limpa ao terminar. Scripts de geração ficam em `docs/geradores/`, recursos do site em `site/scripts/`, e homologação externa no Prumo QA Lab. Não há uma pasta genérica `testes/apoio/`.

Os testes de fumaça, regressão, interfaces reais, integração, migração simulada e automação de ponta a ponta pertencem ao repositório **Prumo-QA-Lab**: `automacao/prumo-qa/testes/integracao/`, `e2e/`, `smoke/` e `regressao/`. A aplicação fictícia `aplicacao/` e os cenários de avaliação do Lab continuam independentes.

## Tipo de teste não é a mesma coisa que tela ou finalidade

| Nível | Critério | Exemplo verificado |
| --- | --- | --- |
| Unitário | Exercita uma regra ou componente isolado; demais dependências são simuladas. | Validade e uso único dos códigos em `testes/unitario/backend/login/codigos-por-email.test.mjs`. |
| Integração | Executa dois ou mais componentes reais interagindo por uma fronteira, como HTTP local, repositório ou IPC. | `Prumo-QA-Lab/automacao/prumo-qa/testes/integracao/backend/login/envio-codigo-http.test.mjs`. |
| E2E | Executa o aplicativo completo, passando pela interface real; serviços externos podem ser falsos e isso deve estar explícito. | `Prumo-QA-Lab/automacao/prumo-qa/testes/e2e/frontend/aplicativo/todas-as-telas.test.mjs`: abre o Electron e percorre o menu. Não autentica conta externa real. |
| Contrato estático / arquitetura | Lê fontes, manifestos e arquivos compilados para verificar estrutura; não simula jornada de usuário. | Testes de estrutura e de geração do site atualmente misturados com os unitários, a revisar separadamente. |

**Smoke** é uma seleção pequena e rápida para detectar falhas graves, e **regressão** é uma seleção de testes para evitar a volta de defeitos. Nenhuma dessas palavras define o nível: podem incluir unitários, integração ou E2E. Não classificar só pelo nome, por usar mocks ou pela pasta `frontend`/`backend`.

Esta classificação foi iniciada pelos casos inequívocos de HTTP local e Electron. Outros arquivos antigos ainda misturam contrato, integração local e verificações unitárias: por exemplo, `clonar-repositorio.test.mjs` invoca Git local e `site.test.mjs` gera páginas completas. Não afirmar que a auditoria de todos os cenários internos está encerrada.

## Preparação local

Mantenha `Prumo-Qa/` e `Prumo-QA-Lab/` como pastas irmãs. Em outra localização, defina a variável `PRUMO_LAB_DIR` com o caminho completo do Lab. `npm run build` não depende do Lab, mas os testes unitários precisam dos recursos fictícios armazenados nele. O CI baixa o Lab em um commit fixado antes de executar os unitários. Comandos diretos `node --test` não fazem a montagem; use o executor oficial.

## Comandos do Prumo QA

```powershell
npm run build
npm run test:unitarios
npm test
npm run check
npm run test:selecionar -- --natureza unitario --camada backend --listar
```

`npm test` faz build seguido de **somente unitários**. O seletor recusa outras naturezas. `npm run check:isolado` também é restrito aos unitários e aplica o bloqueador de efeitos, mas não é um sandbox do sistema operacional.

## Automação externa com Prumo QA Lab

Nos dois repositórios lado a lado, execute `npm ci` e `npm run build` no Prumo QA; em seguida, no Lab:

```powershell
npm run test:prumo:smoke
npm run test:prumo:integracao
npm run test:prumo:e2e
npm run test:prumo:regressao
```

O executor `automacao/prumo-qa/executar.mjs` copia temporariamente os arquivos externos para a estrutura esperada pelas fixtures existentes, executa os testes contra o Prumo QA compilado e apaga apenas os arquivos que ele próprio criou. Se encontrar um arquivo no destino, recusa sobrescrevê-lo. Dados, perfis reais e credenciais externas não são necessários.

## Abrir o front-end no Prumo Lab

Para homologar telas sem usar o e-mail real, compile o Prumo QA (`npm run build`) e, no repositório irmão `Prumo-QA-Lab/`, execute `npm run app:lab`. A janela **Prumo QA — LAB** abre com conta fictícia. O Lab envia o código de cadastro para uma caixa HTTP local em memória, lê e confirma esse código pelo IPC normal, sem pular a validação de identidade. Cada abertura cria um perfil de dados temporário, separado dos perfis instalados; ao fechar a janela, os dados são apagados. As credenciais do terminal não são repassadas ao Electron; não são usados Render, Neon nem Resend.

Para verificar a navegação completa no aplicativo real e o isolamento entre projetos, execute `npm run test:prumo:e2e` no Lab. Esse fluxo não substitui a homologação do cadastro central com e-mail verdadeiro e domínio validado.

## Pipeline de publicação

Em *pull requests* e pushes, o GitHub Actions valida tipos, build e testes unitários do Prumo QA. Nas tags de release Windows, também exige integração, E2E, smoke e regressão pelo Prumo QA Lab. A pipeline continua gerando e verificando instaladores conforme suas regras.

Antes de publicar uma **tag de release Windows**, o workflow baixa o Prumo-QA-Lab em um commit fixado e executa smoke de backend, integração, E2E, regressão e o E2E do executável empacotado a partir do Lab. Se falhar, a release não é publicada. O Lab dispõe de workflow próprio para testes do laboratório e para disparar homologação externa sob demanda. Isso não substitui homologação manual de OAuth nem de serviços reais.

Os nomes `smoke` e `regressao` continuam disponíveis como categorias de testes dos projetos que a plataforma gerencia; isso não significa que suas suítes internas estejam no repositório do aplicativo.
