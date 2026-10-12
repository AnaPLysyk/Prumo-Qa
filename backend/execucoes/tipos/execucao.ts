/** Autorização delegada (2.8): reconhece um consentimento humano prévio, restrito ao escopo exato. */

/** Autorização delegada (2.8): reconhece um consentimento humano prévio, restrito ao escopo exato. Nunca cria aprovação. */
export type Delegada=(escopo:{scopeHash:string;capability:string;command:string})=>Promise<{subject:string;method:string;scopeHash:string;at:string}|null>;
