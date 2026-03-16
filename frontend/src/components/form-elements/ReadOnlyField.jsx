// frontend/src/components/form-elements/ReadOnlyField.jsx
//
// Displays a non-editable field value.
// Subtle fill, no border — intentionally low visual weight so it doesn't
// compete with editable inputs.
//
// Props:
//   label    {string}  - Field label
//   value    {string}  - Display value
//   isHtml   {boolean} - If true, renders value as sanitized HTML.
//                        Use for fields where existing data comes from
//                        WordPress and may contain markup.

import { Box, Text } from '@mantine/core';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

export default function ReadOnlyField({ label, value, isHtml = false }) {
  const isEmpty = value === null || value === undefined || value === '';

  return (
    <Box
      style={{
        backgroundColor: 'var(--mantine-color-gray-1)',
        borderRadius:     'var(--mantine-radius-sm)',
        padding:          '0.5rem 0.75rem',
      }}
    >
      <Text size="xs" c="gray.7" fw={500} tt="uppercase" lts={0.5} mb={2}>
        {label}
      </Text>

      {isEmpty ? (
        <Text size="sm" c="gray.7" fs="italic">
          Not provided
        </Text>
      ) : isHtml ? (
        <Box
          size="sm"
          style={{ fontSize: '0.875rem' }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
        />
      ) : (
        <Text size="sm">{value}</Text>
      )}
    </Box>
  );
}