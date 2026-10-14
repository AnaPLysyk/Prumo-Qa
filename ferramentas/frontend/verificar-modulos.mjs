/** Confere que as telas do frontend existem, são carregadas na ordem certa e têm descrição inicial (o backend é conferido por testes/unitario/backend/compartilhado/estrutura-backend.test.mjs). */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const falhas = [];
// A fonte do frontend é frontend/<tela>; dist/renderer/telas é somente cópia de execução.
try { execFileSync(process.execPath, ['ferramentas/frontend/sincronizar-frontend.mjs', '--check'], { cwd: raiz, stdio: 'pipe' }); }
catch (e) { falhas.push('Frontend e cópia Electron divergentes: ' + String(e.stderr || e.message).slice(0,450)); }
// Garantir que os bundles distribuídos continuam idênticos às partes das telas.
import { execFileSync } from 'node:child_process';
try { execFileSync(process.execPath, ['ferramentas/frontend/gerar-telas-modulares.mjs','--check'], {cwd:raiz,stdio:'pipe'}); }
catch (e) { falhas.push('Bundle de telas diferente das fontes: ' + String(e.stderr || e.message).slice(0,450)); }
const ler = (p) => fs.readFileSync(path.join(raiz, p), 'utf8');
const existe = (p) => fs.existsSync(path.join(raiz, p));
const frontDir='dist/renderer/';
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
for (const nome of ['plataforma.js','apoio-v40.js','agenda.js','integracoes.js']) if (scripts.includes(nome)) falhas.push('Tela legada carregada novamente: '+nome);
const idx=(p)=>scripts.indexOf(p);
const carregamentoPorTela=[
 ['telas/agendamentos/formularios/montarFormularioRotina.js','telas/agendamentos/mostrarAgendamentos.js'],
 ['telas/compartilhado/mostrarEstadoWorker.js','telas/inicio/mostrarInicio.js'],
 ['fluxos-v40.js','testes-v40.js'],
 ['telas/metricas/componentes/montarVisuaisMetricas.js','telas/metricas/mostrarMetricas.js']
];
for (const [a,b] of carregamentoPorTela) {
 if (scripts.indexOf(a)<0 || scripts.indexOf(b)<0 || scripts.indexOf(a)>=scripts.indexOf(b)) falhas.push('Ordem de tela inválida: '+a+' / '+b);
}
const anteriores=[
 ['telas/compartilhado/criarBotaoAcao.js','telas/projetos/mostrarProjetos.js'],
 ['telas/projetos/modais/criarEditarProjeto/abrirFormularioProjeto.js','telas/projetos/mostrarProjetos.js'],
 ['telas/agentes/usarTelaAgentes.js','telas/conexoes/mostrarConexoes.js'],
 ['telas/ajuda/mostrarAjuda.js','telas/agentes/modais/contextos/abrirContextos.js']
];
for (const [primeiro,segundo] of anteriores) if (idx(primeiro)<0 || idx(segundo)<0 || idx(primeiro)>=idx(segundo)) falhas.push('Ordem de carregamento: '+primeiro+' deve vir antes de '+segundo);
if (falhas.length) {
 for (const erro of falhas) console.error('ERRO: '+erro);
 process.exitCode=1;
} else {
 console.log('OK: '+localScripts.length+' scripts de telas do frontend. O backend é conferido por testes/unitario/backend/compartilhado/estrutura-backend.test.mjs.');
 console.log('Verificação estrutural apenas; execute npm run check e testes do Electron/MCP.');
}
