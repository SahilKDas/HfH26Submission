import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AudioProvider } from './lib/audio.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AudioProvider><App /></AudioProvider>
  </React.StrictMode>,
);
