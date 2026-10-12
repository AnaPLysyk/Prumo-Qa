/** Reconhece quando a pessoa diz como quer ser chamada ou qual é o papel dela, e salva. */
import { salvarPerfil } from '../banco/salvarPerfil.js';
import { palavrasDaPergunta } from './palavrasDaPergunta.js';
import { papelNoTexto } from './papelNoTexto.js';
import { proximosPassosSugeridos } from './proximosPassosSugeridos.js';
import { normalizarNome } from '../regras/normalizarNome.js';
import { Meta, Turno } from '../tipos/chat.js';
import { Perfil } from '../tipos/conhecimento.js';
import { rotuloPapel } from '../tipos/persona.js';
import { semAcentos } from '../../compartilhado/texto/semAcentos.js';

export function intencaoDePerfil(pergunta: string, historico: Turno[], perfil: Perfil | null, base?: string): Meta | null {
  const t = semAcentos(pergunta); const pend = historico.at(-1)?.pendente ?? null; const palavras = palavrasDaPergunta(pergunta);
  const explicito = pergunta.match(/(?:pode me chamar de|me chame de|me chama de|meu nome [ée]|prefiro ser chamad[oa] de|quero ser chamad[oa] de)\s+([^,.!?;]+)/i);
  const papelExpl = /\b(sou|trabalho com|trabalho como|atuo como|meu papel e)\b/.test(t) ? papelNoTexto(t.replace(/.*\b(sou|trabalho com|trabalho como|atuo como|meu papel e)\b/, '')) : null;
  let nome: string | null = explicito ? normalizarNome(explicito[1]!.trim()) : null;
  if (!nome && pend === 'nome' && !pergunta.includes('?') && palavras.length <= 4 && !papelExpl) {
    if (/^(prefiro nao|tanto faz|nao precisa|pula|depois)/.test(t)) return { linhas: ['Sem problema. Se mudar de ideia, diga "pode me chamar de…".'] };
    nome = normalizarNome(pergunta.replace(/^\s*(pode ser|[ée]|eu sou|sou( o| a)?|me chama de)\s+/i, '').trim());
  }
  let papel = papelExpl; if (!papel && pend === 'papel' && palavras.length <= 5) papel = papelNoTexto(t) ?? (/\b(desenvolv|program)/.test(t) ? 'dev' : /\b(teste|qualidade)/.test(t) ? 'qa' : /\b(negocio|requisit|analis)/.test(t) ? 'analista' : null);
  if (!nome && !papel) return null;
  const linhas: string[] = []; let salvo = perfil;
  try { salvo = salvarPerfil({ ...(nome ? { comoChamar: nome } : {}), ...(papel ? { papel } : {}) }, base); } catch { return { linhas: ['Não consegui guardar isso agora no banco de conhecimento. Tente de novo em Ajustes › Assistente.'] }; }
  if (nome) linhas.push(`Combinado, ${nome}. Vou te chamar assim daqui pra frente.`);
  if (papel) linhas.push(`Anotado: você trabalha com ${rotuloPapel[papel]}. Vou ajustar a forma de explicar.`);
  if (!salvo?.papel) return { linhas: [...linhas, 'E qual é o seu papel no time: QA, desenvolvimento, produto (PO) ou análise?'], pendente: 'papel' };
  return { linhas: [...linhas, 'Por onde começamos?'], proximos: proximosPassosSugeridos('orquestrador', [], salvo.papel, '') };
}
