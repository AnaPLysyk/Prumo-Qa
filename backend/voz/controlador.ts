/** Controlador da voz: estado do reconhecimento, preparação do modelo (com confirmação) e transcrição local. */
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { perguntarNaJanela } from "../aplicativo/janela/caixaDeConfirmacao.js";
import { MODELO, TAMANHO_DO_MODELO_MB, modeloPronto, prepararModelo, transcrever } from "./reconhecimento.js";

const estado = () => ({ motor: 'whisper-base', pronto: modeloPronto(), tamanhoMb: TAMANHO_DO_MODELO_MB });

export const vozEstado: TratadorDoCanal<'voz:estado'> = () => estado();

export const vozPreparar: TratadorDoCanal<'voz:preparar'> = async (_a, janela) => {
  if (!modeloPronto()) {
    const aviso = await perguntarNaJanela(janela, { type: 'question', title: 'Voz', buttons: ['Cancelar', 'Baixar modelo'], defaultId: 0, cancelId: 0, noLink: true,
      message: 'Para transcrever sua voz sem enviar áudio para fora, o Prumo precisa baixar o modelo Whisper (cerca de ' + TAMANHO_DO_MODELO_MB + ' MB).',
      detail: 'O download vem de huggingface.co (' + MODELO + ') e acontece uma única vez. Depois disso o áudio é processado só neste computador.' });
    if (aviso.response !== 1) return { ...estado(), cancelado: true };
  }
  await prepararModelo();
  return { ...estado(), cancelado: false };
};

export const vozTranscrever: TratadorDoCanal<'voz:transcrever'> = async a => ({ texto: await transcrever(a.audio, a.idioma) });
