import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import { AppProvider } from './state/AppContext';
import { downloadJson, STORAGE_KEY } from './state/storage';
import App from './App';
import './styles.css';
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Число: ошибка интерфейса', error, info.componentStack);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="fatal-error">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} width="60" alt="Число" />
        <h1>Нужна маленькая перезагрузка</h1>
        <p>
          Не получилось открыть экран. Не очищайте данные браузера: ваш прогресс может быть на
          месте.
        </p>
        <button className="button primary" onClick={() => window.location.reload()}>
          Попробовать снова
        </button>
        <button
          className="button secondary"
          onClick={() => {
            try {
              const raw = localStorage.getItem(STORAGE_KEY);
              if (raw) downloadJson(JSON.parse(raw), 'chislo-recovery.json');
            } catch {
              /* The browser may block storage entirely. */
            }
          }}
        >
          Скачать сохранённые данные
        </button>
      </main>
    );
  }
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>,
);
