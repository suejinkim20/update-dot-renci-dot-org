// frontend/src/components/VpnBanner.jsx
//
// Persistent notice displayed at the top of every page.
// Reminds staff that a VPN connection is required to load data and submit requests.
// Dismissible per session via local state — reappears on next page load.

import { useState } from 'react';
import { Alert, Text, Anchor } from '@mantine/core';
import { IconWifi } from '@tabler/icons-react';

export default function VpnBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <Alert
      icon={<IconWifi size={16} />}
      color="blue"
      variant="light"
      withCloseButton
      onClose={() => setDismissed(true)}
      mb={0}
      styles={{ message: { fontSize: '0.875rem' } }}
    >
      <Text size="sm">
        This tool requires an active{' '}
        <strong>RENCI VPN connection</strong> to load data and submit requests.
        If data fails to load or submissions return an error, check your VPN first.
        For setup instructions, see{' '}
        <Anchor href="https://renci.org/internal" target="_blank" rel="noopener noreferrer" size="sm">
          the internal docs
        </Anchor>
        .
      </Text>
    </Alert>
  );
}