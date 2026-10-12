# Configurações — localização das ações

`definirPreferencias.ts` contém os formatos válidos para tema, idioma, avisos e IA.

`armazenarPreferencias.ts` lê e grava o arquivo local de preferências com segurança.

`alterarPreferencias.ts` altera somente os campos autorizados da interface.

`textosDesktop.ts` fornece textos da bandeja e da janela.

**Entrada existente:** `src/preferencias.ts` mantém os nomes antigos enquanto o módulo migra. As opções de avisos estão em `src/modulos/ajuda/`, e a autorização para delegar à IA está em `src/modulos/agentes/`.
