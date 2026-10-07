import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid rgba(30,58,138,0.2)',
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: '0 8px 24px rgba(30,58,138,0.12)',
            },
            success: { iconTheme: { primary: '#059669', secondary: '#ffffff' } },
            error: { iconTheme: { primary: '#dc2626', secondary: '#ffffff' } },
          }}
        />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
