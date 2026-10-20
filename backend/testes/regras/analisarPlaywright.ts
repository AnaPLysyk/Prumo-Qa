/** Aponta problemas num teste Playwright (esperas fixas, seletores frágeis, falta de verificação...) com a orientação e a fonte oficial. */
import { hash } from '../../compartilhado/seguranca/hash.js';
import { blocosDeTeste } from './blocosDeTeste.js';
import { codigoSemComentarios } from './codigoSemComentarios.js';
import { seletorFragil } from './seletorFragil.js';
import { AchadoTeste, doc } from '../tipos/frameworks.js';

/** Análise estática de um arquivo de teste Playwright. Cada regra cita a fonte oficial; falsos positivos possíveis estão descritos na orientação. */
export function analisarPlaywright(arquivo: string, conteudo: string): AchadoTeste[] {
  const out: AchadoTeste[] = [];
  const linhas = codigoSemComentarios(conteudo);
  const add = (
    regra: string,
    severidade: AchadoTeste['severidade'],
    i: number,
    orientacao: string,
    fonte: string
  ) => out.push({
    regra,
    severidade,
    arquivo: arquivo.replaceAll('\\', '/'),
    linha: i + 1,
    trecho: linhas[i]!.trim().slice(0, 140),
    orientacao,
    fonte
  });
  linhas.forEach((l, i) => {
    if (/\bwaitForTimeout\s*\(/.test(l) || /new Promise\([^)]*setTimeout/.test(l)) add('PW_ESPERA_FIXA', 'medium', i, 'Espera por tempo fixo. Ações e assertions do Playwright já aguardam a condição; troque por uma assertion que repete (await expect(...)) ou por um evento observável.', `${doc}/writing-tests`);
    for (const m of l.matchAll(/\.locator\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g)) if (seletorFragil(m[2]!)) add('PW_SELETOR_FRAGIL', 'medium', i, `Seletor preso à estrutura do DOM ("${m[2]!.slice(0, 50)}"). Prefira locators por papel, rótulo, texto ou data-testid.`, `${doc}/locators#locate-by-css-or-xpath`);
    if (/\.(nth\(\s*\d+\s*\)|first\(\)|last\(\))/.test(l) && /locator|getBy/.test(l)) add('PW_SELETOR_FRAGIL', 'low', i, 'first()/last()/nth() desligam a verificação de unicidade do locator e dependem da ordem; filtre ou encadeie para identificar o elemento.', `${doc}/locators#strictness`);
    if (/\bexpect\(\s*true\s*\)|expect\(\s*(\d+)\s*\)\.toBe\(\s*\1\s*\)/.test(l) || /\)\.(toBeTruthy|toBeDefined)\(\)/.test(l) && !/\.(ok|status)\(\)/.test(l)) add('PW_ASSERTION_FRACA', 'medium', i, 'Assertion que aceita quase qualquer valor e não prova o comportamento esperado. Compare com o resultado esperado (texto, contagem, estado).', `${doc}/test-assertions`);
    if (/^\s*expect\(/.test(l) && !/\bawait\b/.test(l) && /\)\.(not\.)?(toBeVisible|toBeHidden|toHaveText|toContainText|toHaveValue|toHaveCount|toBeEnabled|toBeDisabled|toBeChecked|toHaveURL|toHaveTitle|toHaveAttribute|toBeAttached)\(/.test(l)) add('PW_ASSERTION_SEM_AWAIT', 'high', i, 'Assertion que repete sem await: o teste pode terminar antes da verificação e passar sem validar nada.', `${doc}/best-practices#use-web-first-assertions`);
    if (/expect\(\s*await\s+.*?\.(isVisible|isHidden|isChecked|isEnabled|textContent|innerText|count)\(\)\s*\)\.(toBe|toEqual|toBeTruthy|toBeFalsy)/.test(l)) add('PW_ASSERTION_NAO_REPETE', 'medium', i, 'Verificação manual: o valor é lido uma vez e não espera a página. Use a assertion que repete (toBeVisible, toHaveText, toHaveCount).', `${doc}/best-practices#dont-use-manual-assertions`);
    if (/\btest\.(skip|fixme)\s*\(|\b(?:describe|test)\.(skip|fixme)\b/.test(l) || /\bt(est)?\.skip\b/.test(l)) add('PW_TESTE_IGNORADO', 'medium', i, 'Teste ignorado: não conta como cobertura e pode esconder uma falha. Corrija, remova com justificativa ou registre o motivo e o prazo.', `${doc}/test-retries`);
    if (/\b(?:test|it|describe)\.only\s*\(/.test(l)) add('PW_TEST_ONLY', 'high', i, 'test.only faz os demais testes não rodarem. Remova antes de integrar (ou use forbidOnly no CI).', `${doc}/test-retries`);
    if (/\bforce\s*:\s*true\b/.test(l)) add('PW_FORCE', 'medium', i, 'force: true desliga verificações de actionability e pode "passar" mesmo com o elemento coberto ou inativo. Investigue o motivo em vez de forçar.', `${doc}/actionability#forcing-actions`);
    if (/\bpage\.\$\$?(eval)?\(/.test(l)) add('PW_API_LEGADA', 'low', i, 'ElementHandle ($, $$) não tem a espera e a repetição dos locators. Use page.locator()/getBy*.', `${doc}/locators`);
    if (/\btest\.describe\.serial\b|mode\s*:\s*['"]serial['"]/.test(l)) add('PW_DEPENDENCIA_ENTRE_TESTES', 'medium', i, 'Modo serial: se um teste falha, os seguintes são pulados e a retentativa roda o grupo todo. Prefira testes isolados.', `${doc}/test-retries#serial-mode`);
    if (/\bretries\s*:\s*[1-9]/.test(l)) add('PW_RETRY_ESCONDE_FALHA', 'low', i, 'Retentativas podem mascarar instabilidade. Mantenha o relatório de "flaky" visível, ative trace na primeira retentativa e investigue a causa.', `${doc}/test-retries`);
  });
  const blocos = blocosDeTeste(linhas); const corpos = new Map<string, { titulo: string; inicio: number }>();
  for (const b of blocos) {
    if (/\b(?:test|it)\.(skip|fixme)\b/.test(b.corpo.split('\n')[0]!)) continue;
    const temAssertion = /\bexpect(?:\.soft|\.poll)?\s*\(|\btoPass\b|\b(?:assert|verify|check|should|validar|verificar|conferir)\w*\s*\(/i.test(b.corpo);
    if (!temAssertion) add('PW_SEM_ASSERTION', 'medium', b.inicio - 1, `O teste "${b.titulo.slice(0, 60)}" não contém assertion nem chamada de verificação: ele só prova que nada lançou erro. Se a verificação está em função auxiliar, confirme.`, `${doc}/writing-tests`);
    if (/\b(?:request|apiContext|api)\.(get|post|put|patch|delete)\s*\(/.test(b.corpo) && !/\.(json|text|body)\(\)|toHaveProperty|toMatchObject|toEqual|toContainEqual|toStrictEqual/.test(b.corpo)) add('PW_API_SO_STATUS', 'low', b.inicio - 1, `O teste de API "${b.titulo.slice(0, 50)}" confere só o sucesso da resposta. Valide também o corpo e, quando houver gravação, o estado no servidor (consulta posterior).`, `${doc}/api-testing`);
    const norm = hash(b.corpo.replace(/^[^{]*\{/, '').replace(/\s+/g, ' ').trim()); const igual = corpos.get(norm);
    if (igual && b.corpo.replace(/\s+/g, '').length > 60) add('PW_TESTE_DUPLICADO', 'medium', b.inicio - 1, `O teste "${b.titulo.slice(0, 50)}" tem corpo idêntico ao de "${igual.titulo.slice(0, 50)}" (linha ${igual.inicio}). Consolide ou diferencie o cenário.`, `${doc}/best-practices#make-tests-as-isolated-as-possible`);
    else corpos.set(norm, { titulo: b.titulo, inicio: b.inicio });
  }
  return out.sort((a, b) => a.linha - b.linha || a.regra.localeCompare(b.regra));
}
