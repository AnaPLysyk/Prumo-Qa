# Login (interface)

**O que a tela faz:** a entrada do Prumo, que abre sempre antes de qualquer outra tela e não deixa usar nada sem entrar: primeiro acesso (criar a conta de Administrador), entrar, cadastrar a própria conta, recuperar a senha com o código, trocar a senha temporária, entrar ou se cadastrar pelo GitHub ou pelo Google (o navegador abre, a pessoa autoriza e volta já autenticada) e "Minha conta" (nome e senha). Também esconde do menu o que o papel da pessoa não permite e bloqueia telas sem acesso. A gestão de usuários e papéis fica em Administração.

| Arquivo | O que tem dentro |
| --- | --- |
| `entrarNaConta.js` | Vistas de primeiro acesso, entrada, recuperação, troca de senha, código de recuperação, espera da autorização do GitHub ou do Google e Minha conta; menu por papel e proteção das telas. |
| `vitrineDaEntrada.js` | A vitrine visual da entrada (céu, órbita e lema). |
| `entrada.css` | Estilos da entrada e do menu da conta. |

**De onde vêm os dados:** `window.prumo.conta*` (`backend/aplicativo/preload.cjs`) → canais `conta:*` em `backend/login/api/`. São canais IPC da janela, não endpoints HTTP.
