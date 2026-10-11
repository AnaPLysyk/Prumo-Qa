---
name: investigacao-bugs
description: Investigar falhas com evidências reais do Prumo QA e propor um bug em rascunho com passos, resultado esperado e observado. Usar após FAIL ou BLOCKED, sem presumir a causa nem criar ticket.
---

# Investigação de bugs

Use `consultar_evidencias` e leia o resultado real: estado (PASS, FAIL, BLOCKED, NOT_RUN), cenários individuais, saída mascarada e escopo (rodada ou cenário). BLOCKED não é defeito do produto: é impedimento (aprovação, ambiente, ferramenta). Falha de ambiente e falha de produto são coisas diferentes; diga qual evidência sustenta cada hipótese.

Reproduza a pergunta, não a conclusão: o que era esperado, o que foi observado, em qual ambiente e com quais dados. Não invente diagnóstico nem causa raiz sem evidência; marque suspeitas como suspeitas.

Se houver um defeito confirmado, use `propor_bug` com resumo objetivo, descrição reproduzível, ticket de origem (se conhecido) e referência à evidência local. Isso cria apenas um rascunho. Abrir o bug no Jira, anexar evidências e relacionar tickets são ações da pessoa na janela do Prumo, com prévia e confirmação.

Entregue: passos de reprodução, esperado, observado, evidência, hipóteses separadas de fatos e o que ficou sem verificar.
