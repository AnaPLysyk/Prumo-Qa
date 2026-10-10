import fs from 'node:fs';
import path from 'node:path';
import { diretorioDados } from './atividades.js';
import { listarVinculos } from './vinculos.js';

/**
 * Transparência sobre os dados locais. Só mede tamanhos; não lê conteúdo e não segue links simbólicos.
 * A exclusão de cada categoria vive no módulo dono do formato (atividades, evidencias, diagnostico).
 */
export const politicaRetencao = 'Sem retenção automática: nada é apagado ou arquivado sozinho. Você decide quando excluir.';
export const naoTransmitido = [
  'Histórico, métricas, logs e evidências não são enviados ao desenvolvedor nem a qualquer servidor do Prumo.',
  'Lista de projetos e caminhos locais ficam somente neste computador.',
  'A janela não faz requisições de rede; a única consulta externa é a verificação de atualização que você aciona.'
];
export const limitesPrivacidade = [
  'O que o servidor MCP devolve a um cliente de IA (contexto autorizado, análises, evidências) passa a ser tratado por esse cliente e por seu provedor, conforme as políticas deles.',
  'O Prumo não recebe as conversas, o raciocínio nem os prompts do cliente de IA; só vê as chamadas que chegam às suas quatro ferramentas.',
  'Metadados do histórico (identificadores, contagens, estados, horários) podem revelar informações sobre o projeto se forem exportados.'
];
const categorias: Record<string, string> = { projects: 'historico', diagnostico: 'diagnostico', demonstracao: 'demonstracao', app: 'aplicativo', 'vinculos.json': 'vinculos' };

function medir(dir: string, limite = { n: 0 }): { bytes: number; arquivos: number; truncado: boolean } {
  let bytes = 0, arquivos = 0, truncado = false;
  let itens: fs.Dirent[]; try { itens = fs.readdirSync(dir, { withFileTypes: true }); } catch { return { bytes, arquivos, truncado }; }
  for (const i of itens) {
    if (++limite.n > 50000) return { bytes, arquivos, truncado: true };
    const alvo = path.join(dir, i.name);
    if (i.isSymbolicLink()) continue;
    if (i.isDirectory()) { const r = medir(alvo, limite); bytes += r.bytes; arquivos += r.arquivos; truncado ||= r.truncado; }
    else if (i.isFile()) { try { bytes += fs.statSync(alvo).size; arquivos++; } catch { /* arquivo sumiu: ignora */ } }
  }
  return { bytes, arquivos, truncado };
}
export async function resumirDados(base?: string) {
  const dir = diretorioDados(base); const por: Record<string, { bytes: number; files: number }> = {};
  let total = 0, truncado = false;
  let itens: fs.Dirent[] = []; try { itens = fs.readdirSync(dir, { withFileTypes: true }); } catch { /* ainda sem dados */ }
  for (const i of itens) {
    if (i.isSymbolicLink()) continue;
    const alvo = path.join(dir, i.name); const cat = categorias[i.name] ?? 'outros';
    const r = i.isDirectory() ? medir(alvo) : { bytes: (() => { try { return fs.statSync(alvo).size; } catch { return 0; } })(), arquivos: 1, truncado: false };
    por[cat] = { bytes: (por[cat]?.bytes ?? 0) + r.bytes, files: (por[cat]?.files ?? 0) + r.arquivos }; total += r.bytes; truncado ||= r.truncado;
  }
  return { directory: dir, linkedProjects: (await listarVinculos(base)).length, totalBytes: total, truncated: truncado, categories: por,
    evidenceNote: 'Evidências de execução ficam em <projeto>\\.prumo\\evidencias, dentro de cada projeto vinculado, e não entram neste total.',
    retention: politicaRetencao, notTransmitted: naoTransmitido, privacyLimits: limitesPrivacidade };
}
