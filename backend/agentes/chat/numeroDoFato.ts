/** Lê um número dos fatos coletados (ex.: falhas=3). */

export const numeroDoFato = (fatos: string[], k: string) => Number(fatos.find((f) => f.startsWith(k + '='))?.split('=')[1] ?? NaN);
