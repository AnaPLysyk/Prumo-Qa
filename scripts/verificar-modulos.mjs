/** Confere que as telas e funções migradas existem, são carregadas e possuem descrição inicial. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const falhas = [];
const ler = (p) => fs.readFileSync(path.join(raiz, p), 'utf8');
const existe = (p) => fs.existsSync(path.join(raiz, p));
const relatorios = [];
const legadas = [
 ['src/rastreabilidade.ts','src/modulos/rastreabilidade/mapaDeVinculos.ts'],
 ['src/rotasEscrita.ts','src/modulos/conexoes/rotaEscritaPermitida.ts'],
 ['src/playwright.ts','src/modulos/testes/converterRelatorioPlaywright.ts'],
 ['src/adf.ts','src/modulos/tickets/textoParaAdf.ts'],
 ['src/multipart.ts','src/modulos/conexoes/montarMultipart.ts'],
 ['src/qualidade.ts','src/modulos/testes/revisarCobertura.ts'],
 ['src/diagnostico.ts','src/modulos/logs/diagnosticoIpc.ts'],
 ['src/textosDesktop.ts','src/modulos/configuracoes/textosDesktop.ts']
];
for (const [antigo, novo] of legadas) {
 if (!existe(antigo) || !existe(novo)) { falhas.push('Ausência de ponte ou implementação: '+antigo); continue; }
 if (!ler(antigo).includes("export * from './"+novo.slice(4).replace(/\.ts$/,'.js')+"'")) falhas.push('Ponte incorreta: '+antigo);
}
const caminhosProjetos = [
 'definicoesEspaco.ts','armazenarEspacos.ts','criarProjeto.ts','editarProjeto.ts','vincularPastaDoProjeto.ts','vincularServicoAoProjeto.ts',
 'removerServicoDoProjeto.ts','validarEstadoDoVinculo.ts','configurarCampoAceite.ts','registrarEscritaExterna.ts','registrarConsultaExterna.ts','associarReferencias.ts'
].map(n=>'src/modulos/projetos/espacos/'+n);
const contratosProjeto=[
 'src/modulos/projetos/contrato/proporContrato.ts',
 'src/modulos/projetos/contrato/resumirContrato.ts',
 'src/modulos/projetos/contrato/gravarContratoAprovado.ts'
];
for (const p of [...caminhosProjetos,...contratosProjeto]) {
 if (!existe(p)) {falhas.push('Falta arquivo: '+p);continue;}
 if (!ler(p).startsWith('/** ')) falhas.push('Falta primeira frase: '+p);
}
const frontDir='app/renderer/';
const html=ler(frontDir+'index.html');
const scripts=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m=>m[1]);
if (new Set(scripts).size!==scripts.length) falhas.push('Script carregado em duplicidade no index.html');
for (const f of scripts) if (!existe(frontDir+f)) falhas.push('Script da interface ausente: '+f);
const localScripts=scripts.filter(p=>p.startsWith('telas/'));
for (const f of localScripts) {
 const p=frontDir+f;
 if (!existe(p)) continue;
 const conteudo=ler(p);
 if (!conteudo.startsWith("'use strict';\n/** ")) falhas.push('Falta primeira frase: '+p);
 try { new vm.Script(conteudo,{filename:p}); } catch(e) { falhas.push('Sintaxe JS: '+p+' '+e.message); }
}
for (const nome of ['plataforma.js','apoio-v40.js']) if (scripts.includes(nome)) falhas.push('Tela legada carregada novamente: '+nome);
const idx=(p)=>scripts.indexOf(p);
const anteriores=[
 ['telas/compartilhado/criarBotaoAcao.js','telas/projetos/mostrarProjetos.js'],
 ['telas/projetos/modais/criarEditarProjeto/abrirFormularioProjeto.js','telas/projetos/mostrarProjetos.js'],
 ['telas/compartilhado/consultarServicoRemoto.js','telas/tickets/mostrarTickets.js'],
 ['telas/compartilhado/consultarServicoRemoto.js','telas/testes/mostrarTestesRemotos.js'],
 ['telas/agentes/usarTelaAgentes.js','telas/conexoes/mostrarConexoes.js'],
 ['telas/ajuda/mostrarAjuda.js','telas/agentes/abrirModalContextos.js']
];
for (const [primeiro,segundo] of anteriores) if (idx(primeiro)<0 || idx(segundo)<0 || idx(primeiro)>=idx(segundo)) falhas.push('Ordem de carregamento: '+primeiro+' deve vir antes de '+segundo);
for (const p of [...caminhosProjetos,...contratosProjeto,'src/espacos.ts','src/contratoDetectado.ts']) {
 if (!existe(p)) continue;
 for (const [,imp] of ler(p).matchAll(/\bfrom\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
  const raw=path.resolve(path.dirname(path.join(raiz,p)),imp);
  const target=raw.replace(/\.js$/,'.ts');
  if (!fs.existsSync(target)&&!fs.existsSync(raw)) falhas.push('Import relativo ausente: '+p+' -> '+imp);
 }
}
if (falhas.length) {
 for (const erro of falhas) console.error('ERRO: '+erro);
 process.exitCode=1;
} else {
 console.log('OK: '+localScripts.length+' scripts de telas, '+caminhosProjetos.length+' arquivos de gestão de projetos, '+contratosProjeto.length+' arquivos de contratos.');
 console.log('Verificação estrutural apenas; execute npm run check e testes do Electron/MCP.');
}
