// frontend/src/components/fields/TextInput.jsx

import { TextInput as MantineTextInput, Text } from '@mantine/core';

export default function TextInput({
  label,
  error,
  helperText,
  required = false,
  placeholder,
  disabled = false,
  value,
  onChange,
  onBlur,
  name,
  ref,
  ...rest
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <MantineTextInput
        ref={ref}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        label={label}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        error={error}
        withAsterisk={required}
        styles={{
          label: { fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 },
          input: {
            fontSize: '0.9375rem',
            borderRadius: 6,
            borderColor: error ? undefined : '#ced4da',
          },
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