/** Voz: transcrição local com Whisper. O áudio é processado neste computador; a rede só é usada, uma vez e com a confirmação da pessoa, para baixar o modelo. */
import fs from "node:fs";
import path from "node:path";
import { diretorioBase } from "../compartilhado/banco/diretorioDados.js";
import { falharCom } from "../compartilhado/erros.js";

export const MODELO = 'onnx-community/whisper-base';
export const TAMANHO_DO_MODELO_MB = 76;
const ARQUIVOS = ['config.json', 'tokenizer.json', 'preprocessor_config.json', 'onnx/encoder_model_quantized.onnx', 'onnx/decoder_model_merged_quantized.onnx'];
const MAXIMO_DE_AMOSTRAS = 16000 * 60;

type Reconhecedor = (audio: Float32Array, opcoes: Record<string, unknown>) => Promise<{ text?: string }>;
let reconhecedor: Promise<Reconhecedor> | null = null;

const pastaDoModelo = () => path.join(diretorioBase(), 'modelos-voz');
export const modeloPronto = () => ARQUIVOS.every((a) => fs.existsSync(path.join(pastaDoModelo(), ...MODELO.split('/'), ...a.split('/'))));

async function carregar(baixar: boolean): Promise<Reconhecedor> {
  const { pipeline, env } = await import('@huggingface/transformers');
  env.cacheDir = pastaDoModelo(); env.allowLocalModels = true; env.allowRemoteModels = baixar;
  return await pipeline('automatic-speech-recognition', MODELO, { dtype: 'q8' }) as unknown as Reconhecedor;
}

/** Baixa o modelo (só depois da confirmação na janela) e deixa o reconhecedor pronto. */
export async function prepararModelo(): Promise<void> {
  if (modeloPronto() && reconhecedor) return;
  reconhecedor = carregar(!modeloPronto()); reconhecedor.catch(() => { reconhecedor = null; });
  await reconhecedor;
}

/** Transcreve fala mono de 16 kHz (até 60 s). Nunca baixa nada: sem o modelo, pede a preparação. */
export async function transcrever(audio: Float32Array, idioma: 'pt' | 'en'): Promise<string> {
  if (audio.length < 1600 || audio.length > MAXIMO_DE_AMOSTRAS) falharCom('VOICE_AUDIO_INVALID');
  if (!modeloPronto()) falharCom('VOICE_MODEL_MISSING');
  reconhecedor ??= carregar(false); reconhecedor.catch(() => { reconhecedor = null; });
  const r = await (await reconhecedor)(audio, { language: idioma === 'en' ? 'english' : 'portuguese', task: 'transcribe' });
  return String(r.text ?? '').trim();
}
