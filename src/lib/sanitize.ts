import sanitizeHtml from "sanitize-html";

export function sanitizeMaterialHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "h2", "h3", "strong", "em", "s", "u", "ul", "ol", "li",
      "a", "img", "br", "blockquote", "code", "pre", "hr",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}
