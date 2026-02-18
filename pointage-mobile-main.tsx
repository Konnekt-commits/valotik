import React from 'react';
import ReactDOM from 'react-dom/client';
import PointageMobileApp from './pointage-mobile-app';
import './index.css';

ReactDOM.createRoot(document.getElementById('pointage-mobile-root')!).render(
  <React.StrictMode>
    <PointageMobileApp />
  </React.StrictMode>,
);
