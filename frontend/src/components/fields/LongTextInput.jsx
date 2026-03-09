import { Textarea, Text } from '@mantine/core';

/**
 * LongTextInput
 * Wraps Mantine Textarea for use with React Hook Form's Controller.
 *
 * Usage:
 *   <Controller
 *     name="renciRole"
 *     control={control}
 *     render={({ field }) => (
 *       <LongTextInput
 *         {...field}
 *         label="RENCI's Role"
 *         helperText="Describe RENCI's involvement in this project."
 *         error={errors.renciRole?.message}
 *       />
 *     )}
 *   />
 */
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
  // React Hook Form field props
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
          label: {
            fontWeight: 600,
            fontSize: '0.875rem',
            marginBottom: 4,
          },
          input: {
            fontSize: '0.9375rem',
            borderRadius: 6,
            resize: 'vertical',
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