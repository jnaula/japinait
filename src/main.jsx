import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider } from './context/AuthContext';
import { App as CapApp } from '@capacitor/app';
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update';

// ── Botón físico de atrás (Android) ──────────────────────
CapApp.addListener('backButton', ({ canGoBack }) => {
  if (canGoBack) {
    window.history.back();
  } else {
    CapApp.exitApp();
  }
});

// ── Check de actualización automática ────────────────────
const checkForUpdate = async () => {
  try {
    const result = await AppUpdate.getAppUpdateInfo();
    if (result.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE) {
      await AppUpdate.performImmediateUpdate();
    }
  } catch (err) {
    // En web o si falla, ignorar silenciosamente
    console.log('AppUpdate not available:', err.message);
  }
};

checkForUpdate();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
