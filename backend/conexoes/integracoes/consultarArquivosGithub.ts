/** Consulta arquivos no serviço correspondente, mantendo as validações de resposta e autorização. */
import { ParametrosConsulta } from '../tipos/ParametrosConsulta.js';
import { ResultadoConsulta } from '../tipos/ResultadoConsulta.js';
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ErroServico } from './ErroServico.js';

export async function consultarArquivosGithub(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, id, f, repo } = parametros;
  if (ctx.servico !== 'github') return null; const caminho = (id ?? '').replace(/^\/+/, ''); if (caminho.split('/').some(s => s === '..' || s === '.') || /[\x00-\x1f\\]/.test(caminho) || caminho.length > 300) throw new ErroServico('SERVICE_RESPONSE_INVALID');
        const ref = f.ref ? `?ref=${codificarParaUrl(f.ref)}` : ''; const r = await ctx.ler(`${repo}/contents/${caminho.split('/').filter(Boolean).map(codificarParaUrl).join('/')}${ref}`);
        if (Array.isArray(r)) return { dados: r.slice(0, 200).map(x => z.object({ name: z.string(), path: z.string(), type: z.string(), size: z.number().optional(), sha: z.string().optional(), html_url: z.string().optional() }).passthrough().parse(x)).map(x => ({ nome: x.name, caminho: x.path, tipo: x.type, bytes: x.size ?? null, sha: x.sha ?? null, url: x.html_url ?? null })), proxima: null, endpoint: `${repo}/contents/{path}` };
        const a = z.object({ name: z.string(), path: z.string(), type: z.string(), size: z.number(), sha: z.string(), encoding: z.string().optional(), content: z.string().optional(), html_url: z.string().optional() }).passthrough().parse(r);
        const texto = a.encoding === 'base64' && a.content && a.size <= 100 * 1024 ? Buffer.from(a.content.replace(/\n/g, ''), 'base64').toString('utf8') : null;
        return { dados: { nome: a.name, caminho: a.path, tipo: a.type, bytes: a.size, sha: a.sha, url: a.html_url ?? null, conteudo: texto === null ? null : ctx.limpar(texto), conteudoOmitido: texto === null ? 'arquivo maior que 100 KB ou binário' : null }, proxima: null, endpoint: `${repo}/contents/{path}` };
}
