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
    const svg_source = preview_svg;
    set_save_status('saving');
    set_status_message('Saving...');
    try {
      const saved_card = await api.ingest_card({
        card_id: active_card_id,
        svg_source,
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

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Word</span>
          <input
            value={word}
            onChange={(event) => handle_word_change(event.target.value)}
            placeholder="e.g., study"
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Hiragana Reading</span>
          <input
            value={reading}
            onChange={(event) => handle_reading_change(event.target.value)}
            placeholder="e.g., benkyou"
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Context</span>
          <textarea
            rows={3}
            value={context_text}
            onChange={(event) => handle_context_change(event.target.value)}
            placeholder="Describe where the word appears."
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Scene</span>
          <textarea
            rows={3}
            value={scene_text}
            onChange={(event) => handle_scene_change(event.target.value)}
            placeholder="Explain the specific scene or background."
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Example Sentence</span>
          <textarea
            rows={3}
            value={example_sentence}
            onChange={(event) => handle_example_change(event.target.value)}
            placeholder="Provide a sentence using the word."
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Memory Level</span>
          <select
            value={memory_level}
            onChange={(event) => handle_memory_level_change(event.target.value as MemoryLevel)}
            style={{ padding: '0.5rem' }}
          >
            {MEMORY_LEVEL_OPTIONS.map((option) => (
              <option key={option.level} value={option.level}>
                {option.label}
              </option>
            ))}
          </select>
          {selected_memory_option?.description ? (
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{selected_memory_option.description}</span>
          ) : null}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={handle_save}
            disabled={is_save_disabled}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '9999px',
              border: '1px solid #1d4ed8',
              backgroundColor: is_save_disabled ? '#1e293b' : '#1d4ed8',
              color: '#f8fafc',
              cursor: is_save_disabled ? 'not-allowed' : 'pointer',
            }}
          >
            Save Card
          </button>
          <SaveStatusHint state={save_status} message={status_message} />
        </div>
      </div>
      <div style={{ border: '1px solid #1f2937', borderRadius: '0.75rem', padding: '1rem' }}>
        <h2>Live Preview</h2>
        <SvgCanvas svg_source={preview_svg} />
      </div>
    </section>
  );
}

interface SaveStatusHintProps {
  readonly state: SaveStatus;
  readonly message: string;
}

function SaveStatusHint({ state, message }: SaveStatusHintProps) {
  const color =
    state === 'success' ? '#16a34a' : state === 'error' ? '#ef4444' : state === 'saving' ? '#facc15' : '#94a3b8';
  return (
    <p style={{ color, fontSize: '0.875rem' }} aria-live="polite">
      {message}
    </p>
  );
}
