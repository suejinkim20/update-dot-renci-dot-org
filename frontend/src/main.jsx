import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { theme } from './styles/theme.js'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css';
import './styles/index.css'
import App from './App.jsx'
import { FormDataProvider } from './context/FormDataContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <FormDataProvider>
        <App />
      </FormDataProvider>
    </MantineProvider>
  </React.StrictMode>
)