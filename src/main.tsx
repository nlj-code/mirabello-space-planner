import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './store/AppContext.tsx'
import PasswordGate, { isAuthenticated } from './components/PasswordGate.tsx'

function Root() {
  const [authed, setAuthed] = useState(isAuthenticated);
  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
