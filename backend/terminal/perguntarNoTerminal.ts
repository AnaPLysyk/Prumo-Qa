/** Faz uma pergunta no terminal e devolve a resposta digitada. */
import { createInterface } from 'node:readline/promises';

export async function perguntarNoTerminal(pergunta:string) {
  const rl=createInterface({input:process.stdin,output:process.stdout});
  try{return await rl.question(pergunta);}catch{return '';}finally{rl.close();}
}
