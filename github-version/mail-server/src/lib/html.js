// Good enough for snippets and list rows: not a renderer.
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };
// A line break wherever a block starts or ends, or where <br> sits.
const BLOCK_TAG = /<(?:br\s*\/?|\/?(?:p|div|li|ul|ol|h[1-6]|tr|blockquote|pre)\b)[^>]*>/gi;

export function htmlToPlainText(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(BLOCK_TAG, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (match, name) => ENTITIES[name])
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}
