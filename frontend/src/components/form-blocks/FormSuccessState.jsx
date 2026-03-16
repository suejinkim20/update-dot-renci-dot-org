// frontend/src/components/form-blocks/FormSuccessState.jsx

import { Stack, Text, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

/**
 * FormSuccessState
 * Shown after a form is successfully submitted.
 * Replaces the form content entirely.
 * "New request" navigates to home so the user can start fresh.
 *
 * Usage:
 *   if (submitSuccess) return <FormSuccessState />;
 */
export default function FormSuccessState({ message }) {
  const navigate = useNavigate();

  return (
    <Stack gap="md" align="center" py="xl">
      <Text size="sm" fw={600} c="#005b8e">
        Request submitted
      </Text>
      <Text size="sm" c="dimmed" ta="center">
        {message ??
          'Your request has been submitted. Check your email for a confirmation from the web team.'}
      </Text>
      <Button
        variant="subtle"
        size="xs"
        onClick={() => navigate('/')}
      >
        New request
      </Button>
    </Stack>
  );
}