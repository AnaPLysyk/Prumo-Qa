# Administração (interface)

**O que a tela faz:** mostra a documentação viva desta versão — para cada tela do menu, a interface, os canais da janela (IPC), o backend por papel e os testes — e o estado do sistema (versão, commit do build, situação de usuários e permissões).

| Arquivo | O que tem dentro |
| --- | --- |
| `mostrarAdministracao.js` | A tela: abas Documentação viva e Sistema, busca e a lista de telas na ordem interface → canais → backend → testes. |
| `administracao.css` | Estilos da lista de arquivos e das seções. |

**De onde vêm os dados:** `window.prumo.administracaoMapa()` → canal `administracao:mapa` → `backend/administracao/api/administracaoMapa.ts` → `backend/administracao/banco/lerMapaDoAplicativo.ts`, que lê `dist/documentacao/mapa.json`. Esse arquivo é gerado no build por `ferramentas/arquitetura/gerar-mapa-do-aplicativo.mjs` a partir do código e não é versionado.

**Login:** a entrada, Minha conta e a sessão ficam na tela própria `frontend/login/`. Aqui ficam a gestão de usuários, papéis e permissões, os agentes da plataforma e as configurações gerais de acesso.
