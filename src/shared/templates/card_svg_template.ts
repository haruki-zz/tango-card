export interface CardTemplateInput {
  readonly word: string;
  readonly reading: string;
  readonly context: string;
  readonly scene: string;
  readonly example: string;
}

const CARD_WIDTH = 390;
const CARD_HEIGHT = 844;
const CONTENT_PADDING = 32;
const HEADER_BOTTOM = 200;
const TITLE_GAP = 22;
const SECTION_GAP = 32;
const CONTEXT_BOX_HEIGHT = 150;
const SCENE_BOX_HEIGHT = 140;
const EXAMPLE_BOX_HEIGHT = 150;
const BASE_FONT_SIZE = 24;
const MIN_FONT_SIZE = 12;
const LINE_HEIGHT_RATIO = 1.35;
const TITLE_FONT_SCALE = 1.1;
const TITLE_FONT_STEP = 2;
const TITLE_FONT_MAX = 32;

export function render_card_svg(input: CardTemplateInput): string {
  const word = sanitize_text(input.word);
  const reading = sanitize_text(input.reading);
  const context_layout = layout_section(input.context, {
    box_height: CONTEXT_BOX_HEIGHT,
    base_font_size: BASE_FONT_SIZE,
    min_font_size: MIN_FONT_SIZE,
    wrap_width: CARD_WIDTH - CONTENT_PADDING * 2,
  });
  const scene_layout = layout_section(input.scene, {
    box_height: SCENE_BOX_HEIGHT,
    base_font_size: BASE_FONT_SIZE,
    min_font_size: MIN_FONT_SIZE,
    wrap_width: CARD_WIDTH - CONTENT_PADDING * 2,
  });
  const example_layout = layout_section(input.example, {
    box_height: EXAMPLE_BOX_HEIGHT,
    base_font_size: BASE_FONT_SIZE,
    min_font_size: MIN_FONT_SIZE,
    wrap_width: CARD_WIDTH - CONTENT_PADDING * 2,
  });

  const context_title_y = HEADER_BOTTOM + SECTION_GAP;
  const context_body_y = context_title_y + TITLE_GAP;
  const context_block_height = context_layout.line_height * Math.max(1, context_layout.lines.length);
  const context_title_font_size = compute_title_font_size(context_layout.font_size);

  const scene_title_y = context_body_y + context_block_height + SECTION_GAP;
  const scene_body_y = scene_title_y + TITLE_GAP;
  const scene_block_height = scene_layout.line_height * Math.max(1, scene_layout.lines.length);
  const scene_title_font_size = compute_title_font_size(scene_layout.font_size);

  let example_title_y = scene_body_y + scene_block_height + SECTION_GAP;
  let example_body_y = example_title_y + TITLE_GAP;
  const example_block_height = example_layout.line_height * Math.max(1, example_layout.lines.length);
  const example_title_font_size = compute_title_font_size(example_layout.font_size);

  const max_content_bottom = CARD_HEIGHT - CONTENT_PADDING;
  const overflow = Math.max(0, example_body_y + example_block_height - max_content_bottom);
  if (overflow > 0) {
    const minimum_example_title_y = scene_body_y + scene_block_height + SECTION_GAP;
    example_title_y = Math.max(minimum_example_title_y, example_title_y - overflow);
    example_body_y = example_title_y + TITLE_GAP;
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" preserveAspectRatio="xMidYMid meet">`,
    '<style>',
    '* { font-family: "游明朝", "Yu Mincho", "YuMincho", serif; }',
    '.card-bg { fill: #0f172a; }',
    '.word { fill: #f8fafc; font-size: 52px; font-weight: 700; }',
    '.reading { fill: #94a3b8; font-size: 28px; font-weight: 500; }',
    '.section-title { fill: #38bdf8; letter-spacing: 0.08em; font-weight: 600; }',
    '.section-body { fill: #e2e8f0; }',
    '</style>',
    `<rect class="card-bg" x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="18"/>`,
    `<text class="word" x="${CONTENT_PADDING}" y="148">${word}</text>`,
    `<text class="reading" x="${CONTENT_PADDING}" y="196">${reading}</text>`,
    `<text class="section-title" x="${CONTENT_PADDING}" y="${context_title_y}" style="font-size:${context_title_font_size}px">Context</text>`,
    `<text class="section-body" x="${CONTENT_PADDING}" y="${context_body_y}" style="font-size:${context_layout.font_size}px">${create_tspans(context_layout.lines, CONTENT_PADDING, context_layout.line_height)}</text>`,
    `<text class="section-title" x="${CONTENT_PADDING}" y="${scene_title_y}" style="font-size:${scene_title_font_size}px">Scene</text>`,
    `<text class="section-body" x="${CONTENT_PADDING}" y="${scene_body_y}" style="font-size:${scene_layout.font_size}px">${create_tspans(scene_layout.lines, CONTENT_PADDING, scene_layout.line_height)}</text>`,
    `<text class="section-title" x="${CONTENT_PADDING}" y="${example_title_y}" style="font-size:${example_title_font_size}px">Example</text>`,
    `<text class="section-body" x="${CONTENT_PADDING}" y="${example_body_y}" style="font-size:${example_layout.font_size}px">${create_tspans(example_layout.lines, CONTENT_PADDING, example_layout.line_height)}</text>`,
    '</svg>',
  ]
    .filter(Boolean)
    .join('');
}

function create_tspans(lines: string[], padding: number, line_height: number): string {
  return lines
    .map((line, index) => {
      const dy = index === 0 ? '0' : line_height;
      return `<tspan x="${padding}" dy="${dy}">${sanitize_text(line)}</tspan>`;
    })
    .join('');
}

interface SectionLayoutOptions {
  readonly box_height: number;
  readonly base_font_size: number;
  readonly min_font_size: number;
  readonly wrap_width: number;
}

function layout_section(
  content: string,
  options: SectionLayoutOptions,
): { lines: string[]; font_size: number; line_height: number } {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    const line_height = Math.round(options.base_font_size * LINE_HEIGHT_RATIO);
    return { lines: [''], font_size: options.base_font_size, line_height };
  }

  let font_size = options.base_font_size;
  while (font_size >= options.min_font_size) {
    const lines = break_into_lines(normalized, options.wrap_width, font_size);
    const line_height = Math.round(font_size * LINE_HEIGHT_RATIO);
    if (lines.length * line_height <= options.box_height) {
      return { lines, font_size, line_height };
    }
    font_size -= 1;
  }

  const final_font = options.min_font_size;
  const lines = break_into_lines(normalized, options.wrap_width, final_font);
  const line_height = Math.round(final_font * LINE_HEIGHT_RATIO);
  const max_lines = Math.max(1, Math.floor(options.box_height / line_height));
  const sliced = lines.slice(0, max_lines);
  if (lines.length > max_lines) {
    const last = sliced[max_lines - 1];
    sliced[max_lines - 1] = `${last.slice(0, Math.max(0, last.length - 1))}…`;
  }
  return { lines: sliced.length ? sliced : [''], font_size: final_font, line_height };
}

function break_into_lines(text: string, width: number, font_size: number): string[] {
  const max_units_per_line = Math.max(4, Math.floor(width / (font_size * 0.55)));
  const result: string[] = [];

  text.split('\n').forEach((paragraph) => {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      result.push('');
      return;
    }

    const chars = Array.from(trimmed);
    let buffer: string[] = [];
    let buffer_units = 0;
    let last_break_index = -1;

    const flush = (end_index: number) => {
      const line_chars = buffer.slice(0, end_index);
      result.push(line_chars.join('').trimEnd());
      const consumed_units = sum_char_units(line_chars);
      buffer = buffer.slice(end_index);
      buffer_units -= consumed_units;
      while (buffer.length > 0 && is_breakable(buffer[0])) {
        const removed = buffer.shift();
        if (removed) {
          buffer_units -= measure_char_units(removed);
        }
      }
      if (buffer_units < 0) {
        buffer_units = 0;
      }
    };

    chars.forEach((char) => {
      const char_units = measure_char_units(char);

      if (buffer_units + char_units > max_units_per_line && buffer.length > 0) {
        if (last_break_index >= 0) {
          flush(last_break_index);
        } else {
          result.push(buffer.join('').trimEnd());
          buffer = [];
          buffer_units = 0;
        }
        last_break_index = -1;
      }

      buffer.push(char);
      buffer_units += char_units;

      if (is_breakable(char)) {
        last_break_index = buffer.length;
      }
    });

    if (buffer.length > 0) {
      result.push(buffer.join('').trimEnd());
    }
  });

  return result.length > 0 ? result : [''];
}

function sum_char_units(chars: string[]): number {
  return chars.reduce((total, char) => total + measure_char_units(char), 0);
}

function measure_char_units(char: string): number {
  const code = char.codePointAt(0);
  if (code === undefined) {
    return 1;
  }
  return code > 0xff ? 2 : 1;
}

function is_breakable(char: string): boolean {
  return /\s/.test(char);
}

function compute_title_font_size(body_font_size: number): number {
  const base = Math.max(body_font_size + TITLE_FONT_STEP, Math.round(body_font_size * TITLE_FONT_SCALE));
  return Math.min(TITLE_FONT_MAX, base);
}

function sanitize_text(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
