import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ToastProvider from './components/ToastProvider';

const Store = lazy(() => import('./pages/Store'));
const Admin = lazy(() => import('./pages/Admin'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div className="w-10 h-10 border-4 border-goth-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route
          path="/"
          element={
            <React.Suspense fallback={<LoadingSpinner />}>
              <Store />
            </React.Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <React.Suspense fallback={<LoadingSpinner />}>
              <Admin />
            </React.Suspense>
          }
        />
      </Routes>
    </ToastProvider>
  );
}

export default App;
