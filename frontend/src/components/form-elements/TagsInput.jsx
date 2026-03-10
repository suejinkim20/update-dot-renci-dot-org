import { TagsInput as MantineTagsInput, Text } from '@mantine/core';

/**
 * TagsInput
 * Wraps Mantine TagsInput for use with React Hook Form's Controller.
 * Supports autocomplete from a data list (resolved entries) AND free-text fallback.
 *
 * data shape: Array<{ name: string, slug: string, id: string|number }>
 *
 * Output value shape: mixed array —
 *   - Resolved entries (matched from data):  { name, slug, id }
 *   - Unresolved entries (free text):         plain string
 *
 * Usage:
 *   <Controller
 *     name="people"
 *     control={control}
 *     render={({ field }) => (
 *       <TagsInput
 *         {...field}
 *         label="Contributors"
 *         data={people}
 *         error={errors.people?.message}
 *         helperText="Search by name or add free text."
 *       />
 *     )}
 *   />
 */
export default function TagsInput({
  label,
  error,
  helperText,
  required = false,
  placeholder = 'Search or type and press Enter…',
  disabled = false,
  data = [],
  // React Hook Form field props (spread from Controller render)
  value,       // mixed array: { name, slug, id } | string
  onChange,    // receives mixed array
  onBlur,
  name,
  ref,
  ...rest
}) {
  // Mantine TagsInput works with string values internally.
  // We use the item's name as the display/tag string.
  // On change, we map each string back to its full object if found in data,
  // or leave it as a plain string (free-text fallback).

  const dataStrings = data.map((item) => item.name);

  // Convert mixed RHF value array → string array for Mantine
  const mantineValue = Array.isArray(value)
    ? value.map((v) => (typeof v === 'object' && v !== null ? v.name : v))
    : [];

  const handleChange = (newTags) => {
    // Map each tag string back to full object if it matches data, else plain string
    const resolved = newTags.map((tag) => {
      const match = data.find(
        (item) => item.name.toLowerCase() === tag.toLowerCase()
      );
      return match ?? tag;
    });
    onChange(resolved);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <MantineTagsInput
        ref={ref}
        name={name}
        value={mantineValue}
        onChange={handleChange}
        onBlur={onBlur}
        label={label}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        error={error}
        withAsterisk={required}
        data={dataStrings}
        // Allow values not in the data list (free-text fallback)
        allowDuplicates={false}
        clearable
        styles={{
          label: {
            fontWeight: 600,
            fontSize: '0.875rem',
            marginBottom: 4,
          },
          input: {
            fontSize: '0.9375rem',
            borderRadius: 6,
            borderColor: error ? undefined : '#ced4da',
          },
          error: {
            marginTop: 4,
          },
        }}
        {...rest}
      />
      {helperText && !error && (
        <Text size="xs" c="dimmed" mt={2}>
          {helperText}
        </Text>
      )}
    </div>
  );
}