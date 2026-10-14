/** Canal espacos:trazer: Trazer o repositório do GitHub vinculado ao projeto para uma pasta deste computador (ou atualizá-lo), depois da confirmação nativa. */
import path from 'node:path';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';
import { obterEspaco } from '../banco/obterEspaco.js';
import { clonarOuAtualizarRepositorio, repositorioValido } from '../regras/clonarRepositorio.js';
import { vincularPastaDoDisco } from '../regras/vincularPastaDoDisco.js';

export const espacosTrazer: TratadorDoCanal<'espacos:trazer'> = async (a, j) => {
  const e = obterEspaco(a.id); const gh = e.vinculos.find((v) => v.servico === 'github');
  if (!gh) throw new Error('GITHUB_NOT_LINKED: vincule um repositório do GitHub ao projeto, em Projetos, antes de trazê-lo.');
  const chave = String(gh.recurso.chave); if (!repositorioValido(chave)) throw new Error('GIT_URL_INVALID: o repositório vinculado tem um nome que o Prumo não aceita.');
  const raizDosClones = path.join(diretorioDados(), 'repositorios', e.id); const destino = path.join(raizDosClones, chave.split('/')[1]!);
  const atualizar = !!e.pastaLocal;
  if (atualizar && path.resolve(e.pastaLocal!).toLowerCase() !== path.resolve(destino).toLowerCase()) throw new Error('CLONE_NOT_FROM_PRUMO: a pasta deste projeto não foi trazida pelo Prumo; atualize-a com o seu próprio git.');
  const url = `https://github.com/${chave}.git`;
  const detalhe = `Repositório: ${chave}\nDestino: ${destino}\n${atualizar ? 'Atualiza só por avanço (fast-forward); mudanças suas não são sobrescritas.' : 'Cópia nova com os últimos 50 commits da ramificação principal.'}\nUsa o git instalado neste computador e as credenciais dele; o Prumo não entrega a sua credencial ao git. Hooks e links simbólicos ficam desligados e nada é executado.`;
  if (!await confirmarNoWindows(j, atualizar ? 'Atualizar repositório do GitHub' : 'Trazer repositório do GitHub', `${atualizar ? 'Atualizar' : 'Baixar'} ${chave} em uma pasta deste computador?`, detalhe, atualizar ? 'Atualizar' : 'Baixar')) return { canceled: true };
  const r = await clonarOuAtualizarRepositorio(url, destino);
  if (atualizar) return { canceled: false, acao: r.acao, pasta: r.pasta, ramo: r.ramo };
  const v = await vincularPastaDoDisco(e.id, r.pasta, (t, m, d, b) => confirmarNoWindows(j, t, m, d, b));
  if ('canceled' in v) return { canceled: false, acao: r.acao, pasta: r.pasta, ramo: r.ramo, vinculada: false };
  return { canceled: false, acao: r.acao, pasta: r.pasta, ramo: r.ramo, vinculada: true };
};
