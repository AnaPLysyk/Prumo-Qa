/** Decide qual arquivo pode ser anexado: uma evidência do projeto ou o arquivo escolhido pela pessoa na janela do Windows. */
import path from 'node:path';
import { Auxiliar } from '../../conexoes/tipos/operacao.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';

/** Anexos: a página só indica "evidência de uma execução" ou "escolher arquivo"; o caminho vem do projeto ou do diálogo nativo, nunca da página. */
export function resolverAnexo(espacoId: string, anexo: { tipo: 'evidencia'; jobId: string } | { tipo: 'arquivo' }, caminhoEscolhido: string | null, b?: string): { arquivo: string; aux: Auxiliar } {
  const e = obterEspaco(espacoId, b); const raizes = e.pastaLocal ? [path.join(e.pastaLocal, '.prumo', 'evidencias'), path.join(e.pastaLocal, '.prumo', 'resultados'), path.join(e.pastaLocal, '.prumo', 'artefatos')] : [];
  if (anexo.tipo === 'evidencia') { if (!e.pastaLocal) throw new Error('PROJECT_FOLDER_REQUIRED: o projeto não tem pasta de automação para localizar a evidência.'); return { arquivo: path.join(raizes[0]!, `${anexo.jobId}.json`), aux: { arquivosAutorizados: [], raizesDeEvidencia: raizes } }; }
  if (!caminhoEscolhido) throw new Error('ATTACHMENT_NOT_CHOSEN: nenhum arquivo foi escolhido.'); return { arquivo: caminhoEscolhido, aux: { arquivosAutorizados: [caminhoEscolhido], raizesDeEvidencia: raizes } };
}
