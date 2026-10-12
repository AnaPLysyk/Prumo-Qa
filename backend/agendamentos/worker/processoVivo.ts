/** Diz se um processo do Windows ainda está rodando. */

export const processoVivo = (pid: number) => { try { process.kill(pid, 0); return true; } catch (e) { return (e as NodeJS.ErrnoException).code === 'EPERM'; } };
