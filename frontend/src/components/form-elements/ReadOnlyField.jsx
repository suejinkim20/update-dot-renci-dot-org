import { Stack, Text, Box } from '@mantine/core';

/**
 * ReadOnlyField
 * Displays a label and a read-only current value.
 * Used on Update and Archive forms to show existing data above an input.
 *
 * Props:
 *   label        — field label
 *   value        — the current value to display (string, number, or ReactNode)
 *   emptyText    — text shown when value is empty/null (default: "Not set")
 *   helperText   — optional helper text shown below the value
 *   monospace    — if true, renders value in monospace (e.g. for slugs)
 *
 * Usage:
 *   <ReadOnlyField label="Current Slug" value={project.slug} monospace />
 *   <ReadOnlyField label="Current Name" value={project.name} />
 */
export default function ReadOnlyField({
  label,
  value,
  emptyText = 'Not set',
  helperText,
  monospace = false,
}) {
  const isEmpty = value === null || value === undefined || value === '';
  const displayValue = isEmpty ? emptyText : value;

  return (
    <Stack gap={2}>
      <Text
        size="xs"
        fw={600}
        tt="uppercase"
        c="dimmed"
        style={{ letterSpacing: '0.04em' }}
      >
        {label}
      </Text>

      <Box
        style={{
          padding: '8px 12px',
          borderRadius: 6,
          background: 'var(--mantine-color-gray-1)',
          minHeight: 36,
        }}
      >
        <Text
          size="sm"
          c={isEmpty ? 'dimmed' : 'dark'}
          fs={isEmpty ? 'italic' : undefined}
          ff={monospace ? 'monospace' : undefined}
          style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}
        >
          {displayValue}
        </Text>
      </Box>

      {helperText && (
        <Text size="xs" c="dimmed" mt={2}>
          {helperText}
        </Text>
      )}
    </Stack>
  );
}