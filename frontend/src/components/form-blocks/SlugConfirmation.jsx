// frontend/src/components/form-blocks/SlugConfirmation.jsx

import { Stack, Box, Text } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import ReadOnlyField from '../form-elements/ReadOnlyField';

/**
 * Derives entity type from an href string.
 * renci.org/staff/...   → 'person'
 * renci.org/project/... → 'project'
 * Falls back to 'project' if pattern is unrecognised.
 */
function entityFromHref(href = '') {
  if (href.includes('/staff/')) return 'person';
  return 'project';
}

function slugHelperText(entity) {
  if (entity === 'person') {
    return 'A slug is the URL identifier for this profile — e.g. "jane-smith" in renci.org/staff/jane-smith.';
  }
  return 'A slug is the URL identifier for this page — e.g. "my-project-name" in renci.org/project/my-project-name.';
}

/**
 * SlugConfirmation
 * Displays a read-only slug field with an inline explanation and a link to the live page.
 * Used on all Update and Archive forms after a person or project is selected.
 *
 * Props:
 *   slug      {string}  - The slug value to display
 *   href      {string}  - URL to the live page
 *   linkText  {string}  - Label for the external link
 *   noHelper  {boolean} - If true, suppresses the slug explanation helper text.
 *                         Use on Archive forms where the slug is just confirming
 *                         identity, not something the user needs explained.
 *
 * Entity type is derived automatically from the href pattern:
 *   renci.org/staff/...   → person example
 *   renci.org/project/... → project example
 */
export default function SlugConfirmation({ slug, href, linkText, noHelper = false }) {
  if (!slug) return null;

  const entity = entityFromHref(href);

  return (
    <Stack gap={4}>
      <ReadOnlyField label="Slug" value={slug} />
      {!noHelper && (
        <Text size="sm" c="gray.7">
          {slugHelperText(entity)}
        </Text>
      )}
      {href && (
        <Box style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Text
            component="a"
            href={href}
            target="_blank"
            rel="noreferrer"
            size="xs"
            c="#005b8e"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {linkText}
            <IconExternalLink size={12} />
          </Text>
        </Box>
      )}
    </Stack>
  );
}