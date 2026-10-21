/** Acha o site Jira de quem só colou o token: testa os sites prováveis (os já conhecidos, o domínio da empresa e o início do e-mail) e confirma pelo próprio Jira. */
import { randomUUID } from "node:crypto";
import { AdaptadorServico } from "../integracoes/AdaptadorServico.js";
import { ErroServico } from "../integracoes/configuracaoDosServicos.js";
import { ContextoDosServicos } from "../tipos/contaDeServico.js";

/** Provedores de e-mail pessoal: o nome deles nunca é o site Jira de ninguém. */
const PROVEDORES_COMUNS = new Set(['gmail', 'googlemail', 'hotmail', 'outlook', 'live', 'msn', 'yahoo', 'ymail', 'icloud', 'me', 'mac', 'proton', 'protonmail', 'pm', 'uol', 'bol', 'terra', 'globo', 'ig', 'zoho', 'aol', 'gmx', 'mail', 'yandex', 'qq', 'hey']);
const ROTULO_VALIDO = /^[a-z0-9][a-z0-9-]{0,62}$/;
const MAXIMO_DE_SITES = 8, MAXIMO_DE_EMAILS = 3;

export type ResultadoDaDescoberta =
  | { achou: true; site: string; usuario: string }
  | { achou: false; motivo: 'NAO_ACHEI' | 'CREDENCIAL_RECUSADA'; site: string | null };

const unicos = <T>(itens: T[]) => [...new Set(itens)];

/** Sites a tentar, do mais ao menos provável: conhecidos, domínio da empresa e variações do início do e-mail (empresa, ana.silva → anasilva e ana-silva). */
export function candidatosDeSiteJira(emails: string[], conhecidos: string[] = []): string[] {
  const lista = conhecidos.map(c => c.toLowerCase());
  for (const email of emails) {
    const [local, dominio] = email.toLowerCase().split('@');
    if (!local || !dominio) continue;
    const empresa = dominio.split('.')[0]!;
    if (!PROVEDORES_COMUNS.has(empresa)) lista.push(empresa);
    const inicio = local.split('+')[0]!;
    lista.push(inicio.replace(/\./g, ''), inicio.replace(/\./g, '-'));
  }
  return unicos(lista).filter(c => ROTULO_VALIDO.test(c)).slice(0, MAXIMO_DE_SITES);
}

/** Cada tentativa é uma consulta ao próprio Jira (`myself`): site que não existe nunca responde como Jira, e e-mail errado volta 401. O token só vai para endereços *.atlassian.net. */
export async function descobrirSiteDoJira(c: ContextoDosServicos, entrada: { token: string; emails: string[]; conhecidos?: string[] }): Promise<ResultadoDaDescoberta> {
  const emails = unicos(entrada.emails.map(e => e.trim().toLowerCase()).filter(e => /^[^@\s]+@[^@\s]+$/.test(e))).slice(0, MAXIMO_DE_EMAILS);
  const sitesExistentes = new Set<string>();
  const achado: { valor: { site: string; usuario: string } | null } = { valor: null };
  await Promise.all(candidatosDeSiteJira(emails, entrada.conhecidos).map(async site => {
    for (const usuario of emails) {
      if (achado.valor) return;
      try {
        await new AdaptadorServico({ id: randomUUID(), servico: 'jira', instancia: `https://${site}.atlassian.net`, usuario, contaId: 'pendente', token: entrada.token }, c.transporte, c.escrita).autenticar();
        achado.valor ??= { site, usuario };
        return;
      } catch (e) {
        const codigo = e instanceof ErroServico ? e.codigo : '';
        // 401/403: o site existe, só não aceitou este e-mail com este token. Qualquer outro erro: site inexistente ou fora do ar.
        if (codigo === 'CREDENTIAL_INVALID_OR_EXPIRED' || codigo === 'SERVICE_PERMISSION') sitesExistentes.add(site);
      }
    }
  }));
  if (achado.valor) return { achou: true, ...achado.valor };
  return { achou: false, motivo: sitesExistentes.size ? 'CREDENCIAL_RECUSADA' : 'NAO_ACHEI', site: [...sitesExistentes][0] ?? null };
}
