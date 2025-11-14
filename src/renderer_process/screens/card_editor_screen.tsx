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
    'rounded-2xl border border-transparent bg-[#fdfefe] px-3 py-2 text-base text-[#0f172a] placeholder:text-[#9ca3af] shadow-[inset_2px_2px_6px_rgba(15,23,42,0.08)] focus:border-[#94a3b8] focus:outline-none';
  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl gap-6 py-8 text-[#0f172a] lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
      <article className="rounded-[32px] bg-[#e8ecf5] px-6 py-7 shadow-[18px_18px_45px_#cfd3dd,-12px_-12px_35px_#ffffff]">
        <header className="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Add a new word</h2>
            <p className="mt-1 text-sm text-[#4b5563]">The desktop editor leaves plenty of room for context.</p>
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#94a3b8]">Card details</p>
        </header>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-[#475569]">
            Word
            <input
              value={word}
              onChange={(event) => handle_word_change(event.target.value)}
              placeholder="e.g., 勉強"
              className={field_class}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-[#475569]">
            Hiragana reading
            <input
              value={reading}
              onChange={(event) => handle_reading_change(event.target.value)}
              placeholder="e.g., べんきょう"
              className={field_class}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-[#475569]">
            Context
            <textarea
              rows={3}
              value={context_text}
              onChange={(event) => handle_context_change(event.target.value)}
              placeholder="Where does this word appear?"
              className={`${field_class} resize-none`}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-[#475569]">
            Scene
            <textarea
              rows={3}
              value={scene_text}
              onChange={(event) => handle_scene_change(event.target.value)}
              placeholder="Describe the situation."
              className={`${field_class} resize-none`}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-[#475569] lg:col-span-2">
            Example sentence
            <textarea
              rows={3}
              value={example_sentence}
              onChange={(event) => handle_example_change(event.target.value)}
              placeholder="Use the word in a sentence."
              className={`${field_class} resize-none`}
            />
          </label>
        </div>
        <div className="mt-6 flex flex-col gap-3 border-t border-white/70 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-[#475569]">
            Keep the preview open on the right to confirm spacing, or dock the window alongside other study tools.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={handle_save}
              disabled={is_save_disabled}
              className="rounded-full border border-transparent bg-[#0f172a] px-6 py-2 text-sm font-medium text-white shadow-[inset_2px_2px_6px_rgba(0,0,0,0.25)] disabled:opacity-60"
            >
              {is_save_disabled ? 'Fill all fields' : 'Save card'}
            </button>
            <SaveStatusHint state={save_status} message={status_message} />
          </div>
        </div>
      </article>
      <aside className="rounded-[32px] bg-[#e8ecf5] px-6 py-6 shadow-[18px_18px_45px_#cfd3dd,-12px_-12px_35px_#ffffff] lg:sticky lg:top-8">
        <h3 className="text-sm font-semibold text-[#475569]">Live preview</h3>
        <p className="mt-1 text-xs text-[#6b7280]">Scales to the actual export size while you type.</p>
        <div className="mt-4 rounded-2xl bg-[#e8ecf5] p-3 shadow-[inset_6px_6px_16px_#d0d4de,inset_-6px_-6px_16px_#ffffff]">
          <SvgCanvas svg_source={preview_svg} />
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-white/70 px-4 py-3 text-xs text-[#6b7280]">
          <p>All inputs must be filled before saving. Desktop writers often batch cards—watch the status indicator.</p>
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
      ? 'text-green-600'
      : state === 'error'
        ? 'text-red-600'
        : state === 'saving'
          ? 'text-yellow-600'
          : 'text-[#6b7280]';
  return (
    <p className={`text-sm ${color_class}`} aria-live="polite">
      {message}
    </p>
  );
}
