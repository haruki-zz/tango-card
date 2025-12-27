import { useEffect, useState } from 'react';

import AddWordForm from './components/AddWordForm';
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
          新增词条流程
        </h1>
        <p className="text-base text-muted sm:text-lg">
          输入日语单词，生成读音/释义/例句后保存到本地词库。
        </p>
        {initError ? (
          <p className="text-sm text-red-600 sm:self-center">
            {initError}
          </p>
        ) : null}
      </header>

      <main className="mt-8 flex w-full max-w-5xl flex-col gap-6">
        <AddWordForm />
        <WordList words={words} loading={initializing} />
      </main>
    </div>
  );
};

export default App;
