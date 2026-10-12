/** Gera um identificador simples (letras, números e hífen) a partir do nome da pasta. */

export const idDoProjetoPeloNome = (s: string) => { const b = s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 76); return /^[a-z]/.test(b) ? b : 'p-' + (b || 'projeto'); };
