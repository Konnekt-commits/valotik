import React from 'react';
import ReactDOM from 'react-dom/client';
import SignatureAvenantApp from './signature-avenant-app';
import './index.css';

ReactDOM.createRoot(document.getElementById('signature-avenant-root')!).render(
  <React.StrictMode>
    <SignatureAvenantApp />
  </React.StrictMode>,
);
