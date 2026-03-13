// frontend/src/components/form-blocks/CurrentDataModal.jsx

import { Modal, Stack, Box, Text, List, Anchor } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

/**
 * CurrentDataModal
 * Shared modal for displaying current entity data before making changes.
 * Used by UpdateProjectForm and UpdatePersonForm.
 *
 * Field shape:
 *   { label, value }                - Plain text (null/empty renders as "—")
 *   { label, value, isHtml }        - Renders value as sanitized HTML
 *   { label, value, isWebsites }    - Renders value as a bulleted hyperlink list.
 *                                     value must be an array of { url, type? } objects.
 *   { label, value, isPublications }- Renders value as a list of title + date + DOI.
 *                                     value must be an array of publication objects.
 *
 * TODO: Modal is getting long for people with many publications/projects.
 * Consider a tabbed or sectioned layout post-launch.
 */
export default function CurrentDataModal({ opened, onClose, title, fields = [] }) {
  return (
    <Modal opened={opened} onClose={onClose} title={title} size="lg">
      <Stack gap="sm">
        {fields.map(({ label, value, isHtml, isWebsites, isPublications }) => (
          <Box key={label}>
            <Text size="xs" c="dimmed" fw={500} tt="uppercase" lts={0.5} mb={2}>
              {label}
            </Text>

            {isPublications ? (
              <PublicationList items={value} />
            ) : isWebsites ? (
              <WebsiteList items={value} />
            ) : isHtml ? (
              <HtmlValue value={value} />
            ) : (
              <Text size="sm">{value || '—'}</Text>
            )}
          </Box>
        ))}
      </Stack>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Sub-renderers
// ---------------------------------------------------------------------------

function HtmlValue({ value }) {
  if (!value) return <Text size="sm" c="dimmed">—</Text>;
  return (
    <Box
      style={{ fontSize: '0.875rem' }}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
    />
  );
}

function WebsiteList({ items }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <Text size="sm" c="dimmed">—</Text>;
  }
  return (
    <List size="sm" spacing={4}>
      {items.map(({ url, type }, i) => (
        <List.Item key={i}>
          <Anchor
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            {type ? `${type}: ` : ''}{url}
            <IconExternalLink size={12} style={{ flexShrink: 0 }} />
          </Anchor>
        </List.Item>
      ))}
    </List>
  );
}

function PublicationList({ items }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <Text size="sm" c="dimmed">—</Text>;
  }
  return (
    <List size="sm" spacing={8}>
      {items.map((pub, i) => (
        <List.Item key={i}>
          <Text size="sm">{pub.title || '(untitled)'}</Text>
          <Text size="xs" c="dimmed">
            {[
              pub.datePublished,
              pub.doi
                ? null // rendered as link below
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
            {pub.datePublished && pub.doi ? ' · ' : ''}
            {pub.doi && (
              <Anchor
                href={`https://doi.org/${pub.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                size="xs"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}
              >
                {pub.doi}
                <IconExternalLink size={10} style={{ flexShrink: 0 }} />
              </Anchor>
            )}
          </Text>
        </List.Item>
      ))}
    </List>
  );
}