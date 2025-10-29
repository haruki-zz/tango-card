import { MemoryLevel } from '../../domain/review/memory_level';

export interface CardTemplateInput {
  readonly word: string;
  readonly reading: string;
  readonly context: string;
  readonly example: string;
  readonly memory_level?: MemoryLevel;
}

const CARD_WIDTH = 420;
const CARD_HEIGHT = 240;
const MAX_CONTEXT_CHARS = 32;
const MAX_EXAMPLE_CHARS = 36;

export function render_card_svg(input: CardTemplateInput): string {
  const word = sanitize_text(input.word);
  const reading = sanitize_text(input.reading);
  const context_lines = wrap_lines(input.context, MAX_CONTEXT_CHARS);
  const example_lines = wrap_lines(input.example, MAX_EXAMPLE_CHARS);
  const memory_level_label = input.memory_level ? sanitize_text(input.memory_level) : '';

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" preserveAspectRatio="xMidYMid meet">`,
    '<style>',
    '* { font-family: "Inter", "Noto Sans JP", system-ui, sans-serif; }',
    '.card-bg { fill: #0f172a; }',
    '.word { fill: #f8fafc; font-size: 36px; font-weight: 700; }',
    '.reading { fill: #94a3b8; font-size: 18px; font-weight: 500; }',
    '.section-title { fill: #38bdf8; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase; }',
    '.section-body { fill: #e2e8f0; font-size: 16px; line-height: 1.4; }',
    '.memory-label { fill: #22c55e; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }',
    '</style>',
    `<rect class="card-bg" x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="18"/>`,
    `<text class="word" x="28" y="72">${word}</text>`,
    `<text class="reading" x="28" y="104">${reading}</text>`,
    memory_level_label
      ? `<text class="memory-label" x="${CARD_WIDTH - 32}" y="32" text-anchor="end">${memory_level_label}</text>`
      : '',
    `<text class="section-title" x="28" y="138">CONTEXT</text>`,
    `<text class="section-body" x="28" y="160">${create_tspans(context_lines)}</text>`,
    `<text class="section-title" x="28" y="202">EXAMPLE</text>`,
    `<text class="section-body" x="28" y="224">${create_tspans(example_lines)}</text>`,
    '</svg>',
  ]
    .filter(Boolean)
    .join('');
}

function create_tspans(lines: string[]): string {
  return lines
    .map((line, index) => {
      const dy = index === 0 ? '0' : '20';
      return `<tspan x="28" dy="${dy}">${sanitize_text(line)}</tspan>`;
    })
    .join('');
}

function wrap_lines(subject: string, limit: number): string[] {
  const normalized = subject.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [''];
  }
  const segments: string[] = [];
  normalized.split('\n').forEach((line) => {
    segments.push(...split_line(line.trim(), limit));
  });
  return segments.length > 0 ? segments : [''];
}

function split_line(line: string, limit: number): string[] {
  if (line.length <= limit) {
    return [line];
  }
  const words = line.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  words.forEach((word) => {
    const tentative = current ? `${current} ${word}` : word;
    if (tentative.length > limit && current) {
      lines.push(current);
      current = word;
    } else {
      current = tentative;
    }
  });
  if (current) {
    lines.push(current);
  }
  return lines;
}

function sanitize_text(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
