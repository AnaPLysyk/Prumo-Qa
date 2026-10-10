# Entrega Prumo QA 2.3 — consolidação de engenharia

## Resumo

A 2.3 não reconstrói nada: evolui a 2.2 mantendo núcleo, MCP (quatro ferramentas), CLI, janela Electron e controles de segurança. Acrescenta contratos técnicos catalogados, histórico de versões, verificação manual de atualização, central de ajuda, gestão dos dados locais, diagnóstico da interface e um laboratório independente para avaliar o próprio Prumo.

## Funcionalidades e diferenças em relação à 2.2

| Área | O que mudou | Onde |
|---|---|---|
| Contratos | 20 operações IPC e 4 ferramentas MCP descritas em uma fonte única; esquemas IPC compartilhados entre validação e catálogo; catálogo na janela e em `docs/CONTRATOS.md` (gerado) | `src/contratos.ts`, `scripts/gerar-contratos.mjs` |
| Versões | Histórico 2.0.0–2.3.0 validado, comparação semântica, versão instalada, notas de release geradas | `app/versoes.json`, `src/versoes.ts`, `scripts/notas-versao.mjs` |
| Atualização | Verificação manual da release oficial; destino fixo, timeout, resposta validada, sem download nem execução | `src/atualizacao.ts` |
| Ajuda | 14 documentos reorganizados, perguntas frequentes expansíveis, painéis Versões, Atualizações, Integrações técnicas e Privacidade e dados | `app/ajuda/`, `app/renderer/` |
| Dados | Resumo, exportação e exclusão por escopo (histórico, evidências, diagnóstico) com confirmação nativa | `src/dados.ts`, `atividades.ts`, `evidencias.ts`, `diagnostico.ts` |
| Observabilidade | Diagnóstico IPC só de metadados, separado das métricas; polling não gera evento de QA | `src/diagnostico.ts`, `src/desktop/main.ts` |
| Laboratório | Projeto independente com 8 casos | `C:\Users\DELL\projetos-github\Prumo-QA-Lab` |
| Distribuição | CI instala a 2.2.0 publicada, cria dados reais e atualiza por cima; SHA-256 do instalador; notas geradas | `.github/workflows/windows.yml` |

Correções feitas no caminho (cada uma achada por teste ou pelo laboratório): o MCP informava versão fixa 2.2.0; excluir o diagnóstico deixava um novo registro de si mesmo; um critério do plano do caso 2 do laboratório estava mal construído (corrigido o plano, não o critério).

## Arquitetura final

```text
Janela (app/renderer, sandbox, CSP, sem rede) → window.prumo (app/preload.cjs, 20 funções)
  → IPC prumo:* (src/desktop/main.ts: remetente, esquema de src/contratos.ts, diagnóstico)
  → adaptador (src/painel.ts, src/vinculos.ts, src/dados.ts)
  → núcleo (projeto, qualidade, execucao, evidencias, atividades, conexoes, aprovacao)
Agentes de IA → MCP stdio (src/mcp.ts) → o mesmo núcleo
```

Consulta de atualização: única saída de rede, feita pelo processo principal. Exclusão e atualização não existem como ferramentas MCP.

## Prumo QA Lab

Pasta `Prumo-QA-Lab` (irmã de `Prumo-Qa`), commit local `06e1d5c`. Oito casos (limites, equivalência, permissões, persistência após recusa, redundância, falta de oráculo, falso positivo, contradição/ambiente bloqueado), cada um com requisito, plano e critérios; contexto autorizado do contrato não inclui as respostas esperadas.

Resultados reais gravados em `avaliacoes/resultados/`:

| Avaliação | Resultado |
|---|---|
| Determinística (MCP real) — Prumo 2.2.0 (código da tag v2.2.0) | 8/8 casos, 100/100 verificações |
| Determinística (MCP real) — Prumo 2.3.0 | 8/8 casos, 100/100 verificações; comparação 2.2.0 → 2.3.0: nenhuma diferença nos critérios |
| Mutantes | 4 lacunas confirmadas (defeitos que os testes existentes não detectam: limite 18, GERENTE, recusa que altera dado, desconto) e 2 controles detectados |
| Semântica (Codex) | **NAO_EXECUTADA** nos 8 casos: o Codex respondeu "usage limit" nesta máquina. Nada foi fabricado; o leitor do JSONL foi testado só com fixture sintética |
| Testes do próprio laboratório | 9/9 (inclui reprovação de PASS inventado, de execução afirmada e de seleção errada) |

**Publicação:** o repositório `AnaPLysyk/Prumo-QA-Lab` não existe no GitHub (HTTP 404) e não há GitHub CLI autenticado nem criação de repositório pelo acesso Git atual. O laboratório está commitado localmente com `origin` apontando para o endereço, pronto para publicar assim que o repositório for criado: `git push -u origin main`. Não extraí credenciais do gerenciador do Git para contornar isso.

## Testes

| Verificação | Resultado |
|---|---|
| `npm run check` local (tipos, build, 131 testes) | 127 passaram, 3 ignorados e **1 falha ambiental** |
| Falha local | o teste do broker `aprovar.exe`: o Smart App Control bloqueia o executável recém-compilado (`spawnSync UNKNOWN`, intermitente; passou em outras rodadas locais e passa no CI). Não foi alterado nem contornado |
| 3 testes ignorados | `testes/migracao.test.mjs` só roda no CI de instalação (`PRUMO_MIGRACAO=1`); o workflow reprova se forem ignorados lá |
| CI no Windows limpo (commit `89763ac`) | todas as etapas passaram: suíte completa (inclui o broker), instalador, instalação da 2.2.0 publicada (hash fixado), criação de dados reais com ela, atualização por cima, migração, janela e MCP no instalado, desinstalação preservando dados, SHA-256 |
| Janela real (Playwright sobre o Electron) | contratos, ajuda, versões, integrações, atualização, privacidade, exportação, exclusão, diagnóstico e as 8 verificações das versões anteriores |
| `npm audit --omit=dev` | 0 vulnerabilidades; auditoria completa: moderadas só na cadeia de build do electron-builder |

## Evidências

- Demonstração completa (janela + MCP + laboratório) sobre o app empacotado (`release\win-unpacked`, local) e em desenvolvimento: `node scripts/demonstrar-2.3.mjs "<Prumo QA.exe>"` → capturas e `resumo.json` em `.prumo/demonstracao-2.3/` (fora do Git).
- Demonstração empacotada: app v2.3.0; MCP informa 2.3.0; 4 chamadas reais; exportação (8 eventos); exclusão do histórico com código, vínculo e evidência preservados; verificação real no GitHub: `INSTALADA_MAIS_NOVA` (última release publicada naquele momento: 2.2.0); laboratório INTEGRADO, 8/8 pelo MCP do app, `PASS = 0`.
- Em desenvolvimento (servidor local controlado, só fora do pacote): release mais nova, e destino inalcançável → mensagem exigida e app funcional.
- Atualização 2.2.0 → 2.3.0 sobre dados reais: etapa "Migração" do CI.

## Estado de assinatura, autenticação e licença

- **Assinatura digital:** o instalador **não é assinado**; o SHA-256 publicado confere o arquivo, não a autoria.
- **Autenticação humana protegida:** não exercida por mim. `executar_validacao` retorna `BLOCKED` sem ela, e isso é verificado; nada foi simulado.
- **Licença:** `UNLICENSED`/`private` preservados; dependências permissivas (`docs/LICENCAS.md`). A escolha da licença é da titular.

## Limitações e ações humanas

1. Criar o repositório `AnaPLysyk/Prumo-QA-Lab` e executar `git push -u origin main` na pasta do laboratório.
2. Rodar a avaliação semântica (`npm run semantica` no laboratório) quando o Codex tiver cota; hoje é NAO_EXECUTADA.
3. Instalar e abrir o `.exe` nesta máquina continua não validado (Smart App Control bloqueia o instalador local); a instalação foi comprovada no runner Windows do GitHub.
4. Autenticar pessoalmente uma execução protegida para comprovar a rodada autorizada.
5. Decidir licença, assinatura de código (certificado) e revisão jurídica dos textos de privacidade e termos.
6. Atualização automática, sandbox forte e execução protegida fora do Windows seguem fora do escopo.
