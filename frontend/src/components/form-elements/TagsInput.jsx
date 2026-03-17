// frontend/src/components/fields/TagsInput.jsx

import { TagsInput as MantineTagsInput, Text } from '@mantine/core';

export default function TagsInput({
  label,
  error,
  helperText,
  required = false,
  placeholder = 'Search or type and press Enter…',
  disabled = false,
  data = [],
  value,
  onChange,
  onBlur,
  name,
  ref,
  ...rest
}) {
  const dataStrings = data.map((item) => item.name);

  const mantineValue = Array.isArray(value)
    ? value.map((v) => (typeof v === 'object' && v !== null ? v.name : v))
    : [];

  const handleChange = (newTags) => {
    const resolved = newTags.map((tag) => {
      const match = data.find(
        (item) => item.name.toLowerCase() === tag.toLowerCase()
      );
      // Return slim object only — never the full normalized record.
      // Full records (with description, people, websites, etc.) cause
      // oversized payloads and 403 errors on submission.
      if (match) return { name: match.name, slug: match.slug, id: match.id };
      return tag;
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
        allowDuplicates={false}
        clearable
        styles={{
          label: { fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 },
          input: { fontSize: '0.9375rem', borderRadius: 6, borderColor: error ? undefined : '#ced4da' },
          error: { marginTop: 4 },
        }}
        {...rest}
      />
      {helperText && !error && (
        <Text size="sm" c="gray.7" mt={2}>
          {helperText}
        </Text>
      )}
    </div>
  );
}