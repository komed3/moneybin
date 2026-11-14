import { App } from '@/src/client/App';
import { ApiProvider } from '@/src/client/context/ApiContext';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router';

import '@/src/client/index.css';
import '@/src/client/lib/i18n';


createRoot( document.getElementById( 'root' )! ).render(
  <StrictMode>
    <Router>
      <ApiProvider>
        <App />
      </ApiProvider>
    </Router>
  </StrictMode>
);
