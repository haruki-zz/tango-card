import { useMemo, useState } from 'react';
import { use_card_store } from '../hooks/use_card_store';
import { get_renderer_api } from '../utils/renderer_api';

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
  const { refresh_cards, increment_created } = use_card_store();

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
      increment_created(new Date().toISOString().slice(0, 10));
      await refresh_cards();
    } catch (error) {
      set_save_status('error');
      set_status_message(`Save failed: ${(error as Error).message}`);
    }
  };

  const is_save_disabled = save_status === 'saving' || !fields_populated;

  const field_class =
    'border border-soft bg-surface px-3 py-2 text-sm text-primary placeholder:text-subtle focus:border-accent-cyan focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)] rounded-[3px]';
  return (
    <section className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-4xl py-2 text-primary">
      <article className="rounded-sm border border-app bg-surface-strong px-5 py-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <header className="mb-6 border-b border-app pb-4">
          <p className="text-xs uppercase tracking-[0.4em] text-muted">editor</p>
          <div className="mt-2 flex flex-col gap-1 text-sm text-muted lg:flex-row lg:items-end lg:justify-between">
            <h2 className="text-2xl font-semibold text-primary">card.new()</h2>
            <span>sequence: word → reading → scene → example</span>
          </div>
        </header>
        <div className="grid gap-4">
          <div>
            <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.3em] text-muted">
              <span className="font-mono text-sm text-primary">[1] Word</span>
              <input
                value={word}
                onChange={(event) => handle_word_change(event.target.value)}
                placeholder="e.g., 勉強"
                className={field_class}
              />
            </label>
          </div>
          <div className="pt-4 lg:border-l lg:border-dashed lg:border-app lg:pl-4">
            <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.3em] text-muted">
              <span className="font-mono text-sm text-primary">[2] Hiragana reading</span>
              <input
                value={reading}
                onChange={(event) => handle_reading_change(event.target.value)}
                placeholder="e.g., べんきょう"
                className={field_class}
              />
            </label>
          </div>
          <div className="border-t border-dashed border-app pt-4">
            <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.3em] text-muted">
              <span className="font-mono text-sm text-primary">[3] Context</span>
              <textarea
                rows={3}
                value={context_text}
                onChange={(event) => handle_context_change(event.target.value)}
                placeholder="Where does this word appear?"
                className={`${field_class} min-h-[110px] resize-none`}
              />
            </label>
          </div>
          <div className="border-t border-dashed border-app pt-4">
            <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.3em] text-muted">
              <span className="font-mono text-sm text-primary">[4] Scene</span>
              <textarea
                rows={3}
                value={scene_text}
                onChange={(event) => handle_scene_change(event.target.value)}
                placeholder="Describe the situation."
                className={`${field_class} min-h-[110px] resize-none`}
              />
            </label>
          </div>
          <div className="border-t border-dashed border-app pt-4 lg:col-span-2">
            <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.3em] text-muted">
              <span className="font-mono text-sm text-primary">[5] Example sentence</span>
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
        <div className="mt-6 border-t border-app pt-4">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={handle_save}
              disabled={is_save_disabled}
              className="btn-ghost bg-card px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] disabled:opacity-40"
            >
              save card
            </button>
            <SaveStatusHint state={save_status} message={status_message} />
          </div>
        </div>
      </article>
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
      ? 'text-green-500'
      : state === 'error'
        ? 'text-red-500'
        : state === 'saving'
          ? 'text-accent-amber'
          : 'text-muted';
  return (
    <p className={`text-sm ${color_class}`} aria-live="polite">
      {message}
    </p>
  );
}
