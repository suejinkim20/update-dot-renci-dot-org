// frontend/src/components/RequestSelector.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Select, Text, Box, Stack, Paper, Transition, Anchor } from '@mantine/core';

const ACTION_OPTIONS = [
  { value: 'add',     label: 'Add' },
  { value: 'update',  label: 'Update' },
  { value: 'archive', label: 'Archive' },
];

const ENTITY_OPTIONS = [
  { value: 'project', label: 'Project' },
  { value: 'person',  label: 'Person' },
];

export default function RequestSelector() {
  const navigate = useNavigate();
  const [action, setAction] = useState(null);
  const [entity, setEntity] = useState(null);

  const handleActionChange = (val) => {
    setAction(val);
    if (val && entity) navigate(`/${val}/${entity}`);
  };

  const handleEntityChange = (val) => {
    setEntity(val);
    if (action && val) navigate(`/${action}/${val}`);
  };

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">

        <Transition mounted={!(action && entity)} transition="fade" duration={200} timingFunction="ease">
          {(styles) => (
            <Box style={styles}>
              <Stack gap="sm">
                <Text size="md" c="#000000">
                  Use this tool to submit website change requests for projects and people
                  on the RENCI website. Requests are reviewed by the web team before any
                  changes go live. The data shown in forms reflects a recent snapshot from
                  the website — minor discrepancies with the live site are expected.
                </Text>
                <Text size="md" c="#000000">
                  This form is for content that is <strong>ready to publish</strong>. If
                  you need help writing or editing descriptions, bios, or other copy,
                  please use the{' '}
                  <Anchor
                    href="https://renci.org/comms-request"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    communications request form
                  </Anchor>{' '}
                  first.
                </Text>
              </Stack>
            </Box>
          )}
        </Transition>

        <Paper
          withBorder
          radius="md"
          p="xl"
          style={{ background: '#fff', borderColor: '#e0e0e0' }}
        >
          <Stack gap="md">
            <Text
              size="sm"
              c="dimmed"
              fw={500}
              style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
            >
              New Request
            </Text>

            <Box
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '0.5rem',
                rowGap: '0.75rem',
              }}
            >
              <Text size="lg" fw={500} c="#1a1a1a">I'd like to</Text>

              <Select
                data={ACTION_OPTIONS}
                value={action}
                onChange={handleActionChange}
                placeholder="choose an action"
                size="md"
                radius="md"
                style={{ minWidth: 160 }}
                styles={{
                  input: {
                    fontWeight: 600,
                    color:       action ? '#005b8e' : undefined,
                    borderColor: action ? '#005b8e' : undefined,
                    background:  action ? '#f0f7fc' : '#fff',
                  },
                }}
                aria-label="Select action"
              />

              <Text size="lg" fw={500} c="#1a1a1a">a</Text>

              <Select
                data={ENTITY_OPTIONS}
                value={entity}
                onChange={handleEntityChange}
                placeholder="choose a type"
                size="md"
                radius="md"
                style={{ minWidth: 150 }}
                styles={{
                  input: {
                    fontWeight: 600,
                    color:       entity ? '#005b8e' : undefined,
                    borderColor: entity ? '#005b8e' : undefined,
                    background:  entity ? '#f0f7fc' : '#fff',
                  },
                }}
                aria-label="Select entity type"
              />

              <Text size="lg" fw={500} c="#1a1a1a">.</Text>
            </Box>
          </Stack>
        </Paper>

      </Stack>
    </Container>
  );
}