import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AddWordForm from '../src/renderer/features/add-word/AddWordForm';
import type {
  CreateWordInput,
  ExposedApi,
  GenerateWordDataResult,
  WordCard
} from '../src/shared/apiTypes';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('AddWordForm', () => {
  it('AI 失败时允许手动保存并在保存后锁定', async () => {
    const user = userEvent.setup();
    const generateWordData = vi
      .fn<[string], Promise<GenerateWordDataResult>>()
      .mockResolvedValue({ ok: false, error: { code: 'fail', message: '生成失败，请手动填写。' } });
    const createWord = vi
      .fn<[CreateWordInput], Promise<WordCard>>()
      .mockImplementation(async (input) => createWordCardStub(input));
    stubApi({ generateWordData, createWord });

    render(<AddWordForm />);

    await user.type(screen.getByLabelText('日语单词'), '寿司');
    await user.click(screen.getByRole('button', { name: '生成' }));
    await screen.findByText('生成失败，请手动填写。');

    await user.type(screen.getByLabelText('假名读音'), 'すし');
    await user.type(screen.getByLabelText('释义（140 字内）'), '以醋饭为主的日式料理。');
    await user.type(screen.getByLabelText('例句（日语）'), '週末に友だちと寿司を食べました。');
    await user.type(screen.getByLabelText('例句（中文）'), '周末和朋友一起吃了寿司。');

    const saveButton = screen.getByRole('button', { name: '保存到词库' });
    expect(saveButton).toBeEnabled();

    await user.click(saveButton);
    await screen.findByText(/已保存到本地词库/);

    expect(createWord).toHaveBeenCalledWith(
      expect.objectContaining({
        term: '寿司',
        pronunciation: 'すし'
      })
    );
    expect(screen.getByLabelText('日语单词')).toBeDisabled();
    expect(screen.getByRole('button', { name: '已保存' })).toBeDisabled();
  });

  it('填充 AI 生成结果并允许编辑', async () => {
    const user = userEvent.setup();
    const generateWordData = vi.fn<[string], Promise<GenerateWordDataResult>>().mockResolvedValue({
      ok: true,
      data: {
        term: '桜',
        pronunciation: 'さくら',
        definition_cn: '春天盛开的樱花。',
        examples: [
          {
            sentence_jp: '春になると桜が咲きます。',
            sentence_cn: '一到春天樱花就会盛开。'
          }
        ]
      }
    });
    stubApi({ generateWordData });

    render(<AddWordForm />);

    await user.type(screen.getByLabelText('日语单词'), '桜');
    await user.click(screen.getByRole('button', { name: '生成' }));

    await screen.findByDisplayValue('さくら');
    expect(screen.getByDisplayValue('春天盛开的樱花。')).toBeInTheDocument();
    expect(screen.getByDisplayValue('春になると桜が咲きます。')).toBeInTheDocument();
    expect(screen.getByDisplayValue('一到春天樱花就会盛开。')).toBeInTheDocument();
  });

  it('重置后可继续新增词条', async () => {
    const user = userEvent.setup();
    const createWord = vi
      .fn<[CreateWordInput], Promise<WordCard>>()
      .mockImplementation(async (input) => createWordCardStub(input));
    stubApi({ createWord });

    render(<AddWordForm />);

    await user.type(screen.getByLabelText('日语单词'), '明日');
    await user.type(screen.getByLabelText('假名读音'), 'あした');
    await user.type(screen.getByLabelText('释义（140 字内）'), '明天。');
    await user.type(screen.getByLabelText('例句（日语）'), '明日、映画を見に行きます。');
    await user.type(screen.getByLabelText('例句（中文）'), '明天去看电影。');

    await user.click(screen.getByRole('button', { name: '保存到词库' }));
    await screen.findByText(/已保存到本地词库/);

    await user.click(screen.getByRole('button', { name: '新增下一条' }));

    expect(screen.getByLabelText('日语单词')).toHaveValue('');
    expect(screen.getByLabelText('假名读音')).toBeEnabled();
    expect(screen.getByRole('button', { name: '保存到词库' })).toBeDisabled();
  });
});

function stubApi(options: {
  generateWordData?: (term: string) => Promise<GenerateWordDataResult>;
  createWord?: (input: CreateWordInput) => Promise<WordCard>;
}) {
  const api: ExposedApi = {
    ping: () => 'pong',
    ai: {
      generateWordData:
        options.generateWordData ??
        (async (_term: string) => ({ ok: false, error: { code: 'noop', message: '暂未实现' } }))
    },
    db: {
      getTodayQueue: vi.fn(),
      answerReview: vi.fn(),
      createWord:
        options.createWord ??
        (async (input: CreateWordInput) => Promise.resolve(createWordCardStub(input))),
      getHeatmapActivity: vi.fn()
    },
    settings: {
      getSettings: vi.fn(),
      updateSettings: vi.fn()
    },
    files: {
      importWords: vi.fn(),
      exportBackup: vi.fn()
    }
  };

  (window as unknown as { api: ExposedApi }).api = api;
}

function createWordCardStub(input: CreateWordInput): WordCard {
  const timestamp = 1_700_000_000;
  return {
    id: 1,
    term: input.term,
    pronunciation: input.pronunciation,
    definition_cn: input.definition_cn,
    examples: input.examples,
    tags: [],
    created_at: timestamp,
    updated_at: timestamp,
    srs_level: 0,
    srs_repetitions: 0,
    srs_interval: 0,
    ease_factor: 2.5,
    last_reviewed_at: null,
    due_at: null
  };
}
