/** Autoriza GitHub e Jira pelo navegador, igual em Windows, macOS e Linux: o serviço do Prumo troca o código, o app guarda no cofre. */
import { CredencialOAuth, Conta } from "../tipos/contaDeServico.js";
import { EstadoDaAutorizacao, FormatoServicoOAuth, SiteJira } from "../tipos/autorizacao.js";

type Retirada = CredencialOAuth & { sites?: SiteJira[] };
type Inicio = { tentativa: string; url: string; instalarUrl?: string };
type Entrada = { servico: FormatoServicoOAuth; nome?: string; instancia?: string; nuvem?: string; credencial: CredencialOAuth };

/** Tudo o que depende de rede, navegador, sessão e cofre vem de fora: o teste troca cada peça por uma simulada. */
export type DependenciasDaAutorizacao = {
  dono: () => string;
  iniciar: (servico: FormatoServicoOAuth) => Promise<Inicio>;
  estado: (tentativa: string) => Promise<{ estado: 'PENDENTE' | 'PRONTO' | 'NEGADO' | 'ERRO' | 'EXPIRADO' }>;
  retirar: (tentativa: string) => Promise<Retirada>;
  abrir: (url: string) => Promise<void>;
  adicionar: (entrada: Entrada) => Promise<Conta>;
  /** GitHub: quantos repositórios a conta já enxerga; zero significa que o aplicativo ainda não foi instalado. */
  repositorios: (contaId: string) => Promise<number>;
  intervaloMs?: number;
  limiteMs?: number;
};

type Tentativa = { dono: string; servico: FormatoServicoOAuth; id: string; instalarUrl?: string; cancelada: boolean; relogio?: NodeJS.Timeout };
type Pendente = { dono: string; credencial: CredencialOAuth; sites: SiteJira[] };

const mensagemDoErro = (e: unknown) => {
  const codigo = String((e as Error)?.message ?? '');
  if (codigo.startsWith('CONNECTION_DUPLICATE')) return 'Esta conta já está conectada. Remova a conexão antiga antes de conectar de novo.';
  if (codigo === 'INTEGRATION_NOT_CONFIGURED') return 'A autorização pelo navegador ainda não foi configurada pela equipe do Prumo. Use o token manual em Configuração avançada.';
  if (codigo === 'SESSION_REQUIRED' || codigo === 'SESSION_EXPIRED' || codigo === 'SESSION_CHANGED') return 'Entre de novo no Prumo e tente outra vez.';
  if (codigo === 'INTEGRATION_RATE_LIMIT') return 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.';
  if (codigo === 'CREDENTIAL_PROTECTION_UNAVAILABLE') return 'O cofre de credenciais do sistema não está disponível. Nada foi guardado.';
  return 'A conexão não foi concluída. Tente novamente; nada foi guardado.';
};

export function criarAutorizacaoPeloNavegador(d: DependenciasDaAutorizacao) {
  let tentativa: Tentativa | null = null;
  let resultado: { dono: string; valor: EstadoDaAutorizacao } | null = null;
  let pendente: Pendente | null = null;
  let instalacao: { dono: string; url: string } | null = null;

  const encerrar = () => { if (tentativa?.relogio) clearTimeout(tentativa.relogio); tentativa = null; };
  const terminar = (dono: string, valor: EstadoDaAutorizacao) => { encerrar(); pendente = null; resultado = { dono, valor }; };
  const dentroDaSessao = (dono: string) => { if (d.dono() !== dono) throw new Error('SESSION_CHANGED'); };

  /** A conta nasce com o acesso já validado no provedor; o GitHub ainda pode precisar do aplicativo instalado nos repositórios. */
  async function guardar(t: Tentativa, entrada: Entrada) {
    const conta = await d.adicionar(entrada);
    dentroDaSessao(t.dono);
    const resumo = { id: conta.id, nome: conta.nome, identidade: conta.identidade };
    if (t.servico !== 'github') return terminar(t.dono, { estado: 'CONECTADO', conta: resumo });
    const semRepositorios = (await d.repositorios(conta.id)) === 0;
    if (semRepositorios && t.instalarUrl) await d.abrir(t.instalarUrl).catch(() => undefined);
    terminar(t.dono, { estado: 'CONECTADO', conta: resumo, ...(semRepositorios ? { instalarAplicativo: true } : {}) });
  }

  async function concluir(t: Tentativa) {
    const entregue = await d.retirar(t.id);
    dentroDaSessao(t.dono);
    const { sites, ...credencial } = entregue;
    if (t.servico === 'github') return guardar(t, { servico: 'github', credencial });
    if (!sites?.length) return terminar(t.dono, { estado: 'ERRO', mensagem: 'Nenhum site Jira foi autorizado. Refaça a autorização e marque o site.' });
    if (sites.length > 1) { encerrar(); pendente = { dono: t.dono, credencial, sites }; resultado = { dono: t.dono, valor: { estado: 'ESCOLHER_SITE', sites } }; return; }
    return guardar(t, entradaDoJira(credencial, sites[0]!));
  }

  const entradaDoJira = (credencial: CredencialOAuth, site: SiteJira): Entrada => ({ servico: 'jira', nome: 'Jira · ' + site.nome, instancia: new URL(site.url).origin, nuvem: site.id, credencial });

  /** Consulta o serviço até a pessoa autorizar, negar ou o prazo acabar; roda no processo principal, mesmo com a tela fechada. */
  function acompanhar(t: Tentativa) {
    const inicio = Date.now(); const intervalo = d.intervaloMs ?? 2000; const limite = d.limiteMs ?? 300_000;
    const passo = async () => {
      if (tentativa !== t || t.cancelada) return;
      try {
        dentroDaSessao(t.dono);
        if (Date.now() - inicio > limite) return terminar(t.dono, { estado: 'EXPIRADO' });
        const { estado } = await d.estado(t.id);
        if (tentativa !== t || t.cancelada) return;
        if (estado === 'PENDENTE') { t.relogio = setTimeout(passo, intervalo); t.relogio.unref?.(); return; }
        if (estado === 'PRONTO') return await concluir(t);
        terminar(t.dono, estado === 'ERRO' ? { estado: 'ERRO', mensagem: 'O provedor não concluiu a autorização. Tente novamente.' } : { estado });
      } catch (e) { if (tentativa === t) terminar(t.dono, { estado: 'ERRO', mensagem: mensagemDoErro(e) }); }
    };
    t.relogio = setTimeout(passo, Math.min(intervalo, 1500)); t.relogio.unref?.();
  }

  const publico = (dono: string): EstadoDaAutorizacao =>
    tentativa?.dono === dono ? { estado: 'AGUARDANDO' } : resultado?.dono === dono ? resultado.valor : { estado: 'INATIVO' };

  return {
    /** Um clique: abre o navegador na página do provedor. Clicar de novo durante a espera só reabre a mesma página. */
    async iniciar(servico: FormatoServicoOAuth): Promise<EstadoDaAutorizacao> {
      const dono = d.dono();
      if (tentativa?.dono === dono && tentativa.servico === servico) return publico(dono);
      encerrar(); resultado = null; pendente = null;
      let inicio: Inicio;
      try { inicio = await d.iniciar(servico); }
      catch (e) { const codigo = String((e as Error)?.message); terminar(dono, { estado: 'ERRO', mensagem: mensagemDoErro(e), ...(codigo === 'INTEGRATION_NOT_CONFIGURED' || codigo === 'IDENTITY_NOT_CONFIGURED' || codigo === 'SESSION_REQUIRED' ? { indisponivel: true } : {}) }); return publico(dono); }
      const t: Tentativa = { dono, servico, id: inicio.tentativa, instalarUrl: inicio.instalarUrl, cancelada: false };
      tentativa = t;
      if (inicio.instalarUrl) instalacao = { dono, url: inicio.instalarUrl };
      try { await d.abrir(inicio.url); } catch { terminar(dono, { estado: 'ERRO', mensagem: 'Não foi possível abrir o navegador.' }); return publico(dono); }
      acompanhar(t);
      return publico(dono);
    },
    /** `cancelar` desiste: nada é guardado e a tentativa no serviço apenas vence sozinha. */
    estado(cancelar = false): EstadoDaAutorizacao {
      const dono = d.dono();
      if (cancelar && tentativa?.dono === dono) { tentativa.cancelada = true; terminar(dono, { estado: 'CANCELADO' }); }
      if (cancelar && pendente?.dono === dono) terminar(dono, { estado: 'CANCELADO' });
      return publico(dono);
    },
    /** Página para escolher em quais repositórios o aplicativo do GitHub é instalado; só existe depois de iniciar a conexão. */
    urlDeInstalacao(): string | null { return instalacao && instalacao.dono === d.dono() ? instalacao.url : null; },
    /** Jira com mais de um site autorizado: a pessoa escolhe qual conectar; só entra id da lista que o serviço devolveu. */
    async escolherSite(id: string): Promise<EstadoDaAutorizacao> {
      const dono = d.dono();
      const p = pendente;
      if (!p || p.dono !== dono) return publico(dono);
      const site = p.sites.find(s => s.id === id);
      if (!site) throw new Error('RESOURCE_NOT_AUTHORIZED');
      const t: Tentativa = { dono, servico: 'jira', id: 'escolha', cancelada: false };
      tentativa = t;
      try { await guardar(t, entradaDoJira(p.credencial, site)); }
      catch (e) { terminar(dono, { estado: 'ERRO', mensagem: mensagemDoErro(e) }); }
      return publico(dono);
    }
  };
}
