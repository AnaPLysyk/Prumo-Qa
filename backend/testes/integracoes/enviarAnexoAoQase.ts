/** Operação "Enviar anexo ao Qase". */
import path from 'node:path';
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { montarEnvioDeArquivo } from '../../conexoes/integracoes/montarEnvioDeArquivo.js';
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { anexar } from '../tipos/escritaQase.js';
import { lerAnexo } from '../../tickets/integracoes/lerAnexo.js';

export const enviarAnexoAoQase: DefOperacao<z.infer<typeof anexar>> = {
  id: 'qase.anexar', servico: 'qase', rotulo: 'Enviar anexo ao Qase', efeito: 'Envia um arquivo (log, imagem, vídeo ou evidência) e devolve o hash para usar em casos e resultados.', exigeConfirmacao: true, schema: anexar,
  resumo: p => `Enviar anexo "${path.basename(p.arquivo)}"`,
  async executar(ctx, rec, p, _k, aux) {
    const a = lerAnexo(p.arquivo, aux); const m = montarEnvioDeArquivo('file[]', { nome: a.nome, tipo: a.tipo, dados: a.dados });
    const r = z.object({ result: z.array(z.object({ hash: z.string(), filename: z.string().optional() }).passthrough()) }).passthrough().parse(await ctx.enviar('POST', `/v1/attachment/${codificarParaUrl(rec.chave)}`, m.corpo, m.tipoConteudo));
    return { id: r.result[0]?.hash, detalhes: { arquivo: a.nome, bytes: a.tamanho } };
  }
};
