// frontend/src/components/fields/RichTextInput.jsx
//
// Markdown-based rich text input with a Write / Preview tab toggle.
// Users write in markdown; the Preview tab renders it as styled HTML.
// The submitted value is always the raw markdown string.
//
// Supported formatting: links only — [link text](https://url.com)
// Other markdown formatting is intentionally not supported, as content
// will be rendered on the RENCI website where styling is controlled by
// the site's CSS, not by the submitter.
//
// The Write textarea is vertically resizable via the bottom-right handle.
//
// Used for: description, renciRole (projects), bio, renciScholarBio (people).

import { useState, forwardRef } from 'react';
import { Box, Tabs, Textarea, Text, TypographyStylesProvider } from '@mantine/core';

// ---------------------------------------------------------------------------
// Link-only markdown → HTML converter.
// Only converts [text](url) syntax. All other markdown is ignored and
// rendered as plain text, preventing users from adding unsupported formatting.
// ---------------------------------------------------------------------------
function markdownToHtml(md) {
  if (!md) return '';

  // Escape HTML entities first to prevent XSS from raw text
  const escaped = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Convert [text](url) links only
  const withLinks = escaped.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Convert double newlines to paragraph breaks, single newlines to <br>
  const withParagraphs = withLinks
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');

  return withParagraphs;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const RichTextInput = forwardRef(function RichTextInput(
  {
    label,
    error,
    helperText,
    required,
    value,
    onChange,
    onBlur,
    name,
    rows = 6,
    ...rest
  },
  ref
) {
  const [tab, setTab] = useState('write');
  const previewHtml = markdownToHtml(value || '');

  return (
    <Box>
      {label && (
        <Text component="label" size="sm" fw={600} mb={4} display="block">
          {label}
          {required && (
            <Text component="span" c="red" ml={2} aria-hidden>*</Text>
          )}
        </Text>
      )}

      <Tabs value={tab} onChange={setTab} variant="outline">
        <Tabs.List mb={0}>
          <Tabs.Tab value="write">Write</Tabs.Tab>
          <Tabs.Tab value="preview">Preview</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="write">
          <Box>
            <Textarea
              ref={ref}
              name={name}
              value={value || ''}
              onChange={onChange}
              onBlur={onBlur}
              rows={rows}
              error={error}
              styles={{
                input: {
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  resize: 'vertical',
                  minHeight: `${rows * 1.6}rem`,
                },
              }}
              {...rest}
            />
            {/* Link formatting instructions */}
            <Box
              style={{
                marginTop: 6,
                padding: '6px 10px',
                background: 'var(--mantine-color-gray-0)',
                border: '1px solid var(--mantine-color-gray-2)',
                borderRadius: 'var(--mantine-radius-sm)',
                fontSize: '0.8rem',
                color: 'var(--mantine-color-dimmed)',
              }}
            >
              To add a link: <code style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>[link text](https://url.com)</code>
              &nbsp;— other formatting is not supported and will appear as plain text.
            </Box>
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="preview">
          <Box
            style={{
              minHeight: `${rows * 1.6}rem`,
              padding: '0.625rem 0.75rem',
              border: '1px solid var(--mantine-color-gray-4)',
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomLeftRadius: 'var(--mantine-radius-sm)',
              borderBottomRightRadius: 'var(--mantine-radius-sm)',
              backgroundColor: 'var(--mantine-color-gray-0)',
              fontSize: '0.875rem',
            }}
          >
            {previewHtml ? (
              <TypographyStylesProvider>
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </TypographyStylesProvider>
            ) : (
              <Text size="sm" c="gray.7" fs="italic">Nothing to preview.</Text>
            )}
          </Box>
          {error && (
            <Text size="xs" c="red" mt={4}>{error}</Text>
          )}
        </Tabs.Panel>
      </Tabs>

      {helperText && !error && (
        <Text size="sm" c="gray.7" mt={4}>{helperText}</Text>
      )}
    </Box>
  );
});

export default RichTextInput;