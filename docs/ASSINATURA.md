# Assinatura digital do Prumo QA

**Estado atual: o instalador e os executáveis (`Prumo QA.exe`, `aprovar.exe`, desinstalador) NÃO são assinados.** Nada neste repositório compra, cria ou finge um certificado. Este documento registra a investigação (consultada em 2026-10-10) e o que já está preparado para assinar com uma credencial legítima.

## Em poucas palavras

O Prumo não tem assinatura digital hoje. O SHA-256 ajuda a identificar se um arquivo mudou, mas não confirma quem o criou. Não desative as proteções do Windows para instalar o aplicativo. A escolha de comprar um certificado ou publicar pela Microsoft Store depende da titular do projeto.

## Por que isso importa

Com **Smart App Control** (ou Controle de Aplicativo) ativo, o Windows bloqueia executáveis novos sem assinatura confiável. Nesta máquina isso já bloqueou o `aprovar.exe` recém-compilado e o instalador provisório do electron-builder. O Prumo **não** desativa essas proteções. Um arquivo assinado por uma AC confiável deixa de ser "sem assinatura", mas o SmartScreen ainda pode alertar até a reputação do editor se formar.

## Opções oficiais (fonte principal: Microsoft Learn, "Code signing options for Windows app developers", atualizada em 2026-08-29)

| Opção | Custo | Disponibilidade | Observações |
|---|---|---|---|
| **Microsoft Store (pacote MSIX)** | Gratuito (conta individual sem taxa) | Mundial | A Store **assina novamente** o MSIX após a certificação; o usuário não vê alerta do SmartScreen. Exige empacotar o app em MSIX e passar pela certificação. Conta individual: verificação leve com documento oficial e selfie. |
| **Azure Artifact Signing** (antes Trusted Signing) | ≈ US$ 9,99/mês | Organizações: EUA, Canadá, UE e Reino Unido. **Pessoa física: somente EUA e Canadá** | **Não elegível para uma pessoa física no Brasil.** Microsoft também orienta, nesse caso, o certificado OV. |
| **Certificado OV** (DigiCert, Sectigo, GlobalSign etc.) | ≈ US$ 150–300/ano | Mundial | Desde junho/2023 a chave privada precisa ficar em HSM ou token de hardware (não existe mais `.pfx` baixável). Validação de identidade em alguns dias úteis. SmartScreen: a reputação se forma com o tempo. |
| **Certificado EV** | ≈ US$ 400+/ano | Mundial | Desde 2024 não dá mais confiança instantânea no SmartScreen; não se justifica só por isso. |
| **SignPath Foundation** | Gratuito | Projetos de **código aberto** qualificados | O Prumo hoje é `UNLICENSED`/privado; só seria elegível se a titular escolhesse uma licença aberta. |
| **Autoassinado** | Gratuito | — | **Bloqueia a instalação** para o público; serve só para desenvolvimento ou ambiente corporativo gerenciado. **Não será usado para representar assinatura pública.** |

### Caminho recomendado (decisão da titular)

1. **Microsoft Store com MSIX** é a opção de menor custo e fricção para uma pessoa física no Brasil: conta gratuita, assinatura feita pela Store e sem alerta do SmartScreen. Exigiria um alvo `appx`/MSIX no electron-builder, a verificação de que `aprovar.exe` e o runtime Node embutido são aceitos na certificação, e a adaptação do fluxo de atualização (a Store distribui as atualizações). Não foi implementado: depende da criação da conta e da decisão da titular.
2. **Certificado OV** com a chave em HSM/token (ou HSM em nuvem do fornecedor): permite continuar distribuindo o `.exe` pelo GitHub Releases. Custo anual e validação de identidade da titular.
3. **SignPath Foundation**, se houver decisão de abrir o código.

**Nada disso deve ser contratado, e nenhum documento pessoal deve ser enviado, sem autorização da titular.**

## O que já está preparado no build

- `ferramentas/empacotamento/assinar-windows.cjs`, ligado em `electron-builder.yml` (`win.signtoolOptions.sign`), assina **cada** executável (`Prumo QA.exe`, `aprovar.exe`, desinstalador e o instalador) quando existir a variável de ambiente `PRUMO_ASSINATURA_THUMBPRINT` (SHA-1 do certificado já disponível ao Windows da máquina de build). Opcionais: `PRUMO_SIGNTOOL` e `PRUMO_TIMESTAMP_URL`.
- **Sem credencial**, nada é assinado e o log diz isso (`permanece NÃO ASSINADO`). **Com credencial**, qualquer falha **interrompe o build**: nunca se publica um arquivo supostamente assinado.
- O workflow verifica a assinatura do instalador com `Get-AuthenticodeSignature` e as **notas da release** afirmam "assinado" somente se a verificação confirmar uma assinatura válida; caso contrário continuam dizendo "NÃO ASSINADO".
- Credenciais, certificados e chaves **nunca** entram no Git (`.gitignore` bloqueia `*.pfx`, `*.pem`, `*.key`; um teste verifica). Em CI, usar segredos do GitHub; certificados em token USB físico não funcionam em runners hospedados, então o caminho do CI exige HSM em nuvem do fornecedor ou um runner próprio.

## Como assinar quando houver credencial

1. Instale o certificado (ou o KSP do HSM em nuvem) na máquina de build e anote a impressão digital (`Get-ChildItem Cert:\CurrentUser\My`).
2. `$env:PRUMO_ASSINATURA_THUMBPRINT = '<sha1>'; npm.cmd run dist`
3. Confira: `Get-AuthenticodeSignature .\release\Prumo-QA-Setup-<versão>.exe` deve retornar `Status: Valid` e o assunto do editor.
4. No CI, configure o segredo `PRUMO_ASSINATURA_THUMBPRINT` e as ferramentas do fornecedor; a etapa de verificação passa a registrar "assinado".

## Fontes

- Microsoft Learn — [Code signing options for Windows app developers](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)
- Microsoft Learn — [Quickstart: Set up Artifact Signing](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart)
- Windows Developer Blog — [Free developer registration for individual developers on Microsoft Store](https://blogs.windows.com/windowsdeveloper/2025/09/10/free-developer-registration-for-individual-developers-on-microsoft-store/)
- electron-builder — [Windows configuration](https://www.electron.build/win) (`signtoolOptions.sign`, `azureSignOptions`)
- SignPath Foundation — https://signpath.io
