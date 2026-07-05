import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
console.log(clientId);
createRoot(document.getElementById('root')).render(
  
    <GoogleOAuthProvider clientId={clientId} locale="en">
    <App />
    </GoogleOAuthProvider>
  
)