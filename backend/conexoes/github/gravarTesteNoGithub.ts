/** Operação "Gravar arquivo de teste em branch de trabalho" (commit só em prumo/...). */
import { z } from 'zod';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { caminhoDoRepositorio } from './caminhoDoRepositorio.js';
import { commitAtualDoBranch } from './commitAtualDoBranch.js';
import { dadosDoRepositorio } from './dadosDoRepositorio.js';
import { ErroServico } from '../integracoes/ErroServico.js';
import { commitar, sha40 } from '../tipos/escritaGithub.js';
import { DefOperacao } from '../tipos/operacao.js';

export const gravarTesteNoGithub: DefOperacao<z.infer<typeof commitar>> = {
  id: 'github.commitar_arquivo', servico: 'github', rotulo: 'Gravar arquivo de teste em branch de trabalho', efeito: 'Cria ou atualiza um arquivo de teste no branch prumo/..., gerando um commit. Não toca no branch padrão nem em workflows.', exigeConfirmacao: true, schema: commitar,
  resumo: p => `Commit em ${p.branch}: ${p.caminho} (${Buffer.byteLength(p.conteudo)} bytes)`,
  async executar(ctx, rec, p) {
    const repo = await dadosDoRepositorio(ctx, rec); if (p.branch === repo.default_branch) throw new ErroServico('SERVICE_WRITE_BLOCKED'); if (!(await commitAtualDoBranch(ctx, rec, p.branch))) throw new ErroServico('SERVICE_NOT_FOUND');
    const caminho = p.caminho.split('/').map(codificarParaUrl).join('/'); const texto = mascarar(p.conteudo); let shaAtual: string | undefined;
    try {
      const a = z.object({ sha: z.string(), content: z.string().optional(), encoding: z.string().optional() }).passthrough().parse(await ctx.ler(`${caminhoDoRepositorio(rec)}/contents/${caminho}?ref=${codificarParaUrl(p.branch)}`));
      if (a.encoding === 'base64' && a.content && Buffer.from(a.content.replace(/\n/g, ''), 'base64').toString('utf8') === texto) return { id: a.sha, chave: p.caminho, detalhes: { semMudanca: true, atualizacao: false } }; // idempotente
      shaAtual = a.sha;
    } catch (e) { if (!(e instanceof ErroServico && e.codigo === 'SERVICE_NOT_FOUND')) throw e; }
    const r = z.object({ commit: z.object({ sha: sha40, html_url: z.string().optional() }).passthrough(), content: z.object({ html_url: z.string().optional() }).passthrough().optional() }).passthrough()
      .parse(await ctx.enviar('PUT', `${caminhoDoRepositorio(rec)}/contents/${caminho}`, JSON.stringify({ message: mascarar(p.mensagem), content: Buffer.from(texto, 'utf8').toString('base64'), branch: p.branch, ...(shaAtual ? { sha: shaAtual } : {}) })));
    return { id: r.commit.sha, chave: p.caminho, url: r.commit.html_url ?? r.content?.html_url, detalhes: { semMudanca: false, atualizacao: shaAtual !== undefined } };
  },
  async confirmar(ctx, rec, p) {
    const a = z.object({ content: z.string().optional() }).passthrough().parse(await ctx.ler(`${caminhoDoRepositorio(rec)}/contents/${p.caminho.split('/').map(codificarParaUrl).join('/')}?ref=${codificarParaUrl(p.branch)}`));
    return !!a.content && Buffer.from(a.content.replace(/\n/g, ''), 'base64').toString('utf8') === mascarar(p.conteudo);
  }
};
