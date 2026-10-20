// Gera as notas de release de uma versão a partir da fonte única docs/catalogo/versoes.json.
// Uso: node site/release/notas-versao.mjs 2.3.1 > notas.md   (falha se a versão não existir no histórico)
// PRUMO_ASSINADO=true só deve ser definido pelo CI DEPOIS de confirmar Authenticode "Valid"; sem isso, as notas dizem NÃO ASSINADO.
import { carregarVersoes } from '../../dist/ajuda/servicoVersoes.js';
import { notasDaVersao } from '../../dist/ajuda/servicoVersoes.js';

const alvo = process.argv[2];
const versao = carregarVersoes(new URL('../../docs/catalogo/versoes.json', import.meta.url)).find((v) => v.version === alvo);
if (!versao) { console.error(`Versão ${alvo ?? '(não informada)'} não consta em docs/catalogo/versoes.json.`); process.exit(1); }
const assinado = process.env.PRUMO_ASSINADO === 'true';

const paragrafoAssinatura = assinado
  ? `**Assinatura:** o instalador está assinado digitalmente (Authenticode, verificado pelo pipeline). O SmartScreen ainda pode alertar enquanto a reputação do editor se forma; confira também o SHA-256.`
  : `**Instalador NÃO ASSINADO.** Esta versão não tem assinatura digital. O Windows pode mostrar o alerta do SmartScreen e, com Smart App Control ou Controle de Aplicativo ativos, pode bloquear o instalador ou o \`aprovar.exe\`. O Prumo não contorna essas proteções. Veja docs/ASSINATURA.md.`;
const cabecalho = `${paragrafoAssinatura}

**Integridade:** o SHA-256 do instalador está no arquivo \`Prumo-QA-Setup-${alvo}.exe.sha256\` desta release. O checksum confirma que o arquivo baixado é o publicado; ele **não** substitui uma assinatura digital nem prova quem o publicou. Baixe somente desta página; \`site/release/verificar-download.ps1\` confere o hash sem executar nada.

**Instalar:** execute o instalador (por usuário, sem administrador, pasta alterável). Não é necessário Node.js. Seus dados em \`%LOCALAPPDATA%\\PrumoQA\` são preservados ao atualizar e ao desinstalar.
`;
process.stdout.write(`${cabecalho}\n${notasDaVersao(versao)}`);
