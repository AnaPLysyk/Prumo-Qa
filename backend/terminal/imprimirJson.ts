/** Mostra um valor como JSON formatado no terminal. */

export const imprimirJson=(v:unknown)=>console.log(JSON.stringify(v,null,2));
