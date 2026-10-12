# Contrato de um projeto — três passos

1. `proporContrato.ts`: lê a estrutura básica da pasta e propõe o contrato **sem gravar**.
2. `resumirContrato.ts`: explica à pessoa o que será criado.
3. `gravarContratoAprovado.ts`: salva o arquivo somente após autorização e desfaz se a validação falhar.

A entrada antiga `src/contratoDetectado.ts` continua apontando para esses três arquivos, por compatibilidade com Electron e testes.
