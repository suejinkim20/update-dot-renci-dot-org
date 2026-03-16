// frontend/src/components/fields/LongTextInput.jsx

import { Textarea, Text } from '@mantine/core';

export default function LongTextInput({
  label,
  error,
  helperText,
  required = false,
  placeholder,
  disabled = false,
  minRows = 3,
  maxRows = 8,
  autosize = true,
  value,
  onChange,
  onBlur,
  name,
  ref,
  ...rest
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Textarea
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
        autosize={autosize}
        minRows={minRows}
        maxRows={maxRows}
        styles={{
          label: { fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 },
          input: { fontSize: '0.9375rem', borderRadius: 6, resize: 'vertical' },
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