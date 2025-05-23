import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './Styles/index.css'; // Updated import path
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);