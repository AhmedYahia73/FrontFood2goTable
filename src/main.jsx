import React from 'react'; // Make sure this is present if your environment requires it.
import { createRoot } from 'react-dom/client';
import './index.css';
import { ContextProvider } from './Context/Auth.jsx';
import { RouterProvider } from 'react-router-dom';
import { router } from './Router.jsx';
import { Provider } from 'react-redux';
import { StoreApp } from './Store/Store.jsx';
// import './app.css';

createRoot(document.getElementById('root')).render(
  <Provider store={StoreApp}>
    <ContextProvider>
      <RouterProvider router={router} />
    </ContextProvider>
  </Provider>
);
