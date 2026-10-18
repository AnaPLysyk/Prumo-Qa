# Serviço do Prumo

O Prumo roda no computador de cada pessoa. Duas coisas precisam de um lugar central, e este serviço (no Render) faz as duas:

- **Códigos por e-mail:** manda o código de 6 dígitos do cadastro e do **Esqueci a senha**, pelo [Resend](https://resend.com).
- **Chamados de suporte:** recebe os chamados da tela de Suporte (com imagens e vídeo) e grava cada um como issue num **repositório privado** da equipe no GitHub. Quem abre o chamado não precisa de conta no GitHub. A equipe lê e responde em **Administração › Chamados**.

O módulo de **autenticação central** agora usa Better Auth e PostgreSQL. O envio de códigos e o suporte continuam disponíveis. Chaves e tokens ficam nas variáveis do serviço, nunca no aplicativo distribuído.

| Arquivo | O que faz |
| --- | --- |
| `servidor.mjs` | Junta as rotas, lê as variáveis de ambiente e responde `GET /saude`. |
| `autenticacao.mjs` | Better Auth + PostgreSQL, e-mail confirmado, sessões e recuperação com Resend. Inclui `GET /saude/autenticacao` para validar conexão ao banco sem revelar dados. |
| `auth.config.mjs` | Configuração do CLI Better Auth para gerar/migrar tabelas (somente com banco autorizado). |
| `recuperar-senha.html` e `recuperar-senha.js` | Página mínima para redefinição de senha por link de e-mail. |
| `codigos.mjs` | `POST /v1/codigos`: confere o pedido, limita e manda o e-mail. |
| `chamados.mjs` | Chamados: abrir, anexar, acompanhar e as rotas da administração. |
| `github.mjs` | Cliente do GitHub, preso ao repositório dos chamados. |
| `comum.mjs` | Resposta JSON, leitura do corpo com limite, IP, máscara e limites por janela de tempo. |

## Rotas

| Rota | Quem usa | O que faz |
| --- | --- | --- |
| `GET /saude` | Render | `{ ok, email, suporte, administracao }`: o que está configurado. |
| `POST /v1/codigos` | Aplicativo | `{ email, codigo, finalidade, idioma? }` → `202`. |
| `POST /v1/chamados` | Aplicativo | Abre o chamado → `201 { numero, chave }`. A chave aparece só aqui. |
| `PUT /v1/chamados/:n/anexos/:i` | Aplicativo | Manda o anexo `i` (corpo binário, `Content-Type` igual ao declarado, cabeçalho `X-Prumo-Chamado: <chave>`), até 2 horas depois de abrir. |
| `GET /v1/chamados/:n` | Aplicativo | Estado e respostas da equipe, com a chave do chamado. |
| `GET /v1/admin/chamados[?estado=]` | Administração | Lista os chamados (`Authorization: Bearer <chave de administração>`). |
| `GET /v1/admin/chamados/:n` | Administração | O chamado por inteiro, com anexos e respostas. |
| `GET /v1/admin/chamados/:n/anexos/:i` | Administração | O arquivo do anexo. |
| `POST /v1/admin/chamados/:n/respostas` | Administração | `{ texto }`: responde; a pessoa vê em **Meus chamados**. |
| `PATCH /v1/admin/chamados/:n` | Administração | `{ estado }`: `NOVO`, `EM_ANALISE`, `RESOLVIDO` ou `FECHADO`. |

## Segurança

- **Códigos:** 3 por e-mail a cada 10 minutos, 10 por dia, 30 por IP por hora e 300 no total por hora. O texto do e-mail é fixo; só o código muda.
- **Chamados:** 10 por IP por hora e 200 no total por hora; anexos e leituras também têm limite por IP. Só campos conhecidos e dentro do tamanho; texto sem caracteres de controle.
- **Chave do chamado:** 256 bits aleatórios, mostrada uma vez ao aplicativo. O chamado guarda só o resumo SHA-256. Chave errada e chamado inexistente respondem igual (`404`).
- **Texto da pessoa:** vai no issue dentro de blocos de código com cerca maior que qualquer sequência do texto, então menção (`@alguém`), link e HTML não têm efeito. Para leitura, os dados vão também num bloco base64.
- **Anexos:** só PNG, JPEG e WebP (até 5 MB, no máximo 3) e MP4 ou WebM (até 25 MB, no máximo 1). O tamanho tem de ser o declarado e a assinatura do arquivo tem de bater com o tipo: HTML com extensão de imagem não passa. Cada anexo é gravado uma vez, em `chamados/<número>/`, com nome limpo.
- **Administração:** chave de 32 caracteres ou mais, comparada em tempo constante. Dez erros de um mesmo IP na hora bloqueiam aquele IP por uma hora, antes de comparar.
- **GitHub:** o cliente só fala com o repositório configurado e só grava em `chamados/<número>/`; o token vai só no cabeçalho.
- **Registros:** o e-mail aparece mascarado; o texto do chamado, o nome, as chaves e os códigos nunca aparecem.
- **Limite conhecido:** os contadores ficam na memória e zeram quando o serviço reinicia.

## Colocar no ar (uma vez)

1. **Resend (e-mail):** crie a conta e verifique um domínio seu (**Domains › Add domain**). Crie uma chave em **API Keys** com **Sending access**. Sem domínio verificado, o Resend só entrega para o e-mail da própria conta.
2. **Repositório dos chamados:** no GitHub, crie um repositório **privado**, por exemplo `Prumo-QA-suporte`.
3. **Token do GitHub:** em **Settings › Developer settings › Fine-grained tokens**, crie um token com acesso **só a esse repositório** e as permissões **Issues: Read and write** e **Contents: Read and write**.
4. **Render:** crie o serviço pelo `render.yaml` do repositório (**New › Blueprint**) ou à mão: **Web Service**, raiz `servico-do-prumo`, build `node --version`, start `node servidor.mjs`, health check `/saude`.
5. **Variáveis do serviço:**
   - `RESEND_API_KEY` e `PRUMO_EMAIL_REMETENTE` (por exemplo `Prumo QA <nao-responda@seudominio.com>`);
   - `PRUMO_SUPORTE_REPOSITORIO` (`sua-conta/Prumo-QA-suporte`) e `PRUMO_SUPORTE_TOKEN` (o token do passo 3);
   - `PRUMO_SUPORTE_CHAVE_ADMIN`: o `render.yaml` já gera uma chave aleatória. Copie o valor: é ele que vai em **Administração › Chamados** no aplicativo.
6. Faça **Manual Deploy** e abra `https://<serviço>.onrender.com/saude`: precisa mostrar `"email":true`, `"suporte":true` e `"administracao":true`.

O aplicativo usa `https://prumo-qa-servico.onrender.com`. Se o Render der outro endereço, troque `ENDERECO_DO_SERVICO` em `backend/compartilhado/integracoes/servicoDoPrumo.ts` e gere uma versão nova.

No plano gratuito, o Render adormece o serviço depois de 15 minutos sem uso. O primeiro pedido depois disso pode levar até um minuto; o aplicativo espera até 75 segundos (3 minutos para anexos).

## Testes

- `testes/unitario/backend/login/servico-do-prumo-codigos.test.mjs` e `testes/unitario/backend/suporte/servico-do-prumo-chamados.test.mjs` sobem o serviço em `127.0.0.1` com uma caixa de e-mail e um repositório em memória.
- Os testes da janela usam o mesmo serviço local (`testes/apoio/caixa-de-email.mjs` e `testes/apoio/repositorio-de-suporte-falso.mjs`).
- Nenhum teste fala com o Resend nem com o GitHub.
