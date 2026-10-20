/** Formato da autorização delegada: reconhece um consentimento humano prévio, restrito ao escopo exato. */

/** Devolve quem aprovou, como e quando, ou null se não houver autorização vigente; nunca cria aprovação. */
export type Delegada=(escopo:{scopeHash:string;capability:string;command:string})=>Promise<{subject:string;method:string;scopeHash:string;at:string}|null>;
