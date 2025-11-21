import { useMemo, useState } from 'react';
import { SvgCanvas } from '../components/svg_canvas';
import { use_card_store } from '../hooks/use_card_store';
import { get_renderer_api } from '../utils/renderer_api';
import { render_card_svg } from '../../shared/templates/card_svg_template';

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'success' | 'error';

export function CardEditorScreen() {
  const [word, set_word] = useState('');
  const [reading, set_reading] = useState('');
  const [context_text, set_context_text] = useState('');
  const [scene_text, set_scene_text] = useState('');
  const [example_sentence, set_example_sentence] = useState('');
  const [save_status, set_save_status] = useState<SaveStatus>('idle');
  const [status_message, set_status_message] = useState('Not saved yet');
  const [active_card_id, set_active_card_id] = useState<string | undefined>(undefined);
  const api = useMemo(() => get_renderer_api(), []);
  const { refresh_cards } = use_card_store();

  const mark_dirty = () => {
    if (save_status !== 'dirty') {
      set_save_status('dirty');
      set_status_message('Unsaved changes.');
    }
  };

  const handle_word_change = (value: string) => {
    set_word(value);
    if (!value.trim()) {
      set_active_card_id(undefined);
      set_save_status('idle');
      set_status_message('Please enter a word first.');
      return;
    }
    mark_dirty();
  };

  const handle_reading_change = (value: string) => {
    set_reading(value);
    mark_dirty();
  };

  const handle_context_change = (value: string) => {
    set_context_text(value);
    mark_dirty();
  };

  const handle_scene_change = (value: string) => {
    set_scene_text(value);
    mark_dirty();
  };

  const handle_example_change = (value: string) => {
    set_example_sentence(value);
    mark_dirty();
  };

  const fields_populated =
    word.trim().length > 0 &&
    reading.trim().length > 0 &&
    context_text.trim().length > 0 &&
    scene_text.trim().length > 0 &&
    example_sentence.trim().length > 0;

  const preview_svg = fields_populated
    ? render_card_svg({
        word,
        reading,
        context: context_text,
        scene: scene_text,
        example: example_sentence,
      })
    : '';

  const handle_save = async () => {
    if (!fields_populated) {
      set_save_status('error');
      set_status_message('Please complete word, reading, context, scene, and example.');
      return;
    }
    set_save_status('saving');
    set_status_message('Saving...');
    try {
      const saved_card = await api.ingest_card({
        card_id: active_card_id,
        word,
        reading,
        context: context_text,
        scene: scene_text,
        example: example_sentence,
      });
      set_active_card_id(saved_card.id);
      set_save_status('success');
      set_status_message('Saved successfully.');
      await refresh_cards();
    } catch (error) {
      set_save_status('error');
      set_status_message(`Save failed: ${(error as Error).message}`);
    }
  };

  const is_save_disabled = save_status === 'saving' || !fields_populated;

  const field_class =
    'border border-[#32384b] bg-[#05070d] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#6b7280] focus:border-[#22d3ee] focus:outline-none focus:ring-1 focus:ring-[#22d3ee]';
  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl gap-6 py-2 text-[#e2e8f0] lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
      <article className="border border-[#1f2433] bg-[#090c14] px-5 py-6">
        <header className="mb-6 border-b border-[#1f2433] pb-4">
          <p className="text-xs uppercase tracking-[0.4em] text-[#94a3b8]">editor</p>
          <div className="mt-2 flex flex-col gap-1 text-sm text-[#a5b4fc] lg:flex-row lg:items-end lg:justify-between">
            <h2 className="text-2xl font-semibold text-[#f8fafc]">card.new()</h2>
            <span>sequence: word → reading → scene → example</span>
          </div>
        </header>
        <div className="grid gap-4">
          <div>
            <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.3em] text-[#94a3b8]">
              <span className="font-mono text-sm text-[#f8fafc]">[1] Word</span>
              <input
                value={word}
                onChange={(event) => handle_word_change(event.target.value)}
                placeholder="e.g., 勉強"
                className={field_class}
              />
            </label>
          </div>
          <div className="pt-4 lg:border-l lg:border-dashed lg:border-[#1f2433] lg:pl-4">
            <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.3em] text-[#94a3b8]">
              <span className="font-mono text-sm text-[#f8fafc]">[2] Hiragana reading</span>
              <input
                value={reading}
                onChange={(event) => handle_reading_change(event.target.value)}
                placeholder="e.g., べんきょう"
                className={field_class}
              />
            </label>
          </div>
          <div className="border-t border-dashed border-[#1f2433] pt-4">
            <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.3em] text-[#94a3b8]">
              <span className="font-mono text-sm text-[#f8fafc]">[3] Context</span>
              <textarea
                rows={3}
                value={context_text}
                onChange={(event) => handle_context_change(event.target.value)}
                placeholder="Where does this word appear?"
                className={`${field_class} min-h-[110px] resize-none`}
              />
            </label>
          </div>
          <div className="border-t border-dashed border-[#1f2433] pt-4">
            <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.3em] text-[#94a3b8]">
              <span className="font-mono text-sm text-[#f8fafc]">[4] Scene</span>
              <textarea
                rows={3}
                value={scene_text}
                onChange={(event) => handle_scene_change(event.target.value)}
                placeholder="Describe the situation."
                className={`${field_class} min-h-[110px] resize-none`}
              />
            </label>
          </div>
          <div className="border-t border-dashed border-[#1f2433] pt-4 lg:col-span-2">
            <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.3em] text-[#94a3b8]">
              <span className="font-mono text-sm text-[#f8fafc]">[5] Example sentence</span>
              <textarea
                rows={3}
                value={example_sentence}
                onChange={(event) => handle_example_change(event.target.value)}
                placeholder="Use the word in a sentence."
                className={`${field_class} min-h-[110px] resize-none`}
              />
            </label>
          </div>
        </div>
        <div className="mt-6 grid gap-4 border-t border-[#1f2433] pt-4 text-sm text-[#94a3b8] lg:grid-cols-[1.2fr_auto] lg:items-center">
          <div className="font-mono text-xs text-[#94a3b8]">
            <p>⇧ + Enter → 保存当前卡片</p>
            <p>填写完 5 步后执行，预览区域实时更新。</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={handle_save}
              disabled={is_save_disabled}
              className="border border-[#3f475d] bg-[#111827] px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#f8fafc] transition hover:bg-[#1f2937] disabled:opacity-40"
            >
              {is_save_disabled ? 'complete fields' : 'save card'}
            </button>
            <SaveStatusHint state={save_status} message={status_message} />
          </div>
        </div>
      </article>
      <aside className="border border-[#1f2433] bg-[#060910] px-5 py-5 lg:sticky lg:top-6">
        <h3 className="text-xs uppercase tracking-[0.4em] text-[#94a3b8]">preview</h3>
        <p className="mt-1 font-mono text-xs text-[#94a3b8]">ratio 21:12 · live render</p>
        <div className="mt-4 border border-[#1f2433] bg-[#030507] p-3">
          <SvgCanvas svg_source={preview_svg} />
        </div>
        <div className="mt-4 border border-dashed border-[#2f3647] px-4 py-3 font-mono text-xs text-[#94a3b8]">
          <p>{fields_populated ? 'READY · all fields complete' : 'WAITING · fill every step to save'}</p>
        </div>
      </aside>
    </section>
  );
}

interface SaveStatusHintProps {
  readonly state: SaveStatus;
  readonly message: string;
}

function SaveStatusHint({ state, message }: SaveStatusHintProps) {
  const color_class =
    state === 'success'
      ? 'text-green-400'
      : state === 'error'
        ? 'text-red-400'
        : state === 'saving'
          ? 'text-yellow-300'
          : 'text-[#94a3b8]';
  return (
    <p className={`text-sm ${color_class}`} aria-live="polite">
      {message}
    </p>
  );
}
