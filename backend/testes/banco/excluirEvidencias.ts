/** Apaga as evidências do projeto (Ajuda › Privacidade e dados), informando falhas. */
import { promises as fs } from 'node:fs';
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { caminhoSeguro } from '../../compartilhado/seguranca/caminhoSeguro.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';

/**
 * Exclusão controlada das evidências de execução de UM projeto. Escopo: .prumo/evidencias/<uuid>.json regulares,
 * validados por caminhoSeguro (sem links nem fuga da raiz). Nunca toca código, documentos ou outros projetos.
 */
export async function excluirEvidencias(p:Projeto) {
  const pasta = await caminhoSeguro(p.raiz,'.prumo/evidencias',true,true);
  let nomes:string[]; try { nomes=(await fs.readdir(pasta)).filter(n => /^[0-9a-f-]{36}\.json$/i.test(n)); }
  catch(e) { if ((e as NodeJS.ErrnoException).code==='ENOENT') return { deleted:0, failed:[] as { file:string; code:string }[] }; throw e; }
  const failed:{ file:string; code:string }[]=[]; let deleted=0;
  for (const n of nomes) {
    try {
      const alvo = await caminhoSeguro(p.raiz,`.prumo/evidencias/${n}`,true);
      const st = await fs.lstat(alvo); if (!st.isFile() || st.nlink!==1) throw Object.assign(new Error('x'),{ code:'FILE_INVALID' });
      await fs.unlink(alvo); deleted++;
    } catch(e) { failed.push({ file:n, code:(e as NodeJS.ErrnoException).code ?? (e as ErroQa).codigo ?? 'UNKNOWN' }); }
  }
  try { await fs.rmdir(pasta); } catch { /* restam arquivos */ }
  return { deleted, failed };
}
