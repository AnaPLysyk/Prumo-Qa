# Skills e permissões reais

`skills/manifesto.json` registra as oito especializações existentes, os caminhos preservados, o consumidor do chat, capacidades e políticas padrão. As políticas efetivas continuam sendo verificadas no backend em `backend/agentes/politicas/exigirCapacidade.ts`; o manifesto não concede autorização.

A versão de cada Skill é seu SHA-256 integral, sem inventar uma versão editorial. `INSTRUCOES_DISPONIVEIS` significa arquivo presente, não agente executado ou Skill instalada no cliente. A instalação em Claude/Codex é opcional e não comprovada por este registro. Os roteiros MCP usam `backend/agentes/tipos/roteiros.ts`, e não carregam automaticamente esses arquivos.

Valide com `node ferramentas/skills/verificar.mjs` e `node --test testes/estrutura/skills.test.mjs`. Ambos apenas leem fontes do repositório: não acessam SQLite, projetos externos nem rede. A suíte principal já inclui `testes/estrutura/*.test.mjs`.

Após alterar uma Skill, atualize seu campo `versao` com `sha256:` seguido do hash dos bytes do arquivo. Após alterar o catálogo de especializações ou permissões, atualize o manifesto e revise o parser estático do validador. Uma divergência falha explicitamente; não há execução de TypeScript nem importação de módulos de persistência.

O chat resolve a Skill somente pelo catálogo de especializações e lê o arquivo integral uma vez por prompt, até 64 KiB. Especialização desconhecida, caminho não cadastrado, arquivo ausente, vazio ou acima do limite gera `SKILL_UNAVAILABLE`, mostrado no aviso da resposta local; o provedor externo não é executado. A autorização de execução humana e os controles de publicação permanecem obrigatórios.
