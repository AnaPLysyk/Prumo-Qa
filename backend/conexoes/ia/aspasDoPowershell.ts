/** Coloca um texto entre aspas simples do PowerShell. */

export const aspasDoPowershell=(s:string)=>"'"+s.replaceAll("'","''")+"'";
