/** Anexos e operações Qase — arquivos relacionados agrupados para manutenção. */
import path from "node:path";
import { z } from "zod";
import { codificarParaUrl } from "../../compartilhado/texto.js";
import { montarEnvioDeArquivo } from "../../conexoes/integracoes/montarEnvioDeArquivo.js";
import { DefOperacao } from "../../conexoes/tipos/operacao.js";
import { anexar } from "../tipos/escritaQase.js";
import { lerAnexo } from "../../tickets/integracoesJira.js";
import { associarTicketAoCasoNoQase, criarCasoNoQase, criarSuiteNoQase, editarCasoNoQase } from "./casosQase.js";
import { criarDefeitoNoQase, mudarStatusDefeitoNoQase } from "./defeitosQase.js";
import { criarPlanoNoQase } from "./execucoesQase.js";
import { criarRunNoQaseOperacao, encerrarRunNoQase, publicarResultadosNoQase } from "./execucoesQase.js";

// ── enviarAnexoAoQase ──
export const enviarAnexoAoQase: DefOperacao<z.infer<typeof anexar>> = {
  id: 'qase.anexar', servico: 'qase', rotulo: 'Enviar anexo ao Qase', efeito: 'Envia um arquivo (log, imagem, vídeo ou evidência) e devolve o hash para usar em casos e resultados.', exigeConfirmacao: true, schema: anexar,
  resumo: p => `Enviar anexo "${path.basename(p.arquivo)}"`,
  async executar(ctx, rec, p, _k, aux) {
    const a = lerAnexo(p.arquivo, aux); const m = montarEnvioDeArquivo('file[]', { nome: a.nome, tipo: a.tipo, dados: a.dados });
    const r = z.object({ result: z.array(z.object({ hash: z.string(), filename: z.string().optional() }).passthrough()) }).passthrough().parse(await ctx.enviar('POST', `/v1/attachment/${codificarParaUrl(rec.chave)}`, m.corpo, m.tipoConteudo));
    return { id: r.result[0]?.hash, detalhes: { arquivo: a.nome, bytes: a.tamanho } };
  }
};

// ── operacoesQase ──
export const operacoesQase = [criarSuiteNoQase, criarDefeitoNoQase, mudarStatusDefeitoNoQase, criarCasoNoQase, editarCasoNoQase, associarTicketAoCasoNoQase, criarPlanoNoQase, criarRunNoQaseOperacao, encerrarRunNoQase, publicarResultadosNoQase, enviarAnexoAoQase] as unknown as DefOperacao<unknown>[];
