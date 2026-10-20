# Skills e permissões reais

`backend/agentes/skills/manifesto.json` registra as oito especializações existentes, os caminhos preservados, o consumidor do chat, capacidades e políticas padrão. As políticas efetivas continuam sendo verificadas no backend em `backend/agentes/politicas/exigirCapacidade.ts`; o manifesto não concede autorização.

A versão de cada Skill é seu SHA-256 integral, sem inventar uma versão editorial. `INSTRUCOES_DISPONIVEIS` significa arquivo presente, não agente executado ou Skill instalada no cliente. A instalação em Claude/Codex é opcional e não comprovada por este registro. Os roteiros MCP usam `backend/agentes/tipos/roteiros.ts`, e não carregam automaticamente esses arquivos.

Valide com `node ferramentas/skills/verificar.mjs` e `node --test testes/unitario/backend/compartilhado/skills.test.mjs`. Ambos apenas leem fontes do repositório: não acessam SQLite, projetos externos nem rede. O teste também roda em `npm run test:unitarios`.

Após alterar uma Skill, atualize seu campo `versao` com `sha256:` seguido do hash dos bytes do arquivo. Após alterar o catálogo de especializações ou permissões, atualize o manifesto e revise o parser estático do validador. Uma divergência falha explicitamente; não há execução de TypeScript nem importação de módulos de persistência.

## Banco de Skills (skills.db)

Os arquivos de `backend/agentes/skills/` continuam sendo a fonte das Skills que acompanham o aplicativo e o que clientes MCP podem instalar. Para o chat, o Prumo guarda cada Skill no banco local `skills.db` (separado do `conhecimento.db`), dividida em trechos (`backend/agentes/regras/dividirSkillEmTrechos.ts`). Os trechos do aplicativo são sincronizados a cada versão (`backend/agentes/banco/comBancoDeSkills.ts`).

O prompt da IA externa leva só os trechos APROVADOS da especialização que combinam com a pergunta, até 8 KB (`backend/agentes/regras/escolherTrechosDaSkill.ts`), em vez do arquivo inteiro. Isso mantém o texto bem abaixo do limite de linha de comando do Windows (cerca de 32 KB).

| Origem | Como entra | Estado inicial |
| --- | --- | --- |
| PRUMO | `backend/agentes/skills/<pasta>/SKILL.md` e `references/*.md` do aplicativo | APROVADO |
| PESSOA | escrito pela equipe (`skills:criar`) | APROVADO |
| IMPORTADO | pasta de Skill aberta já presente no computador (`skills:importar`), com fonte e licença | RASCUNHO |
| IA | sugestão de IA | RASCUNHO |

A importação só aceita licença aberta reconhecida (MIT, Apache-2.0, BSD, ISC, 0BSD, Unlicense, CC0, CC-BY, CC-BY-SA), lê apenas `SKILL.md` e `references/*.md` e ignora scripts. Nada é baixado nem executado. Crédito e licença de material adaptado para os arquivos do aplicativo continuam em `backend/agentes/skills/TERCEIROS.md`.

Especialização desconhecida (inclusive com `../`) é recusada antes de qualquer leitura (`SKILL_SPECIALIZATION_INVALID`). Sem nenhum trecho aprovado, o resultado é `SKILL_UNAVAILABLE`, mostrado no aviso da resposta local, e o provedor externo não é executado. Se o banco não abrir, o chat usa só as Skills do aplicativo e avisa na resposta. A autorização de execução humana e os controles de publicação permanecem obrigatórios.
