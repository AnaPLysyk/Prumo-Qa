/** Ações humanas de criação local e publicação do código da IDE. */
import { dialog } from 'electron';
import path from 'node:path';
import { TratadorDoCanal } from '../aplicativo/api/TratadorDoCanal.js';
import { confirmarNoWindows } from '../aplicativo/janela/controleDaJanela.js';
import { obterEspaco } from './banco/projetos.js';
import { criarProjetoLocal } from './criarProjetoLocal.js';
import { vincularPastaDoDisco } from './servicoProjetos.js';
import { snapshotDoCodigo, estadoDaPublicacao, publicarSnapshot } from './publicacaoDoCodigo.js';
import { escritaHabilitada } from '../conexoes/escrita/permissoes.js';
import { servicosDoAplicativo } from '../conexoes/regras/nucleoServicos.js';
import { comandoValido, iniciarComando, lerSaida, pararComando } from './ideTerminal.js';

const ocupados = new Set<string>();
async function exclusivo<T>(id: string, fn: () => Promise<T>) {
  if (ocupados.has(id)) throw new Error('CODE_BUSY: já existe uma operação de código neste projeto.');
  ocupados.add(id); try { return await fn(); } finally { ocupados.delete(id); }
}

export const ideCriarprojeto: TratadorDoCanal<'ide:criarprojeto'> = (a, j) => exclusivo(a.espacoId, async () => {
  const e = obterEspaco(a.espacoId);
  if (e.pastaLocal) throw new Error('PROJECT_ALREADY_HAS_FOLDER');
  const escolha = await dialog.showOpenDialog(j!, { title: 'Onde criar a pasta do novo projeto?', properties: ['openDirectory'] });
  if (escolha.canceled || !escolha.filePaths[0]) return { canceled: true };
  const destino = path.join(escolha.filePaths[0], a.nome);
  if (!await confirmarNoWindows(j, 'Criar projeto local', 'Começar o código de ' + e.nome + ' do zero?', 'Pasta nova: ' + destino + '\nCria README, .gitignore e a pasta testes. Você escolhe a linguagem e escreve os testes na IDE. Nenhum programa será instalado ou executado.', 'Criar projeto')) return { canceled: true };
  const pasta = criarProjetoLocal(escolha.filePaths[0], a.nome, e.nome);
  const vinculo = await vincularPastaDoDisco(e.id, pasta, (t, m, d, b) => confirmarNoWindows(j, t, m, d, b));
  return 'canceled' in vinculo ? { canceled: true, pastaCriada: pasta } : vinculo;
});

export const ideRepositorio: TratadorDoCanal<'ide:repositorio'> = (a, j) => exclusivo(a.espacoId, async () => {
  const e = obterEspaco(a.espacoId);
  if (!escritaHabilitada(e.id, 'github')) throw new Error('WRITE_NOT_ENABLED: habilite os envios ao GitHub neste projeto.');
  if (!await confirmarNoWindows(j, 'Criar repositório no GitHub', 'Criar ' + a.nome + ' para ' + e.nome + '?', 'Conta conectada: ' + a.conexaoId + '\nVisibilidade: ' + (a.privado ? 'privado' : 'público') + '\nCria um repositório com README e vincula a este projeto. O código local só será enviado na ação Enviar alterações.', 'Criar repositório')) return { canceled: true };
  return { canceled: false, projeto: await servicosDoAplicativo.criarRepositorio(e.id, a.conexaoId, a.nome, a.privado) };
});

export const idePublicacao: TratadorDoCanal<'ide:publicacao'> = async a => {
  const e = obterEspaco(a.espacoId); if (!e.pastaLocal) throw new Error('IDE_SEM_REPOSITORIO');
  const snapshot = await snapshotDoCodigo(e.pastaLocal);
  const gh = e.vinculos.find(v => v.servico === 'github');
  return { ...estadoDaPublicacao(e.id, gh?.recurso.id || 'local', e.pastaLocal, snapshot), repositorio: gh?.recurso.chave || null, pasta: e.pastaLocal };
};

export const idePublicar: TratadorDoCanal<'ide:publicar'> = (a, j) => exclusivo(a.espacoId, async () => {
  const e = obterEspaco(a.espacoId); if (!e.pastaLocal) throw new Error('IDE_SEM_REPOSITORIO');
  const gh = e.vinculos.find(v => v.servico === 'github'); if (!gh) throw new Error('GITHUB_NOT_LINKED');
  if (!escritaHabilitada(e.id, 'github')) throw new Error('WRITE_NOT_ENABLED');
  const snapshot = await snapshotDoCodigo(e.pastaLocal);
  const estado = estadoDaPublicacao(e.id, gh.recurso.id, e.pastaLocal, snapshot);
  if (!snapshot.arquivos.length && !estado.removidos.length) throw new Error('CODE_WITHOUT_FILES');
  const lista = [...estado.alterados.map(p => '+ ' + p), ...estado.removidos.map(p => '- ' + p)];
  const detalhe = 'Pasta: ' + e.pastaLocal + '\nDestino: ' + gh.recurso.chave + '\nBranch: prumo/projeto-' + e.id + '\nMensagem: ' + a.mensagem + '\n' + lista.slice(0, 40).join('\n') + (lista.length > 40 ? '\n… total de ' + lista.length + ' arquivos' : '') + '\nO envio publica os arquivos salvos da pasta, respeita .gitignore e preserva arquivos remotos sem cópia local. Remoções abrangem somente arquivos enviados antes por este projeto. Repositório vazio recebe um commit inicial. O Git local não é alterado.';
  if (!await confirmarNoWindows(j, 'Enviar código ao GitHub', 'Publicar as alterações salvas de ' + e.nome + '?', detalhe, 'Enviar alterações')) return { canceled: true };
  // A pessoa pode trocar de projeto/pasta enquanto a confirmação está aberta.
  const atual = obterEspaco(e.id);
  if (atual.pastaLocal !== e.pastaLocal || atual.vinculos.find(v => v.servico === 'github')?.id !== gh.id || !escritaHabilitada(e.id, 'github')) throw new Error('CODE_SCOPE_CHANGED');
  return servicosDoAplicativo.comContexto(e.id, 'github', async (ctx, rec) => ({ canceled: false, ...await publicarSnapshot(ctx, rec, e.id, e.pastaLocal!, snapshot, a.mensagem) }));
});

/** Terminal da IDE: cada comando passa pela confirmação nativa, mostra a pasta e o texto exato e roda só depois do Executar. */
export const ideComandoexecutar: TratadorDoCanal<'ide:comandoexecutar'> = async (a, j) => {
  const e = obterEspaco(a.espacoId); if (!e.pastaLocal) throw new Error('IDE_SEM_REPOSITORIO');
  const comando = comandoValido(a.comando);
  const detalhe = 'Pasta: ' + e.pastaLocal + '\nComando: ' + comando + '\n\nO comando roda com as permissões da sua conta do Windows e pode ler e alterar arquivos fora da pasta: o Prumo não é uma proteção do sistema. Confira o texto antes de executar.';
  if (!await confirmarNoWindows(j, 'Executar comando no terminal', 'Executar este comando em ' + e.nome + '?', detalhe, 'Executar')) return { canceled: true };
  // A pessoa pode trocar de projeto ou de pasta enquanto a confirmação está aberta.
  if (obterEspaco(e.id).pastaLocal !== e.pastaLocal) throw new Error('CODE_SCOPE_CHANGED');
  return { canceled: false, id: iniciarComando(e.id, e.pastaLocal, comando) };
};
export const ideComandosaida: TratadorDoCanal<'ide:comandosaida'> = a => lerSaida(a.id, a.desde);
export const ideComandoparar: TratadorDoCanal<'ide:comandoparar'> = a => pararComando(a.id);
