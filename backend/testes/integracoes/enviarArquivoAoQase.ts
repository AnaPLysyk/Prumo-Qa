/** Envio de um arquivo (log, imagem, vídeo, relatório) ao armazenamento de anexos do Qase. */
import { z } from "zod";
import { codificarParaUrl } from "../../compartilhado/texto.js";
import { montarEnvioDeArquivo } from "../../conexoes/integracoes/montarEnvioDeArquivo.js";
import { ContextoServico } from "../../conexoes/tipos/adaptador.js";
import { Auxiliar } from "../../conexoes/tipos/operacao.js";
import { lerAnexo } from "../../tickets/integracoesJira.js";

/** Valida o arquivo (só pastas de evidência do projeto ou arquivo escolhido na janela nativa), mascara segredos em texto e envia. Devolve o hash do anexo. */
export async function enviarArquivoAoQase(ctx: ContextoServico, projeto: string, caminho: string, aux: Auxiliar) {
  const a = lerAnexo(caminho, aux); const m = montarEnvioDeArquivo('file[]', { nome: a.nome, tipo: a.tipo, dados: a.dados });
  const r = z.object({ result: z.array(z.object({ hash: z.string(), filename: z.string().optional() }).passthrough()) }).passthrough().parse(await ctx.enviar('POST', `/v1/attachment/${codificarParaUrl(projeto)}`, m.corpo, m.tipoConteudo));
  return { hash: r.result[0]?.hash, nome: a.nome, tamanho: a.tamanho };
}
