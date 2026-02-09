import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { CostRateSettingsProvider } from './contexts/CostRateSettingsContext.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <CostRateSettingsProvider>
            <App />
        </CostRateSettingsProvider>
    </React.StrictMode>,
)
