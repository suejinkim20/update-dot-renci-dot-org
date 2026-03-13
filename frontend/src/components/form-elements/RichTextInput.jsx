// frontend/src/components/form-elements/RichTextInput.jsx
//
// Markdown-based rich text input with a Write / Preview tab toggle.
// Users write in markdown; the Preview tab renders it as styled HTML.
// The submitted value is always the raw markdown string.
//
// Supported markdown:
//   **bold**, *italic*, # headings (h1–h4),
//   [text](url) links, - / * unordered lists, 1. ordered lists,
//   blank-line-separated paragraphs, line breaks.
//
// Used for: description, renciRole (projects), bio, renciScholarBio (people).

import { useState, forwardRef } from 'react';
import { Box, Tabs, Textarea, Text, TypographyStylesProvider } from '@mantine/core';

// ---------------------------------------------------------------------------
// Minimal markdown → HTML converter.
// Handles the subset of markdown users will realistically need in these fields.
// Not a full CommonMark implementation — edge cases are acceptable here.
// ---------------------------------------------------------------------------
function markdownToHtml(md) {
  if (!md) return '';

  let html = md
    // Headings
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm,  '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,   '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,    '<h1>$1</h1>')
    // Bold and italic (order matters — bold before italic)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Unordered lists — collect consecutive `- ` or `* ` lines
    .replace(/((?:^[-*] .+\n?)+)/gm, (match) => {
      const items = match
        .trim()
        .split('\n')
        .map((line) => `<li>${line.replace(/^[-*] /, '')}</li>`)
        .join('');
      return `<ul>${items}</ul>`;
    })
    // Ordered lists — collect consecutive `1. ` lines
    .replace(/((?:^\d+\. .+\n?)+)/gm, (match) => {
      const items = match
        .trim()
        .split('\n')
        .map((line) => `<li>${line.replace(/^\d+\. /, '')}</li>`)
        .join('');
      return `<ol>${items}</ol>`;
    });

  // Paragraphs: split on blank lines, wrap non-block content in <p>.
  // Block elements (headings, lists) are left unwrapped.
  const blockRe = /^<(h[1-4]|ul|ol|li)/;
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      block = block.trim();
      if (!block) return '';
      if (blockRe.test(block)) return block;
      // Convert single newlines within a paragraph to <br>.
      return `<p>${block.replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');

  return html;
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
      {/* Label */}
      {label && (
        <Text component="label" size="sm" fw={600} mb={4} display="block">
          {label}
          {required && (
            <Text component="span" c="red" ml={2} aria-hidden>
              *
            </Text>
          )}
        </Text>
      )}

      <Tabs value={tab} onChange={setTab} variant="outline">
        <Tabs.List mb={0}>
          <Tabs.Tab value="write">Write</Tabs.Tab>
          <Tabs.Tab value="preview">Preview</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="write">
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
              },
            }}
            {...rest}
          />
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
              <Text size="sm" c="dimmed" fs="italic">
                Nothing to preview.
              </Text>
            )}
          </Box>
          {/* Show error below preview panel too so it's not hidden */}
          {error && (
            <Text size="xs" c="red" mt={4}>
              {error}
            </Text>
          )}
        </Tabs.Panel>
      </Tabs>

      {helperText && !error && (
        <Text size="xs" c="dimmed" mt={4}>
          {helperText}
        </Text>
      )}
    </Box>
  );
});

export default RichTextInput;