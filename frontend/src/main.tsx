import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'

// Suppress React DevTools console message in production
if (process.env.NODE_ENV === 'production') {
  const noop = () => {};
  const consoleProps = ['log', 'debug', 'info', 'warn'];
  consoleProps.forEach(prop => {
    if (!console[prop]) return;
    console[prop] = noop;
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
