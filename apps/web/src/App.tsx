import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@core/theme/ThemeProvider';
import { AppRouter } from '@core/routing/AppRouter';

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ThemeProvider>
  );
}
