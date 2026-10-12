/** Nome da vista do banco que mostra os conhecimentos de um agente (agente_<id>). */

export const vistaDoAgente = (id: string) => 'agente_' + id.replace(/-/g, '_');
