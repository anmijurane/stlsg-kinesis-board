// Priority is intentional. These are lexical approximations, not inferred sentiment.
export const COMMENT_RULES = [
  { id: "technical", label: "Problemas técnicos", pattern: "error|falla|no carga|no funciona|no abre|no reproduce|pantalla|conexi[oó]n|se traba|bug|video" },
  { id: "execution", label: "Dudas de ejecución", pattern: "c[oó]mo|t[eé]cnica|postura|ejecut|no entiendo|explic|duda|instrucci|movimiento" },
  { id: "suggestion", label: "Sugerencias", pattern: "sugier|suger|podr[ií]an|deber[ií]an|agregar|a[ñn]adir|mejorar|me gustar[ií]a|propongo" },
] as const;
export function classifyComment(comment: string): string {
  return COMMENT_RULES.find((rule) => new RegExp(rule.pattern, "i").test(comment))?.id ?? "other";
}
