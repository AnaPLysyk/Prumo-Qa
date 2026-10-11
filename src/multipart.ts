import { randomBytes } from 'node:crypto';

/** Corpo multipart/form-data mínimo para anexos. O nome do arquivo é limpo de separadores e caracteres de controle. */
export function multipart(campo: string, arquivo: { nome: string; tipo: string; dados: Buffer }): { corpo: Buffer; tipoConteudo: string } {
  const limite = '----PrumoQA' + randomBytes(12).toString('hex');
  const nome = arquivo.nome.replace(/[\x00-\x1f"\\/]/g, '_').slice(0, 180) || 'arquivo';
  const cabeca = Buffer.from(`--${limite}\r\nContent-Disposition: form-data; name="${campo}"; filename="${nome}"\r\nContent-Type: ${arquivo.tipo}\r\n\r\n`, 'utf8');
  const cauda = Buffer.from(`\r\n--${limite}--\r\n`, 'utf8');
  return { corpo: Buffer.concat([cabeca, arquivo.dados, cauda]), tipoConteudo: `multipart/form-data; boundary=${limite}` };
}
