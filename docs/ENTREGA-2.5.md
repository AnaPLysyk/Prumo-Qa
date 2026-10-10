# Entrega 2.3.1 · 2.4.0 · 2.5.0

Releases: [v2.3.1](https://github.com/AnaPLysyk/Prumo-Qa/releases/tag/v2.3.1) · [v2.4.0](https://github.com/AnaPLysyk/Prumo-Qa/releases/tag/v2.4.0) · [v2.5.0](https://github.com/AnaPLysyk/Prumo-Qa/releases/tag/v2.5.0)

## Verificado de fato
- CI verde nos três marcos; tags v2.3.1, v2.4.0 e v2.5.0 próprias, sem force push.
- SHA-256 do instalador conferido com `scripts/verificar-download.ps1`: 2.4.0 = 7da25ff6…eef; 2.5.0 = 2fe5f6b5…505. Ambos **NotSigned**.
- Testes locais da 2.5: 188 passam, 3 ignorados, 1 falha (broker `aprovar.exe`, bloqueado pelo Smart App Control; não contornado).
- Demonstração de 20 passos (`scripts/demonstrar-2.5.mjs`, modo desenvolvimento, dados sintéticos): 20/20. Nenhuma issue enviada, navegador não aberto; confirmações nativas respondidas pela automação (declarado); execução pelo Prumo permaneceu BLOCKED.
- Laboratório: 14 casos determinísticos (2.4.0: 14/14); semântica com Codex 8/8 (critério v2); comparação A/B 1 repetição: sem Prumo 89%, com Prumo 94,5% (amostra pequena, sem prova de superioridade). Errata da rubrica do caso 8 registrada.

## Não validado / depende de pessoa
- Instalador **sem assinatura digital** (precisa de certificado, decisão da titular). Instalação local não validável (Smart App Control); só o CI instala e testa.
- Autenticação humana ponta a ponta: roteiro em `docs/INSTALACAO-MANUAL.md`, teste manual.
- Executável empacotado não usado na demonstração; sino e som só provados em desenvolvimento.
- Repositório `AnaPLysyk/Prumo-QA-Lab` não existe (404); o laboratório está só em git local.
- Causa de 16 falhas de janela numa rodada (não repetidas) permanece indeterminada.
