/** Interrompe com um código de erro. */

export function falharCom(codigo:string):never { throw new Error(codigo); }
