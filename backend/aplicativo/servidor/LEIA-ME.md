# Servidor HTTP do Prumo QA — aplicativo

Este arquivo `servidor.mjs` apenas **inicializa a API Node.js** que roda no Render. Ele reúne os módulos HTTP que pertencem às telas, sem carregar regras de negócio dentro do aplicativo.

## Onde encontrar cada parte

| Caminho | Responsabilidade |
| --- | --- |
| `backend/aplicativo/servidor/servidor.mjs` | Ponto de entrada HTTP, roteamento e `/saude` |
| `backend/login/servidor/autenticacao.mjs` | Better Auth, sessões, senha, PostgreSQL e mensagens de verificação |
| `backend/login/servidor/codigos.mjs` | Envio legado de códigos por e-mail, com limites |
| `backend/login/servidor/recuperar-senha.html` | Página de recuperação de acesso |
| `backend/login/servidor/recuperar-senha.js` | Confirmação da nova senha |
| `backend/login/servidor/auth.config.mjs` | Contrato de migração Better Auth |
| `backend/login/servidor/migrar-autenticacao.mjs` | Migração DEV explícita, nunca automática |
| `backend/suporte/servidor/chamados.mjs` | Validação, abertura, anexos e consultas de chamados |
| `backend/suporte/servidor/github.mjs` | Integração do suporte com repositório privado |
| `backend/compartilhado/servidor/comum.mjs` | Respostas HTTP, validação do corpo e limites reutilizados |
| `backend/login/servidor/package.json` | Dependências somente da API remota; separadas do Electron |

A interface desktop fica em `frontend/login` e `frontend/suporte`; as respectivas APIs locais ficam em `backend/login/api` e `backend/suporte/api`. Os arquivos `servidor/` não são telas novas: executam **a lógica remota das telas existentes**.

## Execução

Na raiz do repositório:

```sh
cd backend/login/servidor
npm ci
npm start
```

O servidor exige `PORT` apenas se a porta padrão não servir. A autenticação permanece desativada quando não há configuração.

Para a integração central, configurar **somente no Render**:

- `BETTER_AUTH_URL`: endereço HTTPS publicado da API;
- `BETTER_AUTH_SECRET`: segredo aleatório e não versionado;
- `DATABASE_URL`: conexão **interna** do PostgreSQL no Render;
- `RESEND_API_KEY` e `PRUMO_EMAIL_REMETENTE`: serviço de e-mail configurado.

Sem esses valores, o servidor pode expor `GET /saude`, mas não permite login real. O banco de dados gratuito existente expira em 12/11/2026; não colocar contas reais nele sem plano de persistência.

## Render

Para serviços que usam `render.yaml` como Blueprint:

- `rootDir: backend/login/servidor`
- `buildCommand: npm ci --omit=dev`
- `startCommand: node ../../aplicativo/servidor/servidor.mjs`

**O serviço de desenvolvimento já criado no painel Render usa rootDir vazio**. Seus comandos equivalentes são:

- Build: `cd backend/login/servidor && npm ci --omit=dev`
- Start: `node backend/aplicativo/servidor/servidor.mjs`

Esses comandos devem ser atualizados antes do próximo deploy do serviço de desenvolvimento. Não alterar o serviço estático `prumo-qa-docs` e não publicar instalador nesta homologação.

## Segurança e homologação

Sem migração automática no startup. Aplicar tabelas Better Auth em ambiente DEV autorizado, com backup antes de compartilhar usuários reais. O Electron não acessa o banco diretamente; usa HTTPS e mantém a sessão remota no Main, fora do Renderer.

Os testes de e-mail e chamados usam HTTP local com provedores falsos, sem enviar mensagens reais ou criar issues. Os testes de login remoto não substituem testes E2E contra o serviço configurado.
