/** Procura segredos e dados pessoais antes de preparar um relato público. */
import { mascarar } from '../../projeto.js';

type Achado = { tipo: string; trecho: string };
/** Revisão de privacidade: BLOQUEIA segredos; apenas AVISA dados pessoais e caminhos locais (a pessoa decide). Trechos já mascarados. */
export function revisarPrivacidade(textos: Record<string, string | undefined>) {
  const bloqueios: Achado[] = []; const avisos: Achado[] = [];
  const regras: { tipo: string; re: RegExp; grave: boolean }[] = [
    { tipo: 'chave privada', re: /-----BEGIN [^-]*PRIVATE KEY-----/, grave: true },
    { tipo: 'token de acesso', re: /\b(?:gh[pousr]_[\w]{10,}|sk-[\w-]{15,}|eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}|xox[abp]-[\w-]{10,}|AKIA[0-9A-Z]{12,})\b/, grave: true },
    { tipo: 'credencial em endereço', re: /https?:\/\/[^/\s:@]+:[^/\s@]+@/, grave: true },
    { tipo: 'segredo atribuído (senha, token, chave)', re: /\b(?:password|passwd|senha|token|secret|segredo|api[_-]?key|authorization)\s*["']?\s*[:=]\s*["']?(?!\[REDACTED\])[^\s,"'}]{4,}/i, grave: true },
    { tipo: 'cabeçalho Authorization', re: /\bBearer\s+[\w.+/=-]{8,}/i, grave: true },
    { tipo: 'arquivo de segredos (.env)', re: /(^|[\s"'\\/])\.env(\.[\w.-]+)?\b/, grave: true },
    { tipo: 'e-mail', re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/, grave: false },
    { tipo: 'CPF', re: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/, grave: false },
    { tipo: 'telefone', re: /(?:\+?55\s*)?\(?\b\d{2}\)?\s*9?\d{4}[-\s]?\d{4}\b/, grave: false },
    { tipo: 'caminho local do computador', re: /\b[A-Za-z]:\\(?:Users|Usuários)\\[^\s"']+|\\\\[\w.-]+\\[\w$.-]+|\/home\/[\w.-]+\/|\/Users\/[\w.-]+\//, grave: false }
  ];
  for (const [campo, texto] of Object.entries(textos)) {
    if (!texto) continue;
    for (const r of regras) { const m = r.re.exec(texto); if (m) (r.grave ? bloqueios : avisos).push({ tipo: `${r.tipo} (${campo})`, trecho: r.grave?'[REDACTED]':mascarar(m[0]).slice(0, 60) }); }
  }
  return { bloqueios, avisos };
}

