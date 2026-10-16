# Login (interface)

**O que a tela faz:** a entrada do Prumo, que abre sempre antes de qualquer outra tela e não deixa usar nada sem entrar: primeiro acesso (criar a conta de Administrador), entrar (e-mail ou login), cadastrar a própria conta por e-mail com o código de confirmação, definir senha nova com o código mandado ao e-mail, trocar a senha temporária, entrar ou se cadastrar pelo GitHub ou pelo Google (o navegador abre, a pessoa autoriza e volta já autenticada; no primeiro acesso, sem configuração, a entrada pede o Client ID e o segredo), idioma e site oficial abaixo do cartão, e "Minha conta" (nome e senha). Também esconde do menu o que o papel da pessoa não permite e bloqueia telas sem acesso. A gestão de usuários e papéis fica em Administração.

| Arquivo | O que tem dentro |
| --- | --- |
| `entrarNaConta.js` | Vistas de entrada, criar conta, confirmar e-mail (código de 6 dígitos), esqueci a senha, senha nova, troca da senha temporária, configuração e espera da autorização do GitHub ou do Google, rodapé (idioma e site) e Minha conta; menu por papel e proteção das telas. |
| `vitrineDaEntrada.js` | A vitrine visual da entrada (céu, órbita e lema). |
| `entrada.css` | Estilos da entrada e do menu da conta. |

**De onde vêm os dados:** `window.prumo.conta*` (`backend/aplicativo/preload.cjs`) → canais `conta:*` em `backend/login/api/`. São canais IPC da janela, não endpoints HTTP.
