# Licenças e distribuição

Levantamento feito em 2026-10-10 sobre o estado real do repositório. **Não substitui revisão jurídica.**

## O Prumo QA

`package.json` declara `"private": true` e `"license": "UNLICENSED"`: nenhum terceiro tem permissão de uso, cópia ou redistribuição além do que a titular conceder. O instalador publicado em GitHub Releases é distribuído sob essa condição. **Decisão pendente da titular:** escolher e adicionar uma licença (aberta ou proprietária), o texto dos termos de uso e a limitação de responsabilidade. Nenhuma licença foi escolhida por conta própria.

## Dependências incluídas no instalador

Dependências de produção (diretas e transitivas, lidas de `node_modules`): **108 pacotes**, todos com licença permissiva — MIT (97), ISC (8), BSD-3-Clause (2) e BSD-2-Clause (1). Nenhum pacote sem licença declarada. Principais: `@modelcontextprotocol/sdk`, `pino`, `zod`.

O instalador também contém o **Electron 44.7.0** (MIT) com o Chromium e suas bibliotecas. Os avisos de licença exigidos acompanham o pacote: `LICENSE.electron.txt` e `LICENSES.chromium.html` na pasta de instalação.

Ferramentas de build (electron-builder, playwright-core, typescript) são dependências de desenvolvimento e **não** vão no instalador.

## Código de terceiros

Dois arquivos de terceiros são distribuídos como estão, com a licença junto: **Three.js 0.159.0** (MIT, `frontend/compartilhado/vendor/THREE-LICENSE.txt`) e **Monaco Editor 0.57.0** (MIT, `frontend/editor-de-codigo/vendor/LICENSE.txt` e `ThirdPartyNotices.txt`), o editor da IDE de Testes (o mesmo editor do VS Code). Foram obtidos do pacote oficial `monaco-editor` no npm, sem alteração (só sem as traduções e as cópias duplicadas dos trabalhadores de linguagem) e sem acesso à rede em tempo de execução. O terminal da IDE usa **xterm.js 6.0.0** e **@xterm/addon-fit 0.11.0** (MIT, `frontend/editor-de-codigo/vendor/xterm/LICENSE-*.txt`), do mesmo modo, sem alteração (só sem o comentário que aponta para o mapa de código).

As fontes **Inter** (`assets/fontes/INTER-LICENSE.txt`) e **JetBrains Mono** (`assets/fontes/JETBRAINS-MONO-LICENSE.txt`) são distribuídas sob a SIL Open Font License 1.1, no subconjunto latino, obtidas dos pacotes `@fontsource-variable/inter` e `@fontsource-variable/jetbrains-mono` sem alteração. A janela só carrega fontes do próprio aplicativo (`font-src 'self'`).

Nenhum código de projetos terceiros foi copiado para o repositório. As referências conceituais ao QA Orchestrator anterior estão em `docs/ORIGEM.md`.

A transcrição de voz usa **@huggingface/transformers 4.3.1** (Apache-2.0) com **onnxruntime-node** (MIT) e o modelo **Whisper base** da OpenAI, em formato ONNX (`onnx-community/whisper-base`, MIT). O modelo não vai no instalador: é baixado uma vez, com confirmação da pessoa, para a pasta de dados.

## Assinatura de código

O instalador **não é assinado**. Uma assinatura com certificado de assinatura de código confiável reduziria os alertas do SmartScreen e os bloqueios do Smart App Control, mas exige um certificado (custo e validação de identidade) e a decisão da titular. Até lá, o SHA-256 publicado junto de cada release permite conferir que o arquivo baixado é o publicado; ele **não** prova a identidade de quem o publicou nem substitui a assinatura.
