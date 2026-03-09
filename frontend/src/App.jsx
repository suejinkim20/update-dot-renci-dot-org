import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PreviewPage from './pages/PreviewPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {import.meta.env.DEV && (
          <Route path="/preview" element={<PreviewPage />} />
        )}
      </Routes>
    </BrowserRouter>
  )
}