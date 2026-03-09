// frontend/src/components/Footer.jsx
import { Box, Container, Text } from '@mantine/core';

export default function Footer() {
  return (
    <Box
      component="footer"
      style={{ borderTop: '1px solid #e8e8e8', marginTop: 'auto' }}
    >
      <Container size="sm" py="md">
        <Text size="xs" c="dimmed" ta="center">
          RENCI · Renaissance Computing Institute
        </Text>
      </Container>
    </Box>
  );
}