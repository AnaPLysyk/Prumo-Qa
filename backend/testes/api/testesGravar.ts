/** Canal testes:gravar: Gravar ou criar um arquivo de teste na pasta vinculada, depois da confirmação nativa do Windows. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { escreverArquivoDeTeste } from '../regras/escreverArquivoDeTeste.js';

export const testesGravar: TratadorDoCanal<'testes:gravar'> = async (a, j) => {
  const e = obterEspaco(a.espacoId); if (!e.pastaLocal) throw new Error('PASTA_AUSENTE');
  const linhas = a.conteudo.split(/\r?\n/).length;
  const detalhe = `Pasta: ${e.pastaLocal}\nArquivo: ${a.arquivo}\n${a.hashBase === null ? `Arquivo novo com ${linhas} linha(s).` : `O conteúdo atual será substituído por ${linhas} linha(s).`}\nO Prumo só grava arquivos de teste dentro desta pasta; nada é executado nem enviado.`;
  if (!await confirmarNoWindows(j, a.hashBase === null ? 'Criar arquivo de teste' : 'Salvar arquivo de teste', `Gravar ${a.arquivo} na pasta do projeto ${e.nome}?`, detalhe, 'Salvar')) return { canceled: true };
  return escreverArquivoDeTeste(e.pastaLocal, a.arquivo, a.conteudo, a.hashBase);
};
