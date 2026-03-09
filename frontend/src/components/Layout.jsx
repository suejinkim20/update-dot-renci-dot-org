// frontend/src/components/Layout.jsx
import { Box } from '@mantine/core';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f9f9f9',
      }}
    >
      <Header />
      <Box component="main" style={{ flex: 1 }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}