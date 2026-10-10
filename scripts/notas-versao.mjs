// Gera as notas de release de uma versão a partir da fonte única app/versoes.json.
// Uso: node scripts/notas-versao.mjs 2.3.0 > notas.md   (falha se a versão não existir no histórico)
import { carregarVersoes, notasDaVersao } from '../dist/versoes.js';

const alvo = process.argv[2];
const versao = carregarVersoes(new URL('../app/versoes.json', import.meta.url)).find((v) => v.version === alvo);
if (!versao) { console.error(`Versão ${alvo ?? '(não informada)'} não consta em app/versoes.json.`); process.exit(1); }

const cabecalho = `**Instalador NÃO ASSINADO.** Esta versão não tem assinatura digital. O Windows pode mostrar o alerta do SmartScreen e, com Smart App Control ou Controle de Aplicativo ativos, pode bloquear o instalador ou o \`aprovar.exe\`. O Prumo não contorna essas proteções.

**Integridade:** o SHA-256 do instalador está no arquivo \`Prumo-QA-Setup-${alvo}.exe.sha256\` desta release. O checksum confirma que o arquivo baixado é o publicado; ele **não** substitui uma assinatura digital nem prova quem o publicou. Baixe somente desta página.

**Instalar:** execute o instalador (por usuário, sem administrador, pasta alterável). Não é necessário Node.js. Seus dados em \`%LOCALAPPDATA%\\PrumoQA\` são preservados ao atualizar e ao desinstalar.
`;
process.stdout.write(`${cabecalho}\n${notasDaVersao(versao)}`);
