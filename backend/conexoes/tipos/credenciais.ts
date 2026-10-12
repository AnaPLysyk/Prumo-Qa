/** Formato do protetor de credenciais do Windows e do arquivo de credenciais cifradas. */
import { z } from 'zod';

/** Injetado pelo processo principal; o núcleo não importa Electron nem expõe o cofre ao MCP. */
export type Protetor={disponivel:()=>boolean;proteger:(valor:string)=>Buffer;abrir:(valor:Buffer)=>string};

export const schema=z.object({version:z.literal(1),entradas:z.record(z.string().max(20000))}).strict();
