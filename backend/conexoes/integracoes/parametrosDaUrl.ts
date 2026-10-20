/** Monta os parâmetros de consulta de uma URL, ignorando os vazios. */

export const parametrosDaUrl=(p:Record<string,string|number|undefined>)=>new URLSearchParams(Object.entries(p).filter(([,v])=>v!==undefined).map(([k,v])=>[k,String(v)])).toString();
