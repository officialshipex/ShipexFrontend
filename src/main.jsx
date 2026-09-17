import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { setupAxiosInterceptors } from './utils/axiosInterceptor'
import { BrandingProvider } from './context/BrandingContext'

setupAxiosInterceptors();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrandingProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </BrandingProvider>
  </React.StrictMode>
)
