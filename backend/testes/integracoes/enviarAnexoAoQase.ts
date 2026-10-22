/** Anexos e operações Qase — arquivos relacionados agrupados para manutenção. */
import path from "node:path";
import { z } from "zod";
import { enviarArquivoAoQase } from "./enviarArquivoAoQase.js";
import { DefOperacao } from "../../conexoes/tipos/operacao.js";
import { anexar } from "../tipos/escritaQase.js";
import { associarTicketAoCasoNoQase, criarCasoNoQase, criarSuiteNoQase, editarCasoNoQase, editarSuiteNoQase, apagarSuiteNoQase } from "./casosQase.js";
import { criarDefeitoNoQase, mudarStatusDefeitoNoQase } from "./defeitosQase.js";
import { criarPlanoNoQase } from "./execucoesQase.js";
import { criarRunNoQaseOperacao, encerrarRunNoQase, publicarResultadosNoQase } from "./execucoesQase.js";

// ── enviarAnexoAoQase ──
export const enviarAnexoAoQase: DefOperacao<z.infer<typeof anexar>> = {
  id: 'qase.anexar', servico: 'qase', rotulo: 'Enviar anexo ao Qase', efeito: 'Envia um arquivo (log, imagem, vídeo ou evidência) e devolve o hash para usar em casos e resultados.', exigeConfirmacao: true, schema: anexar,
  resumo: p => `Enviar anexo "${path.basename(p.arquivo)}"`,
  async executar(ctx, rec, p, _k, aux) {
    const r = await enviarArquivoAoQase(ctx, rec.chave, p.arquivo, aux);
    return { id: r.hash, detalhes: { arquivo: r.nome, bytes: r.tamanho } };
  }
};

// ── operacoesQase ──
export const operacoesQase = [criarSuiteNoQase, criarDefeitoNoQase, mudarStatusDefeitoNoQase, criarCasoNoQase, editarCasoNoQase, editarSuiteNoQase, apagarSuiteNoQase, associarTicketAoCasoNoQase, criarPlanoNoQase, criarRunNoQaseOperacao, encerrarRunNoQase, publicarResultadosNoQase, enviarAnexoAoQase] as unknown as DefOperacao<unknown>[];
