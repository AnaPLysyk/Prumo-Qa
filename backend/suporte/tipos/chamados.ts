/** Chamados enviados pelo serviço do Prumo: tipos de anexo e limites (os mesmos do serviço), estados e o formato do que fica guardado neste computador. */
import { z } from 'zod';

const MB = 1024 * 1024;
/** Tipos aceitos, conferidos pela assinatura do arquivo (a extensão sozinha não vale). */
export const tiposDeAnexo = {
  'image/png': { tipo: 'imagem', maximo: 5 * MB, extensoes: ['png'] }, 'image/jpeg': { tipo: 'imagem', maximo: 5 * MB, extensoes: ['jpg', 'jpeg'] }, 'image/webp': { tipo: 'imagem', maximo: 5 * MB, extensoes: ['webp'] },
  'video/mp4': { tipo: 'video', maximo: 25 * MB, extensoes: ['mp4'] }, 'video/webm': { tipo: 'video', maximo: 25 * MB, extensoes: ['webm'] }
} as const;
export type TipoDeAnexo = keyof typeof tiposDeAnexo;
export const quantosAnexos = { imagem: 3, video: 1 } as const;

export const estadosDoChamado = ['NOVO', 'EM_ANALISE', 'RESOLVIDO', 'FECHADO'] as const;
export const estadoDoChamadoSchema = z.enum(estadosDoChamado);

/** Anexo escolhido no diálogo do sistema: a janela recebe só id, nome, tipo e tamanho; o caminho fica no processo principal. */
export type AnexoEscolhido = { id: string; nome: string; tipo: TipoDeAnexo; tamanho: number };

/** O que fica neste computador sobre cada chamado aberto: a chave de acompanhamento vai protegida pelo cofre do sistema. */
const meuChamadoSchema = z.object({
  usuarioId: z.string().uuid(), numero: z.number().int().min(1).max(999999999), titulo: z.string().max(200), categoria: z.enum(['bug', 'melhoria', 'sugestao']),
  criadoEm: z.string().datetime(), chave: z.string().max(2000).nullable()
}).strict();
export const meusChamadosSchema = z.object({ version: z.literal(1), chamados: z.array(meuChamadoSchema).max(2000) }).strict();
