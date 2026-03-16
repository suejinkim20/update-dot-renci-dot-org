import { useState, useCallback } from 'react';
import { Stack, Group, Button, Text, ActionIcon, Divider } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';

/**
 * RepeatableField
 * Renders a list of rows where each row is produced by `renderItem`.
 * Add/remove buttons manage the rows. Exposes the full array via onChange.
 *
 * Props:
 *   label        — section label
 *   error        — error message (string) shown below the list
 *   helperText   — helper text shown below the label
 *   required     — whether at least one entry is required
 *   addLabel     — label on the "Add" button (default: "Add item")
 *   emptyMessage — shown when there are no rows
 *   initialItem  — factory fn returning a blank item object; default returns {}
 *   renderItem   — (item, index, onChange, onRemove) => ReactNode
 *                   onChange(index, updatedItem) — call to update a row
 *                   onRemove(index)              — call to remove a row
 *   value        — array of items (from RHF Controller)
 *   onChange     — called with the full updated array (from RHF Controller)
 *
 * Usage (websites example):
 *   <Controller
 *     name="websites"
 *     control={control}
 *     render={({ field }) => (
 *       <RepeatableField
 *         {...field}
 *         label="Websites"
 *         addLabel="Add website"
 *         emptyMessage="No websites added yet."
 *         initialItem={() => ({ url: '', label: '' })}
 *         renderItem={(item, index, onItemChange, onRemove) => (
 *           <Group key={index} align="flex-end" gap="sm">
 *             <TextInput
 *               label="URL"
 *               value={item.url}
 *               onChange={(e) => onItemChange(index, { ...item, url: e.target.value })}
 *               style={{ flex: 2 }}
 *             />
 *             <TextInput
 *               label="Label (optional)"
 *               value={item.label}
 *               onChange={(e) => onItemChange(index, { ...item, label: e.target.value })}
 *               style={{ flex: 1 }}
 *             />
 *             <ActionIcon color="red" variant="subtle" onClick={() => onRemove(index)} mb={1}>
 *               <IconTrash size={16} />
 *             </ActionIcon>
 *           </Group>
 *         )}
 *       />
 *     )}
 *   />
 */
export default function RepeatableField({
  label,
  error,
  helperText,
  required = false,
  addLabel = 'Add item',
  emptyMessage = 'No items added yet.',
  initialItem = () => ({}),
  renderItem,
  // React Hook Form field props
  value = [],
  onChange,
  onBlur,
  name,
}) {
  const items = Array.isArray(value) ? value : [];

  const handleAdd = useCallback(() => {
    onChange([...items, initialItem()]);
  }, [items, onChange, initialItem]);

  const handleRemove = useCallback(
    (index) => {
      onChange(items.filter((_, i) => i !== index));
    },
    [items, onChange]
  );

  const handleItemChange = useCallback(
    (index, updated) => {
      const next = items.map((item, i) => (i === index ? updated : item));
      onChange(next);
    },
    [items, onChange]
  );

  return (
    <Stack gap="xs">
      {/* Label row */}
      <Group justify="space-between" align="center">
        <div>
          <Text fw={600} size="sm">
            {label}
            {required && (
              <Text component="span" c="red" ml={4} aria-hidden>
                *
              </Text>
            )}
          </Text>
          {helperText && (
            <Text size="xs" c="gray.7" mt={2}>
              {helperText}
            </Text>
          )}
        </div>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconPlus size={14} />}
          onClick={handleAdd}
          onBlur={onBlur}
        >
          {addLabel}
        </Button>
      </Group>

      {/* Rows */}
      {items.length === 0 ? (
        <Text size="sm" c="gray.7" fs="italic" py={4}>
          {emptyMessage}
        </Text>
      ) : (
        <Stack gap="sm">
          {items.map((item, index) => (
            <div key={index}>
              {renderItem(item, index, handleItemChange, handleRemove)}
              {index < items.length - 1 && <Divider mt="sm" />}
            </div>
          ))}
        </Stack>
      )}

      {/* Error */}
      {error && (
        <Text size="xs" c="red" mt={2}>
          {error}
        </Text>
      )}
    </Stack>
  );
}