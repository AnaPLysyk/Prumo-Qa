# Autenticação central do Prumo QA — implementação local (18/10/2026)

## Componentes conferidos
- Desktop: Electron Renderer -> Preload/IPC -> Electron Main (sem token no Renderer).
- API: `backend/aplicativo/servidor/servidor.mjs`; autenticação: `backend/login/servidor/autenticacao.mjs`, Better Auth + PostgreSQL; suporte: `backend/suporte/servidor/`.
- Banco já existente no Render: **prumo-qa-contas-db**, PostgreSQL 18, plano gratuito; expiração indicada em **12/11/2026**. **NÃO migrar contas reais enquanto o banco não tiver permanência/backup definidos.**
- Site `prumo-qa-docs` no Render é estático e não executa a API de autenticação.
- O serviço de desenvolvimento `prumo-qa-auth-dev` já foi criado no Render em branch própria; não foi configurado com banco real nem e-mail. Site e instaladores não foram alterados.
- A release v2.18.0 possui os cinco arquivos oficiais: `.exe`, `.deb`, `.AppImage`, `.dmg` Intel e `.dmg` ARM, com SHA-256. Não foi feita instalação funcional em macOS/Linux.

## Backend — fluxo técnico
- `POST /api/auth/sign-up/email`: cadastra pessoa no banco; exige confirmação do e-mail antes de entrar.
- `POST /api/auth/sign-in/email`: verifica senha no Better Auth e emite sessão `HttpOnly` / `Secure`.
- `GET /api/auth/get-session`: revalida a sessão e o e-mail confirmado.
- `POST /api/auth/sign-out`: revoga sessão remota.
- `POST /api/auth/request-password-reset`: envia e-mail; link abre `/recuperar-senha#token=...` e formulário envia `POST /api/auth/reset-password`.
- `GET /saude` e rotas de suporte/códigos existentes foram mantidos, sem regressão voluntária.
- Cookies ficam somente no Electron Main, não são gravados no JS da tela; IPC valida sessão remota periodicamente (20 segundos).
- Contas locais legadas com o mesmo e-mail **não são automaticamente associadas**: o backend retorna `IDENTITY_LINK_REQUIRED`. O processo de migração exige uma etapa própria.
- Novo cadastro remoto é QA comum, não Administrador. A política de autorização administrativa pelo servidor será definida antes de liberar o painel de Administração.

## Render — configuração pendente
No serviço DEV (`prumo-qa-auth-dev`), ajustar os comandos para **build** `cd backend/login/servidor && npm ci --omit=dev` e **start** `node backend/aplicativo/servidor/servidor.mjs`; usar Node >=22 e `/saude`. O Blueprint também usa a raiz do repositório, preservando os arquivos de recuperação em `frontend/login/web/`. Variáveis pendentes:
- `DATABASE_URL` = **Internal Database URL** do Postgres existente no mesmo workspace, acessível somente pelo servidor. Não salvar no código.
- `BETTER_AUTH_URL` = URL HTTPS pública do serviço Node real (em DEV, `https://prumo-qa-auth-dev.onrender.com`).
- `BETTER_AUTH_SECRET` = segredo aleatório >=32 caracteres, só no Render (blueprint pode gerá-lo).
- `RESEND_API_KEY`, `PRUMO_EMAIL_REMETENTE` = credenciais/identidade do e-mail de domínio validado, só no servidor.

O serviço de autenticação exige todas essas configurações. **Não informar segredos no chat nem embutir no instalador.**

## PostgreSQL — migrations obrigatórias
Antes de ativar login real, aplicar em ambiente controlado o esquema gerado pelo CLI do Better Auth, incluindo tabelas `user`, `session`, `account`, `verification` e `rateLimit`. O CLI usa `backend/login/servidor/auth.config.mjs` e a migração controlada `backend/login/servidor/migrar-autenticacao.mjs`. Nunca rodar migrações de produção sem backup e validação de conexão. O Beekeeper Studio é apenas cliente de administração; não executa autenticação.

## Desktop — homologação isolada
Após implantar o servidor **de desenvolvimento**, configurar **somente no ambiente de homologação** `PRUMO_AUTH_API_URL=https://<servico>.onrender.com`, e executar:
`node testes/apoio/preparar-ambiente.mjs --iniciar`

O script cria um perfil TEMP, não copia contas ou tokens anteriores e ativa o login remoto. O app instalado continua intacto. Não colocar o endereço fixo no app distribuído nem publicar release antes de validar no mínimo: cadastro, confirmação de e-mail, login, senha errada, recuperação, logout, sessão revogada e isolamento A/B.

## Distribuição
GitHub Actions usa Windows, macOS e Linux nativos. GitHub Releases armazena os instaladores. O gerador do site Render copia os arquivos da release, valida SHA-256 e oferece download local no site quando possível; se não, aponta para GitHub. O Render **não compila automaticamente executáveis por reconhecer Electron**. Preservar este fluxo.
