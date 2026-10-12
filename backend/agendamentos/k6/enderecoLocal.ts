/** Diz se um endereço é deste próprio computador (localhost, 127.x, ::1). */

export const enderecoLocal = (h: string) => h === 'localhost' || h === '::1' || h === '[::1]' || /^127\./.test(h);
