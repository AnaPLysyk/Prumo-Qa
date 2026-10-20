/** Verifica imports locais pelo parser TypeScript e gera um grafo verificável antes de reorganizações. */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

export function verificarDependencias(raiz) {
  const config = ts.readConfigFile(path.join(raiz, 'tsconfig.json'), ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, raiz);
  const arestas = []; const problemas = [];
  const relativo = (arquivo) => path.relative(raiz, arquivo).split(path.sep).join('/');
  for (const arquivo of parsed.fileNames.sort()) {
    const fonte = ts.createSourceFile(arquivo, fs.readFileSync(arquivo, 'utf8'), ts.ScriptTarget.Latest, true);
    const conferir = (no) => {
      let literal;
      if (ts.isImportDeclaration(no) || ts.isExportDeclaration(no)) literal = no.moduleSpecifier;
      else if (ts.isCallExpression(no) && no.expression.kind === ts.SyntaxKind.ImportKeyword) literal = no.arguments[0];
      if (literal && ts.isStringLiteral(literal) && literal.text.startsWith('.')) {
        const resolvido = ts.resolveModuleName(literal.text, arquivo, parsed.options, ts.sys).resolvedModule;
        const linha = fonte.getLineAndCharacterOfPosition(literal.getStart(fonte)).line + 1;
        if (!resolvido) problemas.push({ arquivo: relativo(arquivo), linha, import: literal.text });
        else arestas.push({ origem: relativo(arquivo), destino: relativo(resolvido.resolvedFileName), linha });
      }
      ts.forEachChild(no, conferir);
    };
    conferir(fonte);
  }
  return { schemaVersion: 1, arquivos: parsed.fileNames.length, arestas, problemas };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const resultado = verificarDependencias(raiz);
  if (process.argv.includes('--json')) console.log(JSON.stringify(resultado, null, 2));
  else {
    for (const problema of resultado.problemas) console.error(`${problema.arquivo}:${problema.linha}: import ausente ${problema.import}`);
    console.log(`${resultado.arquivos} fontes, ${resultado.arestas.length} dependências locais, ${resultado.problemas.length} imports ausentes.`);
  }
  if (resultado.problemas.length) process.exitCode = 1;
}
