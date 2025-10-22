import { sanitize_svg_markup } from '../utils/svg_sanitizer';

export interface SvgRenderOptions {
  readonly container_width: number;
  readonly container_height: number;
}

export function prepare_svg_markup(svg_source: string, options: SvgRenderOptions): string {
  const sanitized = sanitize_svg_markup(svg_source);
  if (!sanitized) {
    return '';
  }

  const parser = new DOMParser();
  const document_node = parser.parseFromString(sanitized, 'image/svg+xml');
  const svg_element = document_node.documentElement;

  svg_element.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg_element.setAttribute('width', `${options.container_width}`);
  svg_element.setAttribute('height', `${options.container_height}`);

  const serializer = new XMLSerializer();
  return serializer.serializeToString(svg_element);
}
