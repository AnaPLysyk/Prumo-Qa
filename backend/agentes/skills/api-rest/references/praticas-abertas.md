# Checklist de testes de API

Adaptado de `api-testing` (fugazi/test-automation-skills-agents, MIT; ver `backend/agentes/skills/TERCEIROS.md`) e ajustado às regras do Prumo QA: endpoints, campos e códigos vêm do requisito ou do contrato aprovado, nunca de dedução.

## Por resposta

- Valide o corpo contra um esquema, não só o status. Checar só o status esconde mudança de contrato.
- Escolha de propósito entre esquema estrito (rejeita campo extra) e tolerante (aceita), e registre o motivo.

## Cobertura mínima quando o requisito prevê

- **Status:** sucesso e erros exigidos (por exemplo 400, 401, 403, 404, 409, 422).
- **Autenticação e autorização:** 401 sem credencial válida e 403 para perfil insuficiente em todo endpoint protegido.
- **Entradas:** tipos inválidos, corpo vazio, valores-limite e tentativa de injeção.
- **Idempotência:** repetir PUT e DELETE produz o mesmo efeito.
- **Paginação, filtro e ordenação:** bordas (primeira e última página, filtro vazio, ordenação estável).
- **Limite de requisições:** comportamento de bloqueio, quando documentado.
- **Contrato entre serviços:** versão e compatibilidade, quando houver mais de um serviço.

## Dados e segredos

- Tokens e segredos vêm de variáveis de ambiente ou cofre, nunca escritos no teste.
- Dados únicos por teste, e limpeza do que foi criado. Nenhum teste depende da ordem de execução.
- Nunca use banco ou ambiente de produção.

## Diagnóstico rápido

- 401 numa chamada autenticada: token expirado ou inválido; renove antes de concluir defeito.
- Instabilidade: verifique limite de requisições e colisão de dados antes de culpar o produto.
