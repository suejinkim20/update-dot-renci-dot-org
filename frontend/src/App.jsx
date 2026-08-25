// frontend/src/App.jsx

import { Box, Loader, Stack, Text } from '@mantine/core';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthStateProvider } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import PreviewPage from './pages/PreviewPage';
import AddProjectPage from './pages/AddProjectPage';
import AddPersonPage from './pages/AddPersonPage';
import UpdateProjectPage from './pages/UpdateProjectPage';
import UpdatePersonPage from './pages/UpdatePersonPage';
import ArchiveProjectPage from './pages/ArchiveProjectPage';
import ArchivePersonPage from './pages/ArchivePersonPage';
import { useAuth } from './context/AuthContext';
import { FormDataProvider } from './context/FormDataContext';

function AuthSplash({ message }) {
  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9f9f9',
      }}
    >
      <Stack align="center" gap="sm">
        <Loader color="#005b8e" />
        <Text size="sm" c="gray.6">
          {message}
        </Text>
      </Stack>
    </Box>
  );
}

function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthSplash message="Checking your session..." />;
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <FormDataProvider>
              <Layout />
            </FormDataProvider>
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/add/project" element={<AddProjectPage />} />
        <Route path="/add/person" element={<AddPersonPage />} />
        <Route path="/update/project" element={<UpdateProjectPage />} />
        <Route path="/update/person" element={<UpdatePersonPage />} />
        <Route path="/archive/project" element={<ArchiveProjectPage />} />
        <Route path="/archive/person" element={<ArchivePersonPage />} />
        {import.meta.env.DEV && (
          <Route path="/preview" element={<PreviewPage />} />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthStateProvider>
        <AppRoutes />
      </AuthStateProvider>
    </BrowserRouter>
  );
}
