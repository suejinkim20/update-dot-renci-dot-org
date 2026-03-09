import { TextInput as MantineTextInput, Text } from '@mantine/core';

/**
 * TextInput
 * Wraps Mantine TextInput for use with React Hook Form's Controller.
 *
 * Usage:
 *   <Controller
 *     name="name"
 *     control={control}
 *     render={({ field }) => (
 *       <TextInput
 *         {...field}
 *         label="Project Name"
 *         error={errors.name?.message}
 *         helperText="The public-facing name of the project."
 *         required
 *       />
 *     )}
 *   />
 */
export default function TextInput({
  label,
  error,
  helperText,
  required = false,
  placeholder,
  disabled = false,
  // React Hook Form field props (spread from Controller render)
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
          label: {
            fontWeight: 600,
            fontSize: '0.875rem',
            marginBottom: 4,
          },
          input: {
            fontSize: '0.9375rem',
            borderRadius: 6,
            borderColor: error ? undefined : '#ced4da',
            '&:focus': {
              borderColor: '#1c7ed6',
              boxShadow: '0 0 0 2px rgba(28, 126, 214, 0.15)',
            },
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