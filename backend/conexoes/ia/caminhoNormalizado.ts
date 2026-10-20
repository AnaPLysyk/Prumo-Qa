/** Normaliza um caminho para comparação (minúsculas no Windows). */
import path from 'node:path';

export const caminhoNormalizado=(a:string)=>process.platform==='win32'?path.resolve(a).toLowerCase():path.resolve(a);
