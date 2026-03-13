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

/**
 * Returns an inline helper string explaining what a slug is,
 * with a URL example appropriate to the entity type.
 */
function slugHelperText(entity) {
  if (entity === 'person') {
    return 'A slug is the URL identifier for this profile — e.g. "jane-smith" in renci.org/staff/jane-smith.';
  }
  return 'A slug is the URL identifier for this page — e.g. "my-project-name" in renci.org/project/my-project-name.';
}

/**
 * SlugConfirmation
 * Displays a read-only slug field with an inline explanation of what a slug
 * is and a right-aligned link to the live page.
 * Used on all Update and Archive forms after a person or project is selected.
 *
 * Entity type is derived automatically from the href pattern:
 *   renci.org/staff/...   → person example
 *   renci.org/project/... → project example
 *
 * Usage:
 *   <SlugConfirmation
 *     slug={selectedProject.slug}
 *     href={`https://renci.org/project/${selectedProject.slug}`}
 *     linkText="View Project Page"
 *   />
 */
export default function SlugConfirmation({ slug, href, linkText }) {
  if (!slug) return null;

  const entity = entityFromHref(href);

  return (
    <Stack gap={4}>
      <ReadOnlyField label="Slug" value={slug} />
      <Text size="xs" c="dimmed">
        {slugHelperText(entity)}
      </Text>
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