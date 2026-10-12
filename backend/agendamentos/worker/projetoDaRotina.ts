/** Abre o contrato da pasta de automação do projeto da rotina; sem pasta vinculada, recusa com PROJECT_FOLDER_REQUIRED. */
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { carregarProjeto } from '../../compartilhado/projeto/carregarProjeto.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { EstadoDoWorker } from '../tipos/worker.js';

export async function projetoDaRotina(e: EstadoDoWorker, espacoId: string): Promise<Projeto> {
  const espaco = obterEspaco(espacoId, e.base);
  if (!espaco.pastaLocal) throw new ErroQa('PROJECT_FOLDER_REQUIRED', 'Esta rotina executa testes e precisa de uma pasta de automação vinculada ao projeto Prumo.');
  return carregarProjeto(espaco.pastaLocal);
}
