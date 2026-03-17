// frontend/src/components/Layout.jsx

import { Box, Container } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import VpnBanner from './VpnBanner';
import Footer from './Footer';

export default function Layout() {
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
        {/* VPN banner sits at the top of the content area, inside the page
            container — informational context, not a site-wide system alert. */}
        <Container size="sm" pt="md" pb={0}>
          {/* <VpnBanner /> */}
        </Container>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
}