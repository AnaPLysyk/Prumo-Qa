# O que o Prumo faz sem IA e o que depende dela

## Sem IA conectada

O núcleo é determinístico e funciona sem nenhuma conta de IA:

- criar projetos Prumo sem pasta local e manter contextos manuais;
- agendar e executar rotinas de QA (consulta Jira, smoke, regressão, validação por ticket, análise de mudanças e k6), manter o worker na bandeja do Windows, guardar evidências e comentar o resultado no Jira com a sua aprovação;
- consultar recursos Jira/Qase/GitHub selecionados com suas próprias credenciais de leitura;
- registrar associações declaradas com origem e justificativa, sem contar cobertura automaticamente;

- validar o contrato do projeto e ler o contexto autorizado;
- conferir a estrutura de um plano de testes (falta de oráculo, de rastreabilidade, duplicidade de identificador, redundância estrutural candidata);
- executar capacidades declaradas depois de autenticação humana;
- guardar histórico, métricas, logs e evidências, e mostrá-los nesta janela.

## Análise profissional e IA opcional

A pessoa pode realizar as análises abaixo manualmente. Uma IA externa pode auxiliar; o núcleo não substitui esse julgamento:

- interpretar requisitos e decidir o que é risco de verdade;
- julgar se dois cenários são semanticamente equivalentes;
- escolher a quantidade justificada de cenários e técnicas;
- raciocinar sobre o que o código deveria fazer.

O Prumo não tem modelo próprio nem exige chave de LLM. Ele aponta fatos e lacunas; a decisão semântica é da equipe, com assistência opcional da IA hospedeira.
