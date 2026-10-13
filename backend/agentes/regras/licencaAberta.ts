/** Reconhece a licença de uma Skill de terceiros e diz se ela permite reaproveitar o texto com crédito (MIT, Apache-2.0, BSD, ISC, CC-BY, CC0...). */

/** Licenças abertas aceitas na importação. Fora desta lista (proprietária, "source-available", sem licença) a importação é recusada. */
const ABERTAS = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', '0BSD', 'Unlicense', 'CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0'] as const;

/** Recebe o campo license do SKILL.md e/ou o texto do arquivo LICENSE; devolve o identificador SPDX aceito ou null. */
export function licencaAberta(campo: string | null, textoDoArquivo: string | null): string | null {
  const declarado = (campo ?? '').trim().replace(/^["']|["']$/g, '');
  const direto = ABERTAS.find((l) => l.toLowerCase() === declarado.toLowerCase());
  if (direto) return direto;
  const t = `${declarado}\n${(textoDoArquivo ?? '').slice(0, 4000)}`.replace(/\s+/g, ' ');
  if (/source[- ]available|all rights reserved|proprietary/i.test(t) && !/permission is hereby granted|apache license/i.test(t)) return null;
  if (/Apache License,? Version 2\.0/i.test(t)) return 'Apache-2.0';
  if (/MIT License|Permission is hereby granted, free of charge/i.test(t)) return 'MIT';
  if (/Redistribution and use in source and binary forms/i.test(t)) return /Neither the name/i.test(t) ? 'BSD-3-Clause' : 'BSD-2-Clause';
  if (/ISC License|Permission to use, copy, modify, and\/or distribute/i.test(t)) return 'ISC';
  if (/This is free and unencumbered software released into the public domain/i.test(t)) return 'Unlicense';
  if (/CC0 1\.0|Creative Commons Zero/i.test(t)) return 'CC0-1.0';
  if (/Attribution-ShareAlike 4\.0/i.test(t)) return 'CC-BY-SA-4.0';
  if (/Attribution 4\.0 International/i.test(t)) return 'CC-BY-4.0';
  return null;
}
