/** Confere a conta ativa, a autorização e o vínculo do projeto antes das chamadas MCP. */
import net from "node:net";
import { z } from "zod";
import { diretorioBase } from "../../compartilhado/banco/diretorioDados.js";
import { lerLocal } from "../../compartilhado/banco/persistenciaLocal.js";
import { lerContas } from "../../login/repositorioContas.js";
import { loginLigado, nivelDaConta, papelDaConta } from "../../login/regras/sessao.js";
import { ErroQa } from "../../compartilhado/erros.js";
import { carregarProjeto } from "../../compartilhado/projeto/carregarProjeto.js";
import { Projeto } from "../../compartilhado/tipos/projeto.js";

const autorizacao = z.object({
  versao: z.literal(1),
  endereco: z.string().min(10).max(230),
  chave: z.string().regex(/^[a-f0-9]{64}$/),
}).strict().nullable();

const usuarioValido = /^[a-f0-9-]{36}$/i;

/** O nível de acesso da conta também vale fora da janela. */
export function conferirAcessoMcp(usuarioId: string | null, capacidade = 'consultar_contexto') {
  if (!usuarioId) return; // Sem contas, somente o escopo vazio legado pode ser consultado.
  const registro = lerContas();
  const conta = registro.usuarios.find(u => u.id === usuarioId && u.estado === 'ATIVO');
  if (!conta) throw new Error('MCP_SESSION_REQUIRED');
  const papel = papelDaConta(registro, conta);
  const tela = capacidade === 'propor_bugs' ? 'tickets'
    : ['executar_testes', 'propor_casos', 'revisar_cobertura', 'consultar_evidencias'].includes(capacidade) ? 'testes' : 'agentes';
  const nivel = nivelDaConta(conta, papel, tela);
  const alterar = ['executar_testes', 'propor_casos', 'propor_bugs', 'propor_aprendizado'].includes(capacidade);
  if (nivel === 'NENHUM' || (alterar && nivel !== 'USAR')) throw new Error('PERMISSION_DENIED');
}

export async function contaAutorizadaMcp(): Promise<string | null> {
  let dados: z.infer<typeof autorizacao>;
  try { dados = lerLocal('mcp-sessao.json', autorizacao, null, diretorioBase()); }
  catch { throw new Error('MCP_SESSION_REQUIRED'); }

  if (!dados) {
    // Compatibilidade com projetos locais que nunca tiveram conta; não lê dados de outra pessoa.
    if (loginLigado(lerContas())) throw new Error('MCP_SESSION_REQUIRED');
    return null;
  }
  const enderecoValido = process.platform === 'win32'
    ? /^\\\\\.\\pipe\\prumo-mcp-[a-f0-9]{32}$/.test(dados.endereco)
    : /^\/[^\0]+\/prumo-mcp-[a-f0-9]{32}\.sock$/.test(dados.endereco);
  if (!enderecoValido) throw new Error('MCP_SESSION_REQUIRED');

  return new Promise<string>((resolve, reject) => {
    const socket = net.createConnection(dados.endereco);
    let recebido = '';
    const recusar = () => { socket.destroy(); reject(new Error('MCP_SESSION_REQUIRED')); };
    socket.setEncoding('utf8');
    socket.setTimeout(2500, recusar);
    socket.on('connect', () => socket.write(JSON.stringify({ chave: dados.chave }) + '\n'));
    socket.on('data', parte => {
      recebido += parte;
      if (recebido.length > 256) return recusar();
      const fim = recebido.indexOf('\n');
      if (fim < 0) return;
      try {
        const resposta = JSON.parse(recebido.slice(0, fim));
        if (typeof resposta?.usuarioId !== 'string' || !usuarioValido.test(resposta.usuarioId)) return recusar();
        socket.end();
        resolve(resposta.usuarioId);
      } catch { recusar(); }
    });
    socket.on('error', recusar);
    socket.on('end', () => { if (!recebido.includes('\n')) recusar(); });
  });
}

export async function projetoAindaVinculado(raiz: string, vinculo: Projeto, contratoLeitura?: string) {
  const atual = await carregarProjeto(raiz, contratoLeitura);
  if (atual.manifesto.id !== vinculo.manifesto.id) throw new ErroQa('PROJECT_BINDING_CHANGED', 'Identidade do projeto mudou; reinicie o servidor para vincular o novo histórico.');
  return atual;
}
