// frontend/src/components/form-blocks/EditableWebsiteList.jsx
//
// Manages a list of website entries for Add and Update forms.
// Each entry has a required URL and an optional link type.
//
// Link types map to CSS classes on the RENCI website that attach
// service-specific logos. Untyped entries get a generic web icon.
// Type is stored in submitted data so the implementing team knows
// what kind of link it is.
//
// Entry shape: { url, type? }

import { useState } from 'react';
import {
  Stack,
  Group,
  Box,
  Text,
  Button,
  ActionIcon,
  TextInput,
  Select,
  Divider,
  Anchor,
  List,
} from '@mantine/core';
import { IconPlus, IconTrash, IconExternalLink } from '@tabler/icons-react';

// ---------------------------------------------------------------------------
// Link type options — add new types here.
// ---------------------------------------------------------------------------
export const LINK_TYPES = [
  { value: 'youtube',        label: 'YouTube' },
  { value: 'linkedin',       label: 'LinkedIn' },
  { value: 'github',         label: 'GitHub' },
  { value: 'orcid',          label: 'ORCID' },
  { value: 'google-scholar', label: 'Google Scholar' },
];

const emptyEntry = () => ({ url: '', type: '' });

export default function EditableWebsiteList({ currentItems = [], value, onChange }) {
  const items = Array.isArray(value) && value.length > 0 ? value : [emptyEntry()];

  const update = (index, patch) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  };

  const addEntry = () => onChange([...items, emptyEntry()]);

  const removeEntry = (index) => {
    const next = items.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [emptyEntry()]);
  };

  const hasCurrentItems = Array.isArray(currentItems) && currentItems.length > 0;

  return (
    <Stack gap="sm">
      {/* Current items — bulleted list, read-only, shown in Update forms only */}
      {hasCurrentItems && (
        <Box>
          <Text size="xs" fw={500} c="dimmed" tt="uppercase" lts={0.5} mb={6}>
            Current websites
          </Text>
          <List size="sm" spacing={4}>
            {currentItems.map(({ url, type }, i) => (
              <List.Item key={i}>
                <Group gap={6} wrap="nowrap" align="center">
                  {type && (
                    <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                      {LINK_TYPES.find((t) => t.value === type)?.label ?? type}:
                    </Text>
                  )}
                  {/* Wrap url in a flex container so icon stays inline with text,
                      even on long URLs that wrap to a second line */}
                  <Anchor
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'flex-start',
                      gap: 4,
                      wordBreak: 'break-all',
                    }}
                  >
                    <span>{url}</span>
                    <IconExternalLink
                      size={12}
                      style={{ flexShrink: 0, marginTop: 3 }}
                    />
                  </Anchor>
                </Group>
              </List.Item>
            ))}
          </List>
          <Divider my="sm" variant="dashed" />
          <Text size="xs" fw={500} c="dimmed" tt="uppercase" lts={0.5} mb={6}>
            Add websites
          </Text>
        </Box>
      )}

      {/* Editable entries */}
      <Stack gap="xs">
        {items.map((item, index) => (
          <Group key={index} gap="xs" align="flex-end">
            <Select
              label={index === 0 && !hasCurrentItems ? 'Link type' : undefined}
              placeholder="Type (optional)"
              data={LINK_TYPES}
              value={item.type || null}
              onChange={(val) => update(index, { type: val ?? '' })}
              clearable
              style={{ width: 160, flexShrink: 0 }}
              size="sm"
            />
            <Box style={{ flex: 1 }}>
              <TextInput
                label={index === 0 && !hasCurrentItems ? 'URL' : undefined}
                placeholder="https://"
                value={item.url || ''}
                onChange={(e) => update(index, { url: e.target.value })}
                size="sm"
              />
            </Box>
            <ActionIcon
              color="red"
              variant="subtle"
              size="sm"
              mb={2}
              onClick={() => removeEntry(index)}
              disabled={items.length === 1 && !item.url}
              title="Remove"
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        ))}
      </Stack>

      <Button
        variant="subtle"
        size="xs"
        leftSection={<IconPlus size={14} />}
        onClick={addEntry}
        style={{ alignSelf: 'flex-start' }}
      >
        Add another website
      </Button>
    </Stack>
  );
}