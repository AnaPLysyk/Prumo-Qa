/**
 * Aparência dos e-mails do Prumo: a mesma da tela de entrada — fundo noturno com o robô do Orchestrator,
 * um único cartão claro com a marca, título, botão azul ou código, e o rodapé com o site.
 * E-mail não aceita variáveis CSS: as cores repetem os tokens de frontend/design-system (o teste confere).
 */
export const SITE = 'https://prumo-qa-docs.onrender.com';
export const CORES = { noite: '#060b18', noiteSuave: '#9aa8c2', noiteAcento: '#6ea8ff', painel: '#ffffff', linha: '#cfd9ea', texto: '#14233d', suave: '#465875', acento: '#1f56b8', acentoTexto: '#ffffff' };
const FONTE = "Inter,'Segoe UI',system-ui,-apple-system,Roboto,Arial,sans-serif";
const esc = (v) => String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const RODAPE = {
  'pt-BR': { lema: 'Do ticket à evidência.', site: 'Site e documentação', copiar: 'Se o botão não abrir, copie este endereço no navegador:' },
  en: { lema: 'From ticket to evidence.', site: 'Website and docs', copiar: 'If the button does not open, copy this address into your browser:' }
};

/** Monta o e-mail em HTML e em texto puro. Todo valor variável é escapado; `acao.url` precisa ser HTTPS. */
export function montarEmail({ idioma = 'pt-BR', chip, titulo, saudacao = '', texto, acao = null, codigo = null, observacao = '' }) {
  if (acao && !/^https:\/\//.test(acao.url)) throw new Error('EMAIL_LINK_INVALID');
  const r = RODAPE[idioma] ?? RODAPE['pt-BR'];
  const c = CORES;
  const paragrafo = (conteudo, extra = '') => `<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:${c.suave};${extra}">${conteudo}</p>`;
  const botao = acao ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px"><tr><td style="border-radius:10px;background:${c.acento}"><a href="${esc(acao.url)}" style="display:inline-block;padding:12px 22px;font-family:${FONTE};font-size:15px;font-weight:600;color:${c.acentoTexto};text-decoration:none;border-radius:10px">${esc(acao.rotulo)}</a></td></tr></table>` : '';
  const caixaDoCodigo = codigo ? `<div style="margin:8px 0 20px;padding:14px 12px 14px calc(12px + .3em);border:1px dashed ${c.acento};border-radius:10px;text-align:center;font-family:Consolas,'SFMono-Regular',Menlo,monospace;font-size:30px;font-weight:700;letter-spacing:.3em;color:${c.texto}">${esc(codigo)}</div>` : '';
  const enderecoDoBotao = acao ? `<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid ${c.linha};font-size:12px;line-height:1.5;color:${c.suave}">${esc(r.copiar)}<br><a href="${esc(acao.url)}" style="color:${c.acento};word-break:break-all">${esc(acao.url)}</a></p>` : '';

  const html = `<!doctype html><html lang="${esc(idioma)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(titulo)}</title></head>
<body style="margin:0;padding:0;background:${c.noite}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(texto)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.noite};background-image:radial-gradient(60rem 36rem at 85% -8%,rgba(37,99,235,.16),transparent 62%)"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;font-family:${FONTE}">
<tr><td align="center" style="padding-bottom:12px"><img src="${SITE}/agente.png" width="150" height="150" alt="" style="display:block;border:0"></td></tr>
<tr><td style="padding:32px;background:${c.painel};border:1px solid ${c.linha};border-radius:16px;color:${c.texto}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="36" style="vertical-align:middle"><img src="${SITE}/prumo.png" width="28" height="28" alt="" style="display:block;border:0;border-radius:50%"></td>
<td style="vertical-align:middle;font-size:16px;font-weight:700;color:${c.texto}">Prumo QA</td>
<td align="right" style="vertical-align:middle"><span style="display:inline-block;padding:3px 8px;border:1px solid ${c.linha};border-radius:999px;font-size:11px;font-weight:500;color:${c.suave};white-space:nowrap">${esc(chip)}</span></td>
</tr></table>
<h1 style="margin:20px 0 12px;font-size:20px;line-height:1.3;color:${c.texto}">${esc(titulo)}</h1>
${saudacao ? paragrafo(esc(saudacao), `color:${c.texto}`) : ''}${paragrafo(esc(texto))}${botao}${caixaDoCodigo}${observacao ? paragrafo(esc(observacao), 'margin:0;font-size:13px') : ''}${enderecoDoBotao}
</td></tr>
<tr><td align="center" style="padding:20px 8px 0;font-size:12px;line-height:1.6;color:${c.noiteSuave}">${esc(r.lema)} · <a href="${SITE}" style="color:${c.noiteAcento};text-decoration:none">${esc(r.site)}</a></td></tr>
</table></td></tr></table></body></html>`;

  const textoPuro = [titulo, saudacao, texto, acao ? acao.rotulo + ': ' + acao.url : '', codigo ?? '', observacao, 'Prumo QA — ' + r.lema + ' ' + SITE]
    .filter(Boolean).join('\n\n');
  return { html, texto: textoPuro };
}
