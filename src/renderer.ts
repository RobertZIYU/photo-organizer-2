import './index.css';
import './renderer/styles.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import PhotoOrganizeDemo from './renderer/PhotoOrganizeDemo';

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(React.createElement(PhotoOrganizeDemo));
