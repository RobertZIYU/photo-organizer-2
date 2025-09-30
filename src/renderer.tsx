import './index.css';
import './renderer/styles.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './renderer/App';

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);