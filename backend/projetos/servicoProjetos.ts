/** Ciclo de projetos e validação de contratos — arquivos relacionados agrupados para manutenção. */
import fs from "node:fs";
import path from "node:path";
import { carregarProjeto } from "../compartilhado/projeto/carregarProjeto.js";
import { PropostaContrato, CODIGO, DOCUMENTACAO, EXIGE_REVISAO, SCRIPT, STACKS, Stack, TESTES, associacaoSchema, servicoDaReferencia, Espaco, dadosEspaco, evento, Situacao, instrucoesManifesto, Servico, Recurso, vinculoSchema } from "./contratos.js";
import { Manifesto, manifestoSchema, Projeto } from "../compartilhado/projeto/contratos.js";
import { sensivel } from "../compartilhado/seguranca/sensivel.js";
import { diretorioDados } from "../compartilhado/banco/diretorioDados.js";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { atualizarEspaco, gravarEspacos, lerEspacos, listarEspacos, gravarPastasVinculadas, lerPastasVinculadas, obterEspaco } from "./banco/projetos.js";
import { listarPropostas } from "../tickets/banco/tickets.js";
import { lerRepositorioLocal } from "../testes/banco/local.js";
import { semLinks } from "../compartilhado/seguranca/semLinks.js";
import { mascarar } from "../compartilhado/seguranca/mascarar.js";
import { consultarAtividades } from "../logs/banco/atividades.js";
import { calcularMetricas } from "../metricas/servico.js";

// ── servicoContrato ──
/** Grava a proposta aprovada sem sobrescrever nada e confere com o mesmo validador do núcleo; se não passar, desfaz. */
export async function gravarContratoProposto(p: PropostaContrato) {
  const alvo = path.join(p.raiz, 'qa.project.json');
  fs.writeFileSync(alvo, JSON.stringify(p.manifesto, null, 2) + '\n', { flag: 'wx' });
  try { return await carregarProjeto(p.raiz); }
  catch (e) { fs.rmSync(alvo, { force: true }); throw e; }
}

/** Lê só a raiz da pasta escolhida. Links, itens sensíveis e pastas geradas (node_modules, dist…) ficam de fora. */
function listarRaizDoProjeto(raiz: string) {
  return fs.readdirSync(raiz, { withFileTypes: true }).filter((d) => !d.isSymbolicLink() && !sensivel(d.name)).map((d) => ({ nome: d.name, pasta: d.isDirectory() }));
}

/** Gera um identificador simples (letras, números e hífen) a partir do nome da pasta. */

const idDoProjetoPeloNome = (nome: string): string => {
  const identificador = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 76);
  return /^[a-z]/.test(identificador) ? identificador : 'p-' + (identificador || 'projeto');
};

export function proporContrato(raizInformada: string): PropostaContrato {
  const raiz = fs.realpathSync(raizInformada);
  if (fs.existsSync(path.join(raiz, 'qa.project.json'))) throw new Error('CONTRACT_EXISTS: a pasta já tem qa.project.json; o Prumo não sobrescreve o contrato.');
  const itens = listarRaizDoProjeto(raiz).sort((a, b) => a.nome.localeCompare(b.nome));
  const stacks: Stack[] = STACKS.map((s) => ({ s, ev: itens.filter((i) => !i.pasta && s.arquivos.test(i.nome)).map((i) => i.nome) })).filter((x) => x.ev.length)
    .map(({ s, ev }) => ({ id: s.id, nome: s.nome, evidencias: ev.slice(0, 5), comandoNativo: s.comando, executavelPeloPrumo: s.executavel }));
  const pastaOuArquivo = (re: RegExp) => itens.filter((i) => re.test(i.nome)).map((i) => i.nome).slice(0, 50);
  const documentation = pastaOuArquivo(DOCUMENTACAO);
  const tests = itens.filter((i) => i.pasta && TESTES.test(i.nome)).map((i) => i.nome);
  // Maven/Gradle guardam testes em src/test: entra como testes quando existe de fato.
  if (fs.existsSync(path.join(raiz, 'src', 'test')) && !fs.lstatSync(path.join(raiz, 'src', 'test')).isSymbolicLink() && fs.statSync(path.join(raiz, 'src', 'test')).isDirectory()) tests.push('src/test');
  const code = [...itens.filter((i) => i.pasta && CODIGO.test(i.nome)).map((i) => i.nome), ...stacks.flatMap((s) => s.evidencias)].filter((v, i, a) => a.indexOf(v) === i).slice(0, 50);
  const observacoes: string[] = [];
  let nome = path.basename(raiz); const commands: Manifesto['commands'] = {}; const bloqueados: string[] = [];
  if (stacks.some((s) => s.id === 'node')) {
    let pkg: { name?: unknown; scripts?: Record<string, unknown> } = {};
    try { const st = fs.statSync(path.join(raiz, 'package.json')); if (st.size <= 262144) pkg = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8')); } catch { observacoes.push('package.json ilegível: nenhum comando proposto.'); }
    if (typeof pkg.name === 'string' && pkg.name.trim()) nome = pkg.name.trim().slice(0, 200);
    for (const [script, valor] of Object.entries(pkg.scripts ?? {})) {
      if (typeof valor !== 'string' || !SCRIPT.test(script) || !/^[\w:-]+$/.test(script) || Object.keys(commands).length >= 10) continue;
      const cap = idDoProjetoPeloNome(script); if (commands[cap]) continue;
      commands[cap] = { executable: 'npm', args: ['run', script], cwd: '.', env: {}, requiredFiles: [], requiredEnv: [] };
      if (EXIGE_REVISAO.test(script)) bloqueados.push(cap);
    }
    if (!Object.keys(commands).length) observacoes.push('Nenhum script de teste, build ou lint no package.json: o contrato fica somente leitura.');
    if (bloqueados.length) observacoes.push(`Bloqueados até revisão (podem tocar banco, servidor ou publicar): ${bloqueados.join(', ')}.`);
  }
  for (const s of stacks.filter((x) => !x.executavelPeloPrumo)) observacoes.push(`${s.nome}: o Prumo lê o código e os testes; executar "${s.comandoNativo}" pelo Prumo ainda não é suportado (planejado para a 2.11).`);
  if (!stacks.length) observacoes.push('Nenhuma stack conhecida na raiz: o contrato fica somente leitura, com as pastas encontradas.');
  if (!tests.length) observacoes.push('Nenhuma pasta de testes encontrada na raiz.');
  const somenteLeitura = !Object.keys(commands).length;
  const manifesto = manifestoSchema.parse({
    schemaVersion: 2, id: idDoProjetoPeloNome(nome.replace(/^@[^/]+\//, '')), name: nome,
    context: { documentation, tests: tests.slice(0, 50), code },
    commands,
    execution: { requireApproval: true, blockedByDefault: bloqueados, environment: 'host', readOnly: somenteLeitura, envAllowlist: [], timeoutMs: 300000, maxOutputBytes: 1048576 }
  });
  return { raiz, manifesto, stacks, observacoes };
}

/** Texto do diálogo de aprovação: o que será gravado, em linguagem simples. */
export function resumirContratoProposto(p: PropostaContrato) {
  const m = p.manifesto; const lista = (a: string[]) => (a.length ? a.join(', ') : 'nenhuma');
  return [
    `Pasta: ${p.raiz}`,
    `Stack detectada: ${p.stacks.length ? p.stacks.map((s) => `${s.nome} (${s.evidencias.join(', ')})`).join('; ') : 'nenhuma conhecida'}`,
    `Documentação: ${lista(m.context.documentation)}`, `Testes: ${lista(m.context.tests)}`, `Código: ${lista(m.context.code)}`,
    `Comandos: ${Object.keys(m.commands).length ? Object.entries(m.commands).map(([k, c]) => `${k} = ${typeof c === 'string' ? c : c.executable + ' ' + c.args.join(' ')}`).join('; ') : 'nenhum (somente leitura)'}`,
    ...p.observacoes,
    '',
    'Será criado só o arquivo qa.project.json na raiz da pasta. Nenhum outro arquivo é alterado e nada é executado agora: cada execução continua pedindo a sua aprovação. Você pode editar o arquivo depois.'
  ].join('\n');
}

// ── servicoProjetos ──
export const abrirProjetoVinculado = (raiz: string) => projetoVinculado(raiz, diretorioDados());

/** `registradoPeloPrumo`: vínculo criado por um fluxo do Prumo (ex.: bug aberto a partir de uma falha), nunca deduzido por nome. */
export function associarEspaco(id:string,dados:z.input<typeof associacaoSchema>,base?:string,registradoPeloPrumo=false){const d=associacaoSchema.parse(dados);return atualizarEspaco(id,e=>{
  for(const ref of[d.de,d.para]){const s=servicoDaReferencia[ref.tipo];if(s&&(!ref.vinculoId||!e.vinculos.some(v=>v.id===ref.vinculoId&&v.servico===s)))throw new Error('TRACE_LINK_SCOPE');
    if(ref.tipo==='caso-local'||ref.tipo==='ticket-local'){
      const casoNovo = ref.tipo === 'caso-local' && lerRepositorioLocal(base).casos.some(c => c.id === ref.id && c.espacoId === id);
      const propostaLegada = listarPropostas(id,base).some(p=>p.id===ref.id&&p.tipo===(ref.tipo==='caso-local'?'caso':'bug')&&p.origem==='PESSOA'&&p.estado!=='DESCARTADA'&&!p.remoto);
      if(ref.vinculoId||ref.origem!=='prumo'||!(casoNovo||propostaLegada))throw new Error('TRACE_LOCAL_REFERENCE_INVALID');
    }
  }
  if(e.relacoes.some(r=>JSON.stringify(r.de)===JSON.stringify(d.de)&&JSON.stringify(r.para)===JSON.stringify(d.para)))throw new Error('TRACE_DUPLICATE');
  e.relacoes.push({...d,id:randomUUID(),at:new Date().toISOString(),estado:'VINCULADO',origemRegistro:registradoPeloPrumo?'REGISTRADO_PELO_PRUMO':'DECLARADO_PELO_USUARIO'});e.relacoes=e.relacoes.slice(-500);eventoEspaco(e,'ASSOCIADO');},base);}

export async function criarEspaco(dados:z.input<typeof dadosEspaco>,base?:string){
  const d=dadosEspaco.parse(dados);const r=lerEspacos(base);if(r.espacos.length>=200)throw new Error('WORKSPACE_LIMIT');
  const id=randomUUID();let raiz=path.join(diretorioDados(base),'espacos',id);semLinks(raiz);
  fs.mkdirSync(raiz,{recursive:true,mode:0o700});raiz=fs.realpathSync(raiz);
  fs.writeFileSync(path.join(raiz,'qa.project.json'),JSON.stringify({schemaVersion:2,id:'prumo-'+id,name:d.nome,context:{documentation:[],tests:[],code:[]},commands:{},execution:{requireApproval:true,readOnly:true,blockedByDefault:[],environment:'host'}}),{flag:'wx',mode:0o600});
  await adicionarVinculo(raiz,base);
  const atual=lerEspacos(base);if(atual.espacos.length>=200)throw new Error('WORKSPACE_LIMIT');
  const e:Espaco={id,...d,criadoEm:new Date().toISOString(),raizContextos:raiz,vinculos:[],relacoes:[],historico:[]};eventoEspaco(e,'CRIADO');atual.espacos.push(e);gravarEspacos(atual,base);return e;
}

export function editarEspaco(id:string,dados:z.input<typeof dadosEspaco>,base?:string){const d=dadosEspaco.parse(dados);return atualizarEspaco(id,e=>{e.nome=d.nome;e.descricao=d.descricao;eventoEspaco(e,'EDITADO');},base);}

export function configurarAceite(id:string,campo:string,base?:string){return atualizarEspaco(id,e=>{const v=e.vinculos.find(v=>v.servico==='jira');if(!v)throw new Error('WORKSPACE_LINK_NOT_FOUND');v.campoAceite=z.string().regex(/^customfield_\d+$/).parse(campo);eventoEspaco(e,'EDITADO',{servico:'jira',vinculoId:v.id});},base);}

/** Projeto Prumo (espaço) a que uma raiz autorizada pertence: a pasta de contextos do projeto ou a pasta de automação vinculada. */
export function espacoDaRaiz(raiz: string, b?: string) {
  const alvo = path.resolve(raiz).toLowerCase(); return listarEspacos(b).find(e => path.resolve(e.raizContextos).toLowerCase() === alvo || (e.pastaLocal && path.resolve(e.pastaLocal).toLowerCase() === alvo)) ?? null;
}

export function eventoEspaco(e:Espaco,acao:z.infer<typeof evento>['acao'],extra:Partial<z.infer<typeof evento>>={}){e.historico.push(evento.parse({at:new Date().toISOString(),acao,...extra}));e.historico=e.historico.slice(-1000);}

/** Diagnostica uma pasta sem escrever nada nela. */
export async function situacaoProjeto(raiz: string): Promise<Situacao> {
  if (typeof raiz !== 'string' || !path.isAbsolute(raiz)) return { root: String(raiz).slice(0, 300), state: 'PASTA_AUSENTE', message: 'Informe um caminho absoluto.' };
  let real: string;
  try { real = await fs.promises.realpath(raiz); if (!(await fs.promises.stat(real)).isDirectory()) throw new Error(); }
  catch { return { root: raiz, state: 'PASTA_AUSENTE', message: 'A pasta não existe ou não é acessível.' }; }
  try { await fs.promises.access(path.join(real, 'qa.project.json')); }
  catch { return { root: real, state: 'SEM_MANIFESTO', message: 'Pasta sem qa.project.json: projeto ainda não integrado.', instructions: instrucoesManifesto }; }
  try {
    const p = await carregarProjeto(real);
    return { root: p.raiz, state: 'INTEGRADO', id: p.manifesto.id, name: p.manifesto.name, capabilities: Object.keys(p.manifesto.commands), readOnly: p.manifesto.execution.readOnly, message: 'Contrato v2 válido.' };
  } catch (e) { return { root: real, state: 'MANIFESTO_INVALIDO', message: mascarar((e as Error).message), instructions: instrucoesManifesto }; }
}

export async function visaoGeralDoProjeto(raiz: string) {
  const p = await projetoVinculado(raiz, diretorioDados());
  const h = consultarAtividades(p, diretorioDados()); const m = calcularMetricas(h);
  const ultimaMcp = h.activities.filter(e => e.origin === 'MCP').at(-1);
  return { project: { id: p.manifesto.id, name: p.manifesto.name, root: p.raiz, capabilities: Object.keys(p.manifesto.commands), readOnly: p.manifesto.execution.readOnly },
    metrics: m, directory: h.directory, lastMcpClient: ultimaMcp?.client ?? null,
    connection: 'Última chamada observada; o Prumo não comprova sessão ativa nem a identidade real do cliente.' };
}

/** Só vincula projeto com contrato válido; caso contrário devolve o diagnóstico e não grava nada. */
export async function adicionarVinculo(raiz: string, base?: string) {
  const s = await situacaoProjeto(raiz);
  if (s.state !== 'INTEGRADO') return { linked: false as const, situation: s };
  const atuais = lerPastasVinculadas(base);
  if (!atuais.some(v => caminhoComparavel(v.root) === caminhoComparavel(s.root))) gravarPastasVinculadas([...atuais, { root: s.root, addedAt: new Date().toISOString() }], base);
  return { linked: true as const, situation: s };
}

/** Forma canônica para comparar: resolve links, 8.3 (RUNNER~1) e caixa, como o núcleo faz ao carregar o projeto. */
export const caminhoComparavel = (raiz: string) => { try { return fs.realpathSync.native(raiz).toLowerCase(); } catch { return String(raiz).toLowerCase(); } };

export const listarPastasVinculadas = () => listarVinculos(diretorioDados());

export async function listarVinculos(base?: string) {
  return Promise.all(lerPastasVinculadas(base).map(async v => ({ ...(await situacaoProjeto(v.root)), addedAt: v.addedAt })));
}

/** Remove apenas o vínculo; histórico, evidências e arquivos do projeto permanecem. */
function removerVinculo(raiz: string, base?: string) {
  const atuais = lerPastasVinculadas(base); const alvo = caminhoComparavel(raiz); const restantes = atuais.filter(v => caminhoComparavel(v.root) !== alvo);
  if (restantes.length !== atuais.length) gravarPastasVinculadas(restantes, base);
  return { removed: restantes.length !== atuais.length };
}

export const desvincularPasta = (raiz: string) => removerVinculo(raiz, diretorioDados());

export function registrarConsultaExterna(id:string,servico:Servico,codigo:string,base?:string){return atualizarEspaco(id,e=>eventoEspaco(e,'CONSULTA',{servico,codigo}),base);}

export function registrarEscritaExterna(id:string,servico:Servico,codigo:string,base?:string){return atualizarEspaco(id,e=>eventoEspaco(e,'ESCRITA',{servico,codigo}),base);}

export function removerVinculoServico(id:string,servico:Servico,base?:string){return atualizarEspaco(id,e=>{const v=e.vinculos.find(v=>v.servico===servico);if(!v)throw new Error('WORKSPACE_LINK_NOT_FOUND');e.vinculos=e.vinculos.filter(v=>v.servico!==servico);eventoEspaco(e,'REMOVIDO',{servico,vinculoId:v.id});},base);}

export function atualizarEstadoDoVinculo(id:string,servico:Servico,estado:z.infer<typeof vinculoSchema>['estado'],codigo?:string,recurso?:Recurso,base?:string){return atualizarEspaco(id,e=>{const v=e.vinculos.find(v=>v.servico===servico);if(!v)throw new Error('WORKSPACE_LINK_NOT_FOUND');v.estado=estado;if(estado==='VALIDO')v.validadoEm=new Date().toISOString();if(recurso)v.recurso=recurso;eventoEspaco(e,'VALIDACAO',{servico,vinculoId:v.id,...(codigo?{codigo}:{})});},base);}

/** Exige que a raiz tenha sido vinculada: a interface nunca abre pastas arbitrárias. */
export async function projetoVinculado(raiz: string, base?: string): Promise<Projeto> {
  if (typeof raiz !== 'string' || !lerPastasVinculadas(base).some(v => caminhoComparavel(v.root) === caminhoComparavel(raiz))) throw new Error('PROJECT_NOT_LINKED: selecione um projeto vinculado.');
  return carregarProjeto(raiz);
}

export async function vincularPastaAoEspaco(id:string,raiz:string,base?:string){
  obterEspaco(id,base);const s=await situacaoProjeto(raiz);if(s.state!=='INTEGRADO')throw new Error('WORKSPACE_LOCAL_CONTRACT_INVALID');
  const outra=listarEspacos(base).find(e=>e.id!==id&&e.pastaLocal?.toLowerCase()===s.root.toLowerCase());if(outra)throw new Error('WORKSPACE_LOCAL_DUPLICATE');
  await adicionarVinculo(s.root,base);return atualizarEspaco(id,e=>{e.pastaLocal=s.root;eventoEspaco(e,'PASTA');},base);
}

type Confirmar = (titulo: string, mensagem: string, detalhe: string, botao: string) => Promise<boolean>;

export async function vincularPastaDoDisco(id: string, pasta: string, confirmar: Confirmar) {
  const s = await situacaoProjeto(pasta);
  if (s.state === 'PASTA_AUSENTE') throw new Error('WORKSPACE_LOCAL_FOLDER_MISSING: a pasta escolhida não existe ou não pode ser lida.');
  if (s.state === 'MANIFESTO_INVALIDO') throw new Error(`WORKSPACE_LOCAL_CONTRACT_INVALID: o qa.project.json desta pasta não é válido (${s.message}). Corrija o arquivo, ou apague-o para o Prumo propor um contrato novo, e vincule de novo.`);
  if (s.state === 'SEM_MANIFESTO') {
    const p = proporContrato(s.root);
    if (!await confirmar('Criar contrato do projeto', 'Esta pasta ainda não tem qa.project.json. Criar o contrato proposto e vincular?', resumirContratoProposto(p), 'Criar contrato e vincular')) return { canceled: true as const };
    await gravarContratoProposto(p);
  }
  return vincularPastaAoEspaco(id, s.root);
}

/** Seleção da lista não é confiança: o adaptador revalida o recurso antes de chamar esta função. */
export function vincularServicoAoEspaco(id:string,servico:Servico,conexaoId:string,recurso:Recurso,base?:string){
  return atualizarEspaco(id,e=>{const antigo=e.vinculos.find(v=>v.servico===servico);if(antigo)throw new Error('WORKSPACE_LINK_EXISTS');
    const v=vinculoSchema.parse({id:randomUUID(),servico,conexaoId,recurso,validadoEm:new Date().toISOString(),estado:'VALIDO'});e.vinculos.push(v);eventoEspaco(e,'VINCULADO',{servico,vinculoId:v.id});},base);
}
