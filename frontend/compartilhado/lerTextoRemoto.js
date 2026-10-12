'use strict';
/** Lê o conteúdo textual recebido de uma integração externa. */
function textoExterno(v){if(v==null)return '';if(typeof v==='string')return v;if(v.type==='text')return v.text||'';if(Array.isArray(v.content))return v.content.map(textoExterno).join('\n');return JSON.stringify(v);}
