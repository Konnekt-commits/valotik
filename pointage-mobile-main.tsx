import React from 'react';
import ReactDOM from 'react-dom/client';
import PointageMobileApp from './pointage-mobile-app';
import './index.css';

ReactDOM.createRoot(document.getElementById('pointage-root')!).render(
  <React.StrictMode>
    <PointageMobileApp />
  </React.StrictMode>,
);
