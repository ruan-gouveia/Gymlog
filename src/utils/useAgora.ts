import { useEffect, useState } from 'react';

/** Retorna o timestamp atual, atualizado a cada `intervaloMs` enquanto `ativo`. */
export function useAgora(intervaloMs: number = 500, ativo: boolean = true): number {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (!ativo) return;
    const id = setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs, ativo]);

  return agora;
}