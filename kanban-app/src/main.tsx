import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux';
import { store } from './lib/redux/redux-store.ts';
import { MantineProvider } from '@mantine/core';
import { mantineTheme } from "./theme.ts";
import { BrowserRouter } from 'react-router';
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <MantineProvider defaultColorScheme='dark' theme={mantineTheme}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MantineProvider>
    </Provider>
  </StrictMode>,
);
