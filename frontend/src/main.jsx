import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './context/CartContext';
import './index.css';

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-goth-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-400">Cargando L Goth Store...</p>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <CartProvider>
        <Suspense fallback={<LoadingFallback />}>
          <App />
        </Suspense>
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
