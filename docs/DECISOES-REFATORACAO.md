# Decisões da refatoração em desenvolvimento

## Interface e componentes

Mantemos JavaScript/HTML/CSS e a base DS existente. A migração para React adicionaria um renderer e pipeline novos, exigindo refazer os contratos de apresentação de todas as telas antes de obter um benefício verificado. A centralização do DS e os testes de teclado permitem melhorar os componentes compartilhados preservando o preload e os handlers atuais. Esta decisão pode ser revista por tela mediante evidência de custo e benefício.

Não foram adicionadas bibliotecas. shadcn/Radix/Mantine exigiriam integração React; tabelas, gráficos e grafos novos não foram implementados nesta etapa. A base principal continua DS. O catálogo atual está em [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md); a fonte oficial está em `frontend/design-system/`.

Adotamos coesão por funcionalidade e limites explícitos, princípios do [Bulletproof React](https://github.com/alan2207/bulletproof-react) e [Feature-Sliced Design](https://feature-sliced.design/docs/concepts/low-coupling), sem impor suas árvores ao Electron existente. [electron-vite](https://electron-vite.org/guide/dev) separa main, preload e renderer e permite entradas personalizadas; seu [build](https://electron-vite.org/guide/build) também requer atualizar o empacotamento. Essa troca não é necessária para corrigir as fontes duplicadas atuais.

## Identidade e administração

Hoje o aplicativo é local por conta Windows. `perfil.papel` personaliza respostas; não é papel de autorização. CredUI/LogonUser autentica exclusivamente as operações protegidas, com escopo e expiração; não cria sessão de login. Conexões externas têm identidades próprias, sem transferir credenciais para o chat.

Não há backend de autenticação remoto, serviço HTTP, repositório de usuários, emissor de sessão, recuperação de acesso ou banco central implementado no código. Não existe login ou administração multiusuário testados. A ausência de infraestrutura não deve ser apresentada como impedimento para escrever esses módulos: sua implementação e validação continuam pendentes. Não houve criação de usuário/senha padrão, migração PostgreSQL nem acesso a banco.

## Render

O site permanece estático, com geração manual de prévias declarada em `render.yaml`. A opção é documentada na [referência oficial](https://render.com/docs/blueprint-spec). Essa configuração local não cria prévia no Render nem confirma um deploy. O serviço existente usa `main` e deploy automático desligado. A configuração da prévia precisa ser sincronizada no serviço e executada a partir do PR; a produção e o catálogo publicado permanecem sujeitos à rotina [RELEASE.md](RELEASE.md).

## Fontes, adaptadores e testes

As entradas em `scripts/` usadas por package, Render, Electron Builder e workflows ficam preservadas até a migração dos consumidores. `scripts/gerar-site.mjs` é agora um adaptador pequeno para `site/gerar.mjs`. `app/` continua contendo runtime, preload, ajuda e catálogo de versões. Remover essas pastas em bloco quebraria consumidores conhecidos.

O catálogo de testes separa camada e natureza por arquivo. Arquivos com múltiplas responsabilidades não se tornam unitários só por não abrir janela; a divisão de casos dentro dos arquivos continua um trabalho posterior. Nada foi removido ou convertido em aprovação por nome semelhante.
