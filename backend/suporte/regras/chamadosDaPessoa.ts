/** Chamados da pessoa da sessão: enviar pelo serviço do Prumo (sem GitHub) e acompanhar estado e respostas. */
// Chamados da pessoa da sessão: enviar pelo serviço do Prumo (sem precisar de GitHub) e acompanhar estado e respostas. O relato passa pela mesma revisão de privacidade de sempre (algo que parece senha ou token bloqueia o envio). Vão o nome e o e-mail da conta, para a equipe responder, e só o que a pessoa marcou (versão, sistema, diagnóstico). Cada pessoa vê só os próprios chamados.
import os from 'node:os';
import { anexosDoEnvio, esquecerAnexos } from './anexosDoChamado.js';
import { prepararRelato } from '../servicoRelato.js';
import { resumoDoDiagnosticoParaRelato } from './resumoDoDiagnosticoParaRelato.js';
import { lerMeusChamados, gravarMeusChamados } from '../repositorio.js';
import { servicoDeChamados } from '../integracoes.js';
import { solicitacaoSchema } from '../contratos.js';
import type { Protetor } from '../../conexoes/tipos/credenciais.js';
import type { Usuario } from '../../login/tipos/contas.js';

type Dependencias = { usuario: Pick<Usuario, 'id' | 'nome' | 'email'>; protetor: Protetor; versao: string; base?: string; servico?: typeof servicoDeChamados; agora?: () => Date };

export async function enviarChamado(a: { relato: unknown; anexos: string[] }, d: Dependencias) {
  const s = solicitacaoSchema.parse(a.relato); const diagnostico = s.incluirDiagnostico ? resumoDoDiagnosticoParaRelato() : undefined;
  const versao = d.versao; const revisado = prepararRelato(s, { versao, diagnostico });
  if (!revisado.ok) throw new Error('SUPPORT_BLOCKED_SECRET: o relato contém algo que parece segredo ou está incompleto; revise antes de enviar.');
  const anexos = anexosDoEnvio(a.anexos, d.usuario.id); const servico = d.servico ?? servicoDeChamados;
  const { numero, chave } = await servico.abrir({
    categoria: s.categoria, titulo: s.titulo, descricao: s.descricao, ...(s.passos ? { passos: s.passos } : {}), ...(s.esperado ? { esperado: s.esperado } : {}),
    ...(s.incluirVersao ? { versao } : {}), ...(s.incluirSistema ? { sistema: `${os.platform()} ${os.release()} (${os.arch()})` } : {}), ...(diagnostico ? { diagnostico } : {}),
    contato: { nome: d.usuario.nome, ...(d.usuario.email ? { email: d.usuario.email } : {}) }, anexos: anexos.map((x) => ({ nome: x.nome, tipo: x.tipo, tamanho: x.bytes.length }))
  });
  // Os anexos vão um por vez, depois do chamado; falha num anexo não desfaz o chamado e aparece para a pessoa.
  const comFalha: string[] = [];
  for (const [i, x] of anexos.entries()) { try { await servico.anexar(numero, i, chave, x.tipo, x.bytes); } catch { comFalha.push(x.nome); } }
  esquecerAnexos(anexos.map((x) => x.id));
  const r = lerMeusChamados(d.base); const guardavel = d.protetor.disponivel();
  r.chamados.push({ usuarioId: d.usuario.id, numero, titulo: s.titulo, categoria: s.categoria, criadoEm: (d.agora?.() ?? new Date()).toISOString(), chave: guardavel ? d.protetor.proteger(chave).toString('base64') : null });
  gravarMeusChamados(r, d.base);
  return { numero, anexosEnviados: anexos.length - comFalha.length, anexosComFalha: comFalha, acompanhamento: guardavel };
}

const chaveDe = (c: { chave: string | null }, protetor: Protetor) => { if (!c.chave || !protetor.disponivel()) return null; try { return protetor.abrir(Buffer.from(c.chave, 'base64')); } catch { return null; } };

/** Os chamados desta pessoa (mais novos primeiro), com o estado atual consultado no serviço; sem resposta do serviço, estado null. */
export async function meusChamados(d: Omit<Dependencias, 'agora' | 'versao'>) {
  const servico = d.servico ?? servicoDeChamados;
  const meus = lerMeusChamados(d.base).chamados.filter((c) => c.usuarioId === d.usuario.id).sort((x, y) => y.criadoEm.localeCompare(x.criadoEm)).slice(0, 30);
  return Promise.all(meus.map(async (c) => {
    const chave = chaveDe(c, d.protetor); let atual: Awaited<ReturnType<typeof servico.acompanhar>> | null = null;
    if (chave) { try { atual = await servico.acompanhar(c.numero, chave); } catch { atual = null; } }
    return { numero: c.numero, titulo: c.titulo, categoria: c.categoria, criadoEm: c.criadoEm, estado: atual?.estado ?? null, atualizadoEm: atual?.atualizadoEm ?? null, respostas: atual?.respostas.length ?? 0, acompanhamento: !!chave };
  }));
}

/** Um chamado desta pessoa com as respostas da equipe. Número de outra pessoa responde como inexistente. */
export async function meuChamado(numero: number, d: Omit<Dependencias, 'agora' | 'versao'>) {
  const c = lerMeusChamados(d.base).chamados.find((x) => x.numero === numero && x.usuarioId === d.usuario.id);
  if (!c) throw new Error('TICKET_NOT_FOUND: chamado não encontrado.');
  const chave = chaveDe(c, d.protetor); if (!chave) throw new Error('SUPPORT_TRACKING_UNAVAILABLE: a chave de acompanhamento deste chamado não está disponível neste computador.');
  return (d.servico ?? servicoDeChamados).acompanhar(numero, chave);
}
