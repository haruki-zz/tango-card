import { useEffect, useState } from 'react';

import AddWordForm from './components/AddWordForm';
import ActivityHeatmap from './components/ActivityHeatmap';
import ReviewSession from './components/ReviewSession';
import WordList from './components/WordList';
import { useAppStore } from './store/useAppStore';

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return '初始化失败，请稍后重试';
};

const App = () => {
  const words = useAppStore((state) => state.words);
  const loadWords = useAppStore((state) => state.loadWords);
  const refreshActivity = useAppStore((state) => state.refreshActivity);
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState('');

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      try {
        await Promise.all([loadWords(), refreshActivity()]);
      } catch (error) {
        if (!active) {
          return;
        }
        setInitError(getErrorMessage(error));
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, [loadWords, refreshActivity]);

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-12">
      <header className="flex w-full max-w-5xl flex-col gap-3 text-left sm:text-center">
        <span className="pill self-start sm:self-center">Tango Card</span>
        <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          词库新增与复习
        </h1>
        <p className="text-base text-muted sm:text-lg">
          输入日语单词保存到词库，再按 SM-2 队列复习并计入活跃度。
        </p>
        {initError ? (
          <p className="text-sm text-red-600 sm:self-center">
            {initError}
          </p>
        ) : null}
      </header>

      <main className="mt-8 flex w-full max-w-5xl flex-col gap-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <AddWordForm />
          <ReviewSession />
        </div>
        <ActivityHeatmap />
        <WordList words={words} loading={initializing} />
      </main>
    </div>
  );
};

export default App;
