/** Reúne tudo o que a tela Conexões faz com Jira, Qase e GitHub: adicionar e validar conta, listar recursos, vincular, consultar e escrever com a credencial protegida. */
import { z } from 'zod';
import { cofreCredenciais } from '../banco/cofreCredenciais.js';
import { listarContas } from '../banco/listarContas.js';
import { enviarAoServico } from '../integracoes/enviarAoServico.js';
import { lerDoServico } from '../integracoes/lerDoServico.js';
import { ContextoServico, OperacaoServico } from '../tipos/adaptador.js';
import { ContextoDosServicos, conexaoEntrada } from '../tipos/contaDeServico.js';
import { Protetor } from '../tipos/credenciais.js';
import { Filtros } from '../tipos/leituras.js';
import { TransporteEscrita, TransporteServico, paginaSchema } from '../tipos/transporte.js';
import { Recurso, Servico } from '../../projetos/tipos/espacos.js';
import { adicionarConta } from './adicionarConta.js';
import { importarProjetosQase } from './importarProjetosQase.js';
import { comentarNoJira } from './comentarNoJira.js';
import { consultarServico } from './consultarServico.js';
import { escolherCampoAceite } from './escolherCampoAceite.js';
import { executarComServico } from './executarComServico.js';
import { listarRecursosDaConta } from './listarRecursosDaConta.js';
import { procurarComentarioNoJira } from './procurarComentarioNoJira.js';
import { removerConta } from './removerConta.js';
import { validarConta } from './validarConta.js';
import { validarVinculoDoServico } from './validarVinculoDoServico.js';
import { vincularRecursoAoEspaco } from './vincularRecursoAoEspaco.js';

/** Dependências só do processo principal. Testes fornecem doubles; nenhum toggle em produção. Cada ação fica no seu arquivo. */
export function nucleoServicos(protetor: Protetor, transporte: TransporteServico = lerDoServico, base?: string, escrita: TransporteEscrita = enviarAoServico) {
  const c: ContextoDosServicos = { protetor, transporte, escrita, base, cofre: cofreCredenciais(protetor, base) };
  const importacaoQase = importarProjetosQase(c);
  return {
    contas: () => listarContas(base),
    qasePrever: (token: string) => importacaoQase.prever(token),
    qasePreverConta: (conexaoId: string) => importacaoQase.preverConta(conexaoId),
    qaseImportar: (previaId: string, codigos: string[]) => importacaoQase.importar(previaId, codigos),
    qaseCancelar: (previaId: string) => importacaoQase.cancelar(previaId),
    adicionar: (entrada: z.input<typeof conexaoEntrada>) => adicionarConta(c, entrada),
    validarConta: (id: string) => validarConta(c, id),
    removerConta: (id: string) => removerConta(c, id),
    listar: (id: string, pagina: z.input<typeof paginaSchema> = {}) => listarRecursosDaConta(c, id, pagina),
    vincular: (espacoId: string, conexaoId: string, recurso: Recurso) => vincularRecursoAoEspaco(c, espacoId, conexaoId, recurso),
    validarVinculo: (espacoId: string, servico: Servico) => validarVinculoDoServico(c, espacoId, servico),
    consultar: (espacoId: string, servico: Servico, operacao: OperacaoServico, pagina: z.input<typeof paginaSchema> = {}, id?: string, filtros?: Filtros) => consultarServico(c, espacoId, servico, operacao, pagina, id, filtros),
    comContexto: <T>(espacoId: string, servico: Servico, fn: (ctx: ContextoServico, recurso: Recurso, info: { vinculoId: string; conexaoId: string }) => Promise<T>) => executarComServico(c, espacoId, servico, fn),
    comentarJira: (espacoId: string, ticket: string, adf: unknown) => comentarNoJira(c, espacoId, ticket, adf),
    procurarComentarioJira: (espacoId: string, ticket: string, marcador: string) => procurarComentarioNoJira(c, espacoId, ticket, marcador),
    campoAceite: (espacoId: string, campo: string) => escolherCampoAceite(c, espacoId, campo),
  };
}
