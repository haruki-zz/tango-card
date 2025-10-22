const BLOCKED_ELEMENTS = ['script', 'foreignObject'];

export function sanitize_svg_markup(svg_markup: string): string {
  try {
    const parser = new DOMParser();
    const document_node = parser.parseFromString(svg_markup, 'image/svg+xml');
    BLOCKED_ELEMENTS.forEach((tag) => {
      document_node.querySelectorAll(tag).forEach((element) => element.remove());
    });
    const serializer = new XMLSerializer();
    return serializer.serializeToString(document_node);
  } catch {
    return '';
  }
}
