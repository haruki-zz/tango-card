import { useMemo, useState } from 'react';
import { SvgCanvas } from '../components/svg_canvas';
import { use_card_store } from '../hooks/use_card_store';
import { get_renderer_api } from '../utils/renderer_api';
import { MEMORY_LEVEL_DEFAULT, MemoryLevel } from '../../domain/review/memory_level';
import { MEMORY_LEVEL_OPTIONS } from '../../shared/constants/memory_levels';
import { render_card_svg } from '../../shared/templates/card_svg_template';

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'success' | 'error';

export function CardEditorScreen() {
  const [word, set_word] = useState('');
  const [reading, set_reading] = useState('');
  const [context_text, set_context_text] = useState('');
  const [scene_text, set_scene_text] = useState('');
  const [example_sentence, set_example_sentence] = useState('');
  const [memory_level, set_memory_level] = useState<MemoryLevel>(MEMORY_LEVEL_DEFAULT);
  const [save_status, set_save_status] = useState<SaveStatus>('idle');
  const [status_message, set_status_message] = useState('Not saved yet');
  const [active_card_id, set_active_card_id] = useState<string | undefined>(undefined);
  const api = useMemo(() => get_renderer_api(), []);
  const { refresh_cards } = use_card_store();

  const selected_memory_option = useMemo(
    () => MEMORY_LEVEL_OPTIONS.find((option) => option.level === memory_level),
    [memory_level],
  );

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

  const handle_memory_level_change = (value: MemoryLevel) => {
    set_memory_level(value);
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
        memory_level,
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
        memory_level,
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
    'rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-sky-400 focus:outline-none';
  return (
    <section className="space-y-8 text-white">
      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_35px_80px_rgba(2,6,23,0.55)] backdrop-blur">
          <header className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
              Create a card
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Describe the word you want to remember</h2>
            <p className="mt-2 text-sm text-white/70">
              Fill every field to unlock the live SVG preview and save it to your collection.
            </p>
          </header>
          <div className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white/80">Word</span>
              <input
                value={word}
                onChange={(event) => handle_word_change(event.target.value)}
                placeholder="e.g., 勉強"
                className={field_class}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white/80">Hiragana Reading</span>
              <input
                value={reading}
                onChange={(event) => handle_reading_change(event.target.value)}
                placeholder="e.g., べんきょう"
                className={field_class}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white/80">Context</span>
              <textarea
                rows={3}
                value={context_text}
                onChange={(event) => handle_context_change(event.target.value)}
                placeholder="Where does this word appear?"
                className={`${field_class} resize-none`}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white/80">Scene</span>
              <textarea
                rows={3}
                value={scene_text}
                onChange={(event) => handle_scene_change(event.target.value)}
                placeholder="Describe the moment in detail."
                className={`${field_class} resize-none`}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white/80">Example Sentence</span>
              <textarea
                rows={3}
                value={example_sentence}
                onChange={(event) => handle_example_change(event.target.value)}
                placeholder="Use the word in a complete sentence."
                className={`${field_class} resize-none`}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white/80">Memory Level</span>
              <select
                value={memory_level}
                onChange={(event) => handle_memory_level_change(event.target.value as MemoryLevel)}
                className={`${field_class} pr-10`}
              >
                {MEMORY_LEVEL_OPTIONS.map((option) => (
                  <option key={option.level} value={option.level} className="bg-slate-900 text-slate-100">
                    {option.label}
                  </option>
                ))}
              </select>
              {selected_memory_option?.description ? (
                <span className="text-xs text-white/60">{selected_memory_option.description}</span>
              ) : null}
            </label>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handle_save}
                disabled={is_save_disabled}
                className="rounded-[999px] bg-gradient-to-r from-emerald-400 to-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_45px_rgba(16,185,129,0.45)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {is_save_disabled ? 'Fill all fields' : 'Save card'}
              </button>
              <SaveStatusHint state={save_status} message={status_message} />
            </div>
          </div>
        </div>
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_35px_80px_rgba(2,6,23,0.55)] backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Live preview</h2>
            <span className="text-xs uppercase tracking-[0.4em] text-white/60">SVG card</span>
          </div>
          <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
            <SvgCanvas svg_source={preview_svg} />
          </div>
        </div>
      </div>
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
      ? 'text-emerald-300'
      : state === 'error'
        ? 'text-red-300'
        : state === 'saving'
          ? 'text-amber-200'
          : 'text-white/60';
  return (
    <p className={`text-sm ${color_class}`} aria-live="polite">
      {message}
    </p>
  );
}
