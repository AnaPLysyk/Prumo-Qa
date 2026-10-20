# Identidade única do Prumo QA (desenvolvimento, sem deploy)

Data: 17/10/2026. Projeto local v2.18.0. **Não é release**.

## Por que foi necessário

Até a v2.18.0, `acessos.json` determinava se um usuário "existia" e quem virava administrador do computador. Isso impedia login em instalações novas. No modo novo, **Supabase Auth é a autoridade da identidade**, e o JSON local guarda apenas uma projeção, sessão local e permissões do aplicativo. O ID da conta do Prumo para usuários novos é o mesmo UUID do Supabase, independente do computador. Projetos, evidências e conexões continuam locais, não são copiados entre instalações.

As identidades existentes não são vinculadas por coincidência de e-mail: para isso será preciso uma operação de migração confirmada pelo dono, nunca apropriação automática. O primeiro usuário do PC **não** se torna Administrador. O papel QA é o padrão para pessoas com identidade confirmada; a marca admin só vem de `app_metadata.prumo_admin===true` no Supabase (metadado de servidor, não definido pelo usuário). Contas locais antigas permanecem legíveis e o login antigo continua disponível quando a identidade central não está configurada.

## Configuração única de um projeto Supabase Auth de DESENVOLVIMENTO

1. Crie ou selecione um **projeto de teste** em https://supabase.com/dashboard (não o Render; o site `prumo-qa-docs` não muda). Não hospede o Electron.
2. Em **Project Settings › API**, anote somente **Project URL** (`https://<project-ref>.supabase.co`) e a **Publishable key** (`sb_publishable_...`). **Não** use `service_role`, `secret key`, senha de banco, access token pessoal ou segredos dos provedores no aplicativo.
3. Em **Authentication › Providers**, habilite **Email**, **GitHub** e/ou **Google**. O GitHub/Google deve ser cadastrado pelo **mantenedor do Prumo** na configuração OAuth do Supabase; os usuários não configuram Client ID ou tokens. A URL de callback a registrar nos provedores é `https://<project-ref>.supabase.co/auth/v1/callback` (obtida na tela do Supabase). O projeto pode estar restrito a usuários de teste na homologação.
4. Em **Authentication › URL Configuration › Redirect URLs**, adicione a URL de loopback `http://127.0.0.1:*/callback*`. Essa URL tem porta dinâmica: valide a regra de wildcard contra a URL final que o app iniciar. Não adicione URLs externas arbitrárias.
5. Para **código de 6 dígitos**, vá a **Authentication › Email Templates**. Os modelos pertinentes (Magic Link/OTP e Confirm signup, caso de novos usuários) devem mostrar `{{ .Token }}` e não exigir clicar `{{ .ConfirmationURL }}`; modelo com link não serve para a tela de código. Configure envio SMTP e limite para os testes, conforme as regras do plano Supabase. A entrega do e-mail ainda exige homologação real.

A configuração pública pode ser colocada em `backend/login/integracoes/identidadePublicaDoPrumo.ts` **antes de empacotar**, ou configurada no terminal para homologação local:

**PowerShell (não CMD):**
```powershell
cd C:\Users\DELL\projetos-github\Prumo-Qa
$env:PRUMO_AUTH_URL = 'https://SEU-PROJETO.supabase.co'
$env:PRUMO_AUTH_PUBLISHABLE_KEY = 'sb_publishable_SUA_CHAVE_PUBLICA'
npm.cmd run build
node testes/apoio/preparar-ambiente.mjs --iniciar
```

**CMD:**
```cmd
cd C:\Users\DELL\projetos-github\Prumo-Qa
set "PRUMO_AUTH_URL=https://SEU-PROJETO.supabase.co"
set "PRUMO_AUTH_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE_PUBLICA"
npm.cmd run build
node testes\homologacao\preparar-ambiente.mjs --iniciar
```

O script preserva as duas variáveis **públicas** e limpa segredos/credenciais do processo. Cria sempre perfil TEMP novo. Não utiliza `C:\Users\DELL\AppData\Local\PrumoQA` nem altera o aplicativo instalado.

## Homologação

- Entrar com e-mail: solicitar código, receber mensagem de 6 dígitos, confirmar e ver a sessão aberta (sem criar senha no aplicativo).
- Entrar com Google ou GitHub: abrir navegador padrão, autorizar no próprio serviço; retorno para 127.0.0.1 e sessão identificada no Prumo, sem tokens dos provedores na interface.
- Em um segundo perfil TEMP, entrar com a mesma identidade; conferir o mesmo UUID da conta do Prumo e papéis esperados; dados locais não sincronizam.
- Conta existente no legado com mesmo e-mail: manter erro controlado `IDENTITY_LINK_REQUIRED` e exigir uma migração verificada antes de vincular, **não assumir conta administrativa por e-mail**.
- Sem configuração pública, fluxo local antigo continua disponível. **Isso não é prova de login central funcionando.**

## Validação e restrições

`npm.cmd run build`, `npm.cmd run test:unitarios`. Os testes automatizados usam uma imitação explícita do provedor, sem realizar login real ou usar conta externa. O aplicativo **não está publicado** e o Render/site **não foi modificado**.

Limitação: o projeto Supabase, SMTP, template de e-mail e provedores OAuth precisam estar configurados para o teste com usuário real. Quando o login central estiver configurado, perfis locais legados não são importados silenciosamente.
