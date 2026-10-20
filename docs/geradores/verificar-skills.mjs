/** Confere o manifesto de Skills contra arquivos e políticas reais, sem executar o produto. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const raiz = fileURLToPath(new URL('../../', import.meta.url));
export function fontesSkills(base = raiz) {
  const fonte = fs.readFileSync(path.join(base, 'backend/agentes/tipos/politicas.ts'), 'utf8');
  const capacidades = new Map([...fonte.matchAll(/\{ id: '([^']+)', rotulo: '[^']+', ferramenta: (?:'[^']+'|null), editavel: \[[^\]]*\], padrao: '([^']+)'/g)].map(m => [m[1], m[2]]));
  const especializacoes = [...fonte.matchAll(/\{ id: '([^']+)', rotulo: '[^']+', skill: '([^']+)', capacidades: \[([^\]]*)\]/g)].map(m => ({ id: m[1], caminho: m[2] + '/SKILL.md', capacidades: [...m[3].matchAll(/'([^']+)'/g)].map(x => x[1]) }));
  if (especializacoes.length !== 8 || capacidades.size !== 13) throw new Error('SKILLS_POLICY_FORMAT: formato ou catálogo mudou; revise o validador.');
  return { capacidades, especializacoes };
}

export function verificarSkills(base = raiz) {
  const manifesto = JSON.parse(fs.readFileSync(path.join(base, 'backend/agentes/skills/manifesto.json'), 'utf8'));
  const { capacidades, especializacoes } = fontesSkills(base);
  const exigir = (condicao, mensagem) => { if (!condicao) throw new Error('SKILLS_MANIFEST_INVALID: ' + mensagem); };
  exigir(manifesto.schemaVersion === 1 && manifesto.skills.length === especializacoes.length, 'versão ou quantidade divergente');
  exigir(new Set(manifesto.skills.map(s => s.id)).size === manifesto.skills.length, 'identificador repetido');
  const pastas = fs.readdirSync(path.join(base, 'backend', 'agentes', 'skills'), { withFileTypes: true }).filter(e => e.isDirectory() && fs.existsSync(path.join(base, 'backend', 'agentes', 'skills', e.name, 'SKILL.md'))).map(e => 'backend/agentes/skills/' + e.name + '/SKILL.md').sort();
  exigir(JSON.stringify(pastas) === JSON.stringify(manifesto.skills.map(s => s.caminho).sort()), 'Skill sem registro ou caminho inexistente');
  for (const esperado of especializacoes) {
    const item = manifesto.skills.find(s => s.id === esperado.id);
    exigir(item && item.caminho === esperado.caminho, esperado.id + ': caminho divergente');
    exigir(item.estado === 'INSTRUCOES_DISPONIVEIS' && item.instalacaoCliente === 'OPCIONAL_NAO_COMPROVADA', esperado.id + ': estado indevido');
    const conteudo = fs.readFileSync(path.join(base, item.caminho));
    exigir(item.versao === 'sha256:' + createHash('sha256').update(conteudo).digest('hex'), esperado.id + ': conteúdo mudou; atualize versão');
    exigir(JSON.stringify(item.capacidades) === JSON.stringify(esperado.capacidades), esperado.id + ': capacidades divergentes');
    exigir(JSON.stringify(item.permissoes) === JSON.stringify(Object.fromEntries(esperado.capacidades.map(id => [id, capacidades.get(id)]))), esperado.id + ': permissões divergentes');
    exigir(JSON.stringify(item.consumidores) === JSON.stringify(['backend/agentes/chat/roteamento.ts']), esperado.id + ': consumidor divergente');
    for (const consumidor of item.consumidores) exigir(fs.existsSync(path.join(base, consumidor)), esperado.id + ': consumidor ausente');
    exigir(item.fontePoliticas === 'backend/agentes/tipos/politicas.ts', esperado.id + ': fonte divergente');
  }
  return { skills: manifesto.skills.length, estado: 'VALIDADO_ESTATICAMENTE' };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(verificarSkills())); } catch (erro) { console.error(erro.message); process.exitCode = 1; }
}
