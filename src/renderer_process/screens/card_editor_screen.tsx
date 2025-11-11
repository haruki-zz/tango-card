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
    'rounded-xl border border-[#d1d5db] bg-white px-3 py-2 text-base text-[#111827] placeholder:text-[#9ca3af] focus:border-[#111827] focus:outline-none';
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col gap-8 py-8 text-[#111827]">
      <div className="rounded-2xl border border-[#e5e7eb] bg-white px-6 py-7 shadow-sm">
        <header className="mb-5">
          <h2 className="text-xl font-semibold">Add a new word</h2>
          <p className="mt-1 text-sm text-[#4b5563]">Fill the details below and save it to your deck.</p>
        </header>
        <div className="grid gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-[#374151]">
            Word
            <input
              value={word}
              onChange={(event) => handle_word_change(event.target.value)}
              placeholder="e.g., 勉強"
              className={field_class}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-[#374151]">
            Hiragana reading
            <input
              value={reading}
              onChange={(event) => handle_reading_change(event.target.value)}
              placeholder="e.g., べんきょう"
              className={field_class}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-[#374151]">
            Context
            <textarea
              rows={3}
              value={context_text}
              onChange={(event) => handle_context_change(event.target.value)}
              placeholder="Where does this word appear?"
              className={`${field_class} resize-none`}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-[#374151]">
            Scene
            <textarea
              rows={3}
              value={scene_text}
              onChange={(event) => handle_scene_change(event.target.value)}
              placeholder="Describe the situation."
              className={`${field_class} resize-none`}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-[#374151]">
            Example sentence
            <textarea
              rows={3}
              value={example_sentence}
              onChange={(event) => handle_example_change(event.target.value)}
              placeholder="Use the word in a sentence."
              className={`${field_class} resize-none`}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-[#374151]">
            Memory level
            <select
              value={memory_level}
              onChange={(event) => handle_memory_level_change(event.target.value as MemoryLevel)}
              className={`${field_class} pr-10`}
            >
              {MEMORY_LEVEL_OPTIONS.map((option) => (
                <option key={option.level} value={option.level}>
                  {option.label}
                </option>
              ))}
            </select>
            {selected_memory_option?.description ? (
              <span className="text-xs text-[#6b7280]">{selected_memory_option.description}</span>
            ) : null}
          </label>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button type="button" onClick={handle_save} disabled={is_save_disabled}>
              {is_save_disabled ? 'Fill all fields' : 'Save card'}
            </button>
            <SaveStatusHint state={save_status} message={status_message} />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-[#e5e7eb] bg-white px-6 py-6 shadow-sm">
        <h3 className="text-sm font-semibold text-[#374151]">Preview</h3>
        <div className="mt-3 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
          <SvgCanvas svg_source={preview_svg} />
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
