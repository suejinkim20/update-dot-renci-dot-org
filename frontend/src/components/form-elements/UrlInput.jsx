// frontend/src/components/fields/UrlInput.jsx

import { TextInput, Text } from '@mantine/core';
import { IconLink } from '@tabler/icons-react';

export default function UrlInput({
  label,
  error,
  helperText,
  required = false,
  placeholder = 'https://',
  disabled = false,
  showIcon = true,
  value,
  onChange,
  onBlur,
  name,
  ref,
  ...rest
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <TextInput
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
        type="url"
        inputMode="url"
        leftSection={showIcon ? <IconLink size={16} stroke={1.5} /> : undefined}
        styles={{
          label: { fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 },
          input: { fontSize: '0.9375rem', borderRadius: 6, fontFamily: 'monospace' },
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