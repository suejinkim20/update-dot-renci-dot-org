import { useState, useCallback } from 'react';
import { Stack, Select, Paper, Text, ActionIcon, Group, Button } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

/**
 * FieldSelector
 * Renders a field-selector dropdown. When a field is selected, the matching
 * input component is rendered below. Used in Update forms for the "change block"
 * pattern — one FieldSelector block = one declared change = one Monday subitem.
 *
 * Props:
 *   fields       — Array<{ value: string, label: string, render: (onChange, value) => ReactNode }>
 *                  `render` receives (onChange, currentValue) and returns the input to show.
 *   value        — { field: string, data: any } | null  (from RHF Controller)
 *   onChange     — called with { field: string, data: any } | null
 *   error        — error string shown below
 *   onRemove     — optional; called to remove this block entirely from the parent list
 *   blockIndex   — optional; display number shown in the block header (1-based)
 *
 * Usage:
 *   <Controller
 *     name={`changes.${index}`}
 *     control={control}
 *     render={({ field }) => (
 *       <FieldSelector
 *         {...field}
 *         fields={PROJECT_UPDATE_FIELDS}
 *         error={errors.changes?.[index]?.message}
 *         blockIndex={index + 1}
 *         onRemove={() => remove(index)}
 *       />
 *     )}
 *   />
 *
 * PROJECT_UPDATE_FIELDS example:
 *   [
 *     {
 *       value: 'name',
 *       label: 'Update Name',
 *       render: (onChange, val) => (
 *         <TextInput label="New Name" value={val ?? ''} onChange={e => onChange(e.target.value)} />
 *       ),
 *     },
 *     ...
 *   ]
 */
export default function FieldSelector({
  fields = [],
  value,           // { field: string, data: any } | null
  onChange,
  onBlur,
  error,
  onRemove,
  blockIndex,
}) {
  const selectedField = value?.field ?? null;
  const selectedData = value?.data ?? null;

  const selectedDef = fields.find((f) => f.value === selectedField);

  const handleFieldSelect = useCallback(
    (fieldValue) => {
      if (!fieldValue) {
        onChange(null);
        return;
      }
      // Reset data when field changes
      onChange({ field: fieldValue, data: null });
    },
    [onChange]
  );

  const handleDataChange = useCallback(
    (data) => {
      onChange({ field: selectedField, data });
    },
    [onChange, selectedField]
  );

  return (
    <Paper
      withBorder
      radius="md"
      p="md"
      style={{
        borderColor: error ? 'var(--mantine-color-red-4)' : 'var(--mantine-color-gray-3)',
        background: 'var(--mantine-color-gray-0)',
      }}
    >
      <Stack gap="sm">
        {/* Block header */}
        <Group justify="space-between" align="center">
          <Text fw={600} size="sm" c="gray.7">
            {blockIndex != null ? `Change ${blockIndex}` : 'Change'}
          </Text>
          {onRemove && (
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={onRemove}
              aria-label="Remove this change block"
            >
              <IconX size={14} />
            </ActionIcon>
          )}
        </Group>

        {/* Field selector dropdown */}
        <Select
          label="What would you like to change?"
          placeholder="Select a field…"
          data={fields}
          value={selectedField}
          onChange={handleFieldSelect}
          onBlur={onBlur}
          clearable
          styles={{
            label: {
              fontWeight: 500,
              fontSize: '0.875rem',
            },
            input: {
              fontSize: '0.9375rem',
              borderRadius: 6,
            },
          }}
        />

        {/* Render the input for the selected field */}
        {selectedDef && (
          <div
            style={{
              paddingTop: 4,
              paddingLeft: 12,
              borderLeft: '3px solid var(--mantine-color-blue-4)',
            }}
          >
            {selectedDef.render(handleDataChange, selectedData)}
          </div>
        )}

        {/* Error */}
        {error && (
          <Text size="xs" c="red">
            {error}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}