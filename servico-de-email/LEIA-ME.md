# Serviço de envio de e-mail

O Prumo roda no computador de cada pessoa e não tem como mandar e-mail sozinho. Este serviço recebe do aplicativo um código de 6 dígitos e o manda ao e-mail informado, pelo [Resend](https://resend.com). É usado no cadastro por e-mail e em **Esqueci a senha**.

| Rota | O que faz |
| --- | --- |
| `POST /v1/codigos` | Corpo JSON `{ email, codigo, finalidade, idioma? }`: `codigo` com 6 dígitos, `finalidade` `CADASTRO` ou `SENHA`, `idioma` `pt-BR` ou `en`. Responde `202` quando o provedor aceitou. |
| `GET /saude` | `{ ok, configurado }`, para o Render saber que o serviço está de pé. |

**Erros:** `400 EMAIL_INVALID` (pedido fora do formato), `413`/`415` (corpo grande ou não JSON), `429 EMAIL_RATE_LIMIT`, `502 EMAIL_SEND_FAILED` (o Resend recusou ou não respondeu) e `503 EMAIL_SERVICE_NOT_CONFIGURED`.

**Limites:** 3 códigos por e-mail a cada 10 minutos, 10 por e-mail por dia, 30 por IP por hora e 300 no total por hora. Os contadores ficam só na memória e zeram quando o serviço reinicia.

**O que fica guardado:** nada. Não há banco. O registro mostra o e-mail mascarado (`a***@dominio.com`) e nunca o código. Quem confere o código é o aplicativo, que guarda só um resumo dele, na memória, por 10 minutos.

## Colocar no ar (uma vez)

1. Crie uma conta no Resend e verifique um domínio seu (**Domains › Add domain**, com os registros DNS que ele mostrar). Sem domínio verificado, o Resend só entrega para o próprio e-mail da conta.
2. Crie uma chave em **API Keys** com permissão **Sending access**.
3. No Render, crie o serviço pelo `render.yaml` do repositório (**New › Blueprint**) ou à mão: **Web Service**, raiz `servico-de-email`, build `node --version`, start `node servidor.mjs`, health check `/saude`.
4. Preencha as variáveis do serviço: `RESEND_API_KEY` (a chave) e `PRUMO_EMAIL_REMETENTE`, por exemplo `Prumo QA <nao-responda@seudominio.com>`.
5. Faça **Manual Deploy**. Abra `https://<serviço>.onrender.com/saude`: precisa mostrar `"configurado":true`.

O aplicativo usa `https://prumo-qa-email.onrender.com`. Se o Render der outro endereço ao serviço, troque `ENDERECO_DO_SERVICO` em `backend/login/integracoes/enviarCodigoPorEmail.ts` e gere uma versão nova.

No plano gratuito, o Render adormece o serviço depois de 15 minutos sem uso. O primeiro código depois disso pode levar até um minuto; o aplicativo espera até 75 segundos.

## Testes

`testes/unitario/backend/login/servico-de-email.test.mjs` sobe o serviço em `127.0.0.1` com uma caixa em memória no lugar do Resend. Os testes da janela usam o mesmo serviço, também com a caixa em memória (`testes/apoio/caixa-de-email.mjs`). Nenhum teste fala com o Resend.
