/** Extrai o texto puro de um campo vindo do Jira/Qase/GitHub (inclusive do formato ADF), com limite, sem interpretar HTML. */

export function textoRemoto(v:unknown,limite=20000):string {
  if(v===null||v===undefined)return '';if(typeof v==='string')return v.slice(0,limite);
  if(typeof v!=='object')return String(v).slice(0,limite);
  // ADF é conteúdo, não HTML nem instrução. Apenas nós textuais conhecidos.
  const o=v as Record<string,unknown>;if(o.type==='text'&&typeof o.text==='string')return o.text.slice(0,limite);
  if(Array.isArray(o.content))return o.content.map(x=>textoRemoto(x,limite)).join(o.type==='doc'?'\n':' ').slice(0,limite);
  return JSON.stringify(v).slice(0,limite);
}
