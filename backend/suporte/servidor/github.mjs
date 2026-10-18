/**
 * Cliente do GitHub usado só pelo serviço, só no repositório PRIVADO dos chamados (PRUMO_SUPORTE_REPOSITORIO), com um token
 * fine-grained restrito a ele (Issues e Contents). A pessoa que abre o chamado não precisa de conta no GitHub.
 */

const REPOSITORIO = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/;

export function clienteDoGitHub({ token, repositorio, buscar = fetch, api = 'https://api.github.com' }) {
  if (!REPOSITORIO.test(repositorio || '')) throw new Error('repositório inválido');
  const base = `${api}/repos/${repositorio}`;
  const chamar = async (metodo, caminho, corpo, aceitar = 'application/vnd.github+json') => {
    const r = await buscar(base + caminho, { method: metodo, redirect: 'error', signal: AbortSignal.timeout(60_000),
      headers: { Authorization: 'Bearer ' + token, Accept: aceitar, 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Prumo-QA-servico', ...(corpo ? { 'Content-Type': 'application/json' } : {}) },
      body: corpo ? JSON.stringify(corpo) : undefined });
    return r;
  };
  const json = async (r, esperado) => { if (!esperado.includes(r.status)) throw new Error('o GitHub respondeu ' + r.status); return r.json(); };
  const caminhoSeguro = (c) => { if (!/^chamados\/\d{1,9}(\/[A-Za-z0-9._-]{1,140})?$/.test(c)) throw new Error('caminho recusado'); return c; };
  return {
    criarIssue: async ({ titulo, corpo, rotulos }) => json(await chamar('POST', '/issues', { title: titulo, body: corpo, labels: rotulos }), [201]),
    lerIssue: async (n) => { const r = await chamar('GET', `/issues/${n}`); return r.status === 404 ? null : json(r, [200]); },
    listarIssues: async (rotulo) => (await json(await chamar('GET', `/issues?state=all&labels=${encodeURIComponent(rotulo)}&per_page=100&sort=updated&direction=desc`), [200])).filter((i) => !i.pull_request),
    atualizarIssue: async (n, { rotulos, estado, motivo }) => json(await chamar('PATCH', `/issues/${n}`, { ...(rotulos ? { labels: rotulos } : {}), ...(estado ? { state: estado } : {}), ...(motivo ? { state_reason: motivo } : {}) }), [200]),
    comentarios: async (n) => json(await chamar('GET', `/issues/${n}/comments?per_page=100`), [200]),
    comentar: async (n, texto) => json(await chamar('POST', `/issues/${n}/comments`, { body: texto }), [201]),
    /** Grava um arquivo novo; se já existir, devolve false (o GitHub responde 422 sem o sha). */
    gravarArquivo: async (caminho, bytes, mensagem) => { const r = await chamar('PUT', `/contents/${caminhoSeguro(caminho)}`, { message: mensagem, content: Buffer.from(bytes).toString('base64') }); if (r.status === 422) return false; await json(r, [201]); return true; },
    listarArquivos: async (pasta) => { const r = await chamar('GET', `/contents/${caminhoSeguro(pasta)}`); if (r.status === 404) return []; const l = await json(r, [200]); return Array.isArray(l) ? l.map((a) => ({ nome: a.name, caminho: a.path, tamanho: a.size })) : []; },
    lerArquivo: async (caminho) => { const r = await chamar('GET', `/contents/${caminhoSeguro(caminho)}`, null, 'application/vnd.github.raw'); if (r.status === 404) return null; if (r.status !== 200) throw new Error('o GitHub respondeu ' + r.status); return Buffer.from(await r.arrayBuffer()); }
  };
}
