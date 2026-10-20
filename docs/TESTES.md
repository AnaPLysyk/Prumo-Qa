# Testes e CI/CD

## Onde ficam os testes

No aplicativo Prumo QA, `testes/unitario/<camada>/<tela>/*.test.mjs` guarda apenas testes unitários de frontend e backend. `testes/apoio/` contém as fixtures e os scripts essenciais para unidade, compilação, documentação, segurança do CI e construção do site; esses auxiliares não são uma suíte adicional.

Os testes de fumaça, regressão, interfaces reais, integração, migração simulada e automação de ponta a ponta pertencem ao repositório **Prumo-QA-Lab**: `automacao/prumo-qa/testes/smoke/` e `automacao/prumo-qa/testes/regressao/`. A aplicação fictícia `aplicacao/` e os cenários de avaliação do Lab continuam independentes.

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
npm run test:prumo:regressao
```

O executor `automacao/prumo-qa/executar.mjs` copia temporariamente os arquivos externos para a estrutura esperada pelas fixtures existentes, executa os testes contra o Prumo QA compilado e apaga apenas os arquivos que ele próprio criou. Se encontrar um arquivo no destino, recusa sobrescrevê-lo. Dados, perfis reais e credenciais externas não são necessários.

## Pipeline de publicação

Em *pull requests* e pushes, o GitHub Actions valida tipos, build e testes unitários do Prumo QA. A pipeline continua gerando e verificando instaladores conforme suas regras.

Antes de publicar uma **tag de release Windows**, o workflow baixa o Prumo-QA-Lab em um commit fixado e executa o smoke, a regressão e o smoke do executável empacotado a partir do Lab. Se falhar, a release não é publicada. O Lab dispõe de workflow próprio para testes do laboratório e para disparar homologação externa sob demanda. Isso não substitui homologação manual de OAuth nem de serviços reais.

Os nomes `smoke` e `regressao` continuam disponíveis como categorias de testes dos projetos que a plataforma gerencia; isso não significa que suas suítes internas estejam no repositório do aplicativo.
