/** Diz se um seletor de tela é frágil (XPath, nth-child, classes geradas, cadeias de div). */

export const seletorFragil = (s: string) => /^\s*(\/\/|xpath=|\.\.\/)/.test(s) || /:nth-(child|of-type)\(/.test(s) || /\.(css|sc|jss|MuiBox)-[A-Za-z0-9]{4,}/.test(s) || /^(body|html)\s*>/.test(s) || /(?:^|\s)(?:div|span|ul|li|tr|td|section)\s*(?:>|\s)\s*(?:div|span|ul|li|tr|td|section)\s*(?:>|\s)\s*(?:div|span|ul|li|tr|td|section)/.test(s);
