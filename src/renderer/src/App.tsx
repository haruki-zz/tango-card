import { useEffect, useState } from 'react';

import AddWordForm from './components/AddWordForm';
import ActivityHeatmap from './components/ActivityHeatmap';
import ImportExportPanel from './components/ImportExportPanel';
import ReviewSession from './components/ReviewSession';
import SettingsPanel from './components/SettingsPanel';
import WordList from './components/WordList';
import { useAppStore } from './store/useAppStore';

type ToolbarButtonProps = {
  label: string;
  icon: () => JSX.Element;
};

const SettingsIcon = () => (
  <svg
    className="icon-16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    aria-hidden
  >
    <path
      d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .33 1.65 1.65 0 0 0-.67 1.36V21a2 2 0 1 1-4 0v-.11A1.65 1.65 0 0 0 8.67 18.4a1.65 1.65 0 0 0-1-.33 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.33-1 1.65 1.65 0 0 0-1.36-.67H2.8a2 2 0 1 1 0-4h.11A1.65 1.65 0 0 0 5.6 8.67a1.65 1.65 0 0 0 .33-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.33 1.65 1.65 0 0 0 .67-1.36V2.8a2 2 0 1 1 4 0v.11a1.65 1.65 0 0 0 .67 1.36 1.65 1.65 0 0 0 1 .33 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.25.33.4.75.4 1.2s-.15.87-.4 1.2a1.65 1.65 0 0 0-.33 1Z"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ExpandIcon = () => (
  <svg
    className="icon-16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    aria-hidden
  >
    <path
      d="M9 4H5v4M15 4h4v4M9 20H5v-4M15 20h4v-4"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 9 5 5M15 9l4-4M9 15l-4 4M15 15l4 4"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ThemeIcon = () => (
  <svg
    className="icon-16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    aria-hidden
  >
    <path
      d="M12 4.5v1.5M12 18v1.5M6 12H4.5M19.5 12H18M7.7 7.7 6.6 6.6M17.4 17.4l-1.1-1.1M7.7 16.3 6.6 17.4M17.4 6.6l-1.1 1.1"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ToolbarButton = ({ label, icon: Icon }: ToolbarButtonProps) => (
  <button
    type="button"
    className="btn btn-ghost h-10 px-3"
    aria-label={label}
    title={`${label}（占位）`}
    disabled
  >
    <Icon />
  </button>
);

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
  const loadProvider = useAppStore((state) => state.loadProvider);
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState('');

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      try {
        await Promise.all([loadWords(), refreshActivity(), loadProvider()]);
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
  }, [loadWords, refreshActivity, loadProvider]);

  return (
    <div className="min-h-screen px-4 py-10 sm:px-5 lg:px-3 xl:px-6">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
        <header className="surface-card">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="pill">Tango Card</span>
                  <span className="rounded-full border border-dashed border-accent-200 px-3 py-1 text-xs font-semibold text-muted">
                    デスクトップ
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-semibold text-ink sm:text-4xl">
                    言葉を集め、思い出す
                  </h1>
                  <p className="mt-1 text-sm text-muted sm:text-base">
                    生成→編集→復習の一連を同じ画面で完結させます。
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 border-t border-dashed border-accent-100 pt-3 lg:mt-0 lg:border-t-0 lg:border-l lg:pl-4 lg:pt-0">
                <ToolbarButton label="設定" icon={SettingsIcon} />
                <ToolbarButton label="全画面" icon={ExpandIcon} />
                <ToolbarButton label="明暗" icon={ThemeIcon} />
              </div>
            </div>
            {initError ? (
              <div
                className="rounded-xl border border-accent-200 bg-accent-50 px-3 py-2 text-sm font-medium text-accent-700"
                role="alert"
              >
                {initError}
              </div>
            ) : (
              <div
                className="h-px border-b border-dashed border-accent-100"
                aria-hidden
              />
            )}
          </div>
        </header>

        <main className="grid grid-cols-1 gap-5 lg:auto-rows-min lg:grid-cols-[45%_55%] lg:items-start xl:grid-cols-[24%_46%_30%] xl:gap-6">
          <div className="flex flex-col gap-5 lg:pr-4 xl:pr-6">
            <AddWordForm />
            <WordList words={words} loading={initializing} />
          </div>
          <div className="lg:border-l lg:border-dashed lg:border-accent-100 lg:pl-4 xl:px-6">
            <ReviewSession />
          </div>
          <div className="flex flex-col gap-5 lg:col-span-2 lg:border-t lg:border-dashed lg:border-accent-100 lg:pt-4 xl:col-span-1 xl:border-t-0 xl:border-l xl:border-dashed xl:border-accent-100 xl:pl-6 xl:pt-0">
            <ActivityHeatmap />
            <ImportExportPanel />
            <SettingsPanel />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
