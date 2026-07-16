import "server-only";
import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "blockquote",
];

export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: [] });
}

export function isRichTextEmpty(html: string): boolean {
  return sanitizeRichText(html).replace(/<[^>]*>/g, "").trim().length === 0;
}

// resumo em texto puro (ex.: pré-visualização em listas), aceita tanto o HTML
// gerado pelo editor quanto texto simples de histórias criadas antes dele existir
export function toPlainTextExcerpt(content: string): string {
  if (!content.trim().startsWith("<")) return content;
  return sanitizeRichText(content)
    .replace(/<\/(p|li|h2|h3|blockquote)>/g, "$& ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
