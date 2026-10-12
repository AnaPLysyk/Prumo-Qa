/** Consulta commit no serviço correspondente, mantendo as validações de resposta e autorização. */
import { ParametrosConsulta } from '../tipos/ParametrosConsulta.js';
import { ResultadoConsulta } from '../tipos/ResultadoConsulta.js';
import { z } from 'zod';
import { ErroServico } from './ErroServico.js';

export async function consultarCommitGithub(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, id, repo } = parametros;
  if (ctx.servico !== 'github') return null; if (!id || !/^[a-f0-9]{7,40}$/.test(id)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
        const r = z.object({ sha: z.string(), html_url: z.string().optional(), commit: z.object({ message: z.string(), author: z.object({ name: z.string().optional(), date: z.string().optional() }).passthrough().optional() }).passthrough(), files: z.array(z.object({ filename: z.string(), status: z.string(), additions: z.number().optional(), deletions: z.number().optional() }).passthrough()).default([]) }).passthrough().parse(await ctx.ler(`${repo}/commits/${id}`));
        return { dados: { sha: r.sha, url: r.html_url ?? null, mensagem: ctx.limpar(r.commit.message), autor: r.commit.author?.name ?? null, data: r.commit.author?.date ?? null, arquivos: r.files.slice(0, 100).map(x => ({ nome: x.filename, estado: x.status, adicoes: x.additions ?? 0, remocoes: x.deletions ?? 0 })) }, proxima: null, endpoint: `${repo}/commits/{sha}` };
      }
}
