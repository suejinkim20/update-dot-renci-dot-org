// frontend/src/components/form-blocks/CurrentDataModal.jsx

import { useState } from 'react';
import { Modal, Stack, Box, Text, List, Anchor, Divider, ScrollArea } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

/**
 * CurrentDataModal
 * Shared modal for displaying current entity data before making changes.
 * Used by UpdateProjectForm and UpdatePersonForm.
 *
 * Field shape:
 *   { label, value, section }           - Plain text (null/empty renders as "—")
 *   { label, value, section, isHtml }   - Renders value as sanitized HTML
 *   { label, value, section, isWebsites }    - Renders value as bulleted hyperlink list.
 *                                              value must be an array of { url, type? } objects.
 *   { label, value, section, isPublications }- Renders value as list of title + date + DOI.
 *                                              value must be an array of publication objects.
 *   { label, value, section, isList }   - Renders value as bulleted list using item.name.
 *                                         value must be an array of { name, ... } objects.
 *   { ..., collapse }                   - Optional long-content config.
 *                                         Lists: { previewItems, itemLabel }
 *                                         HTML:  { maxHeight, minChars }
 */
export default function CurrentDataModal({ opened, onClose, title, fields = [] }) {
  const visibleFields = fields.filter(({ value }) => value !== undefined);
  const sections = groupFieldsBySection(visibleFields);

  return (
    <Modal opened={opened} onClose={onClose} title={title} size="lg">
      <ScrollArea h="70vh" offsetScrollbars>
        <Stack gap="lg" pr="xs">
          {sections.map(({ title: sectionTitle, fields: sectionFields }, index) => (
            <Box key={sectionTitle}>
              {index > 0 && <Divider mb="lg" />}
              <Text size="sm" fw={700} c="gray.8" mb="sm">
                {sectionTitle}
              </Text>
              <Stack gap="sm">
                {sectionFields.map((field) => (
                  <Box key={field.label}>
                    <Text size="xs" c="gray.7" fw={500} tt="uppercase" lts={0.5} mb={2}>
                      {field.label}
                    </Text>
                    <FieldValue field={field} />
                  </Box>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </ScrollArea>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Sub-renderers
// ---------------------------------------------------------------------------

function groupFieldsBySection(fields) {
  const sections = new Map();

  fields.forEach((field) => {
    const sectionTitle = field.section || 'Details';
    if (!sections.has(sectionTitle)) sections.set(sectionTitle, []);
    sections.get(sectionTitle).push(field);
  });

  return Array.from(sections.entries()).map(([title, sectionFields]) => ({
    title,
    fields: sectionFields,
  }));
}

function FieldValue({ field }) {
  const { value, isHtml, isWebsites, isPublications, isList, collapse } = field;

  if (isList) return <NameList items={value} collapse={collapse} />;
  if (isPublications) return <PublicationList items={value} collapse={collapse} />;
  if (isWebsites) return <WebsiteList items={value} collapse={collapse} />;
  if (isHtml) return <HtmlValue value={value} collapse={collapse} />;
  return <Text size="sm">{value || '—'}</Text>;
}

function HtmlValue({ value, collapse }) {
  if (!value) return <Text size="sm" c="gray.7">—</Text>;

  const sanitized = sanitizeHtml(value);
  const plainText = sanitized.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const maxHeight = collapse?.maxHeight ?? 160;
  const minChars = collapse?.minChars ?? 320;
  const canExpand = plainText.length > minChars;
  const [expanded, setExpanded] = useState(false);

  return (
    <Stack gap={4}>
      <Box style={{ position: 'relative' }}>
        <Box
          style={{
            fontSize: '0.875rem',
            maxHeight: canExpand && !expanded ? maxHeight : undefined,
            overflow: canExpand && !expanded ? 'hidden' : undefined,
          }}
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
        {canExpand && !expanded && (
          <Box
            style={{
              position: 'absolute',
              inset: 'auto 0 0 0',
              height: 40,
              background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, var(--mantine-color-body) 90%)',
              pointerEvents: 'none',
            }}
          />
        )}
      </Box>
      {canExpand && (
        <Anchor component="button" type="button" size="sm" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : 'Show more'}
        </Anchor>
      )}
    </Stack>
  );
}

function NameList({ items, collapse }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <Text size="sm" c="gray.7">—</Text>;
  }

  const sorted = [...items].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '')
  );
  const previewItems = collapse?.previewItems ?? sorted.length;
  const itemLabel = collapse?.itemLabel ?? 'items';

  return (
    <ExpandableList
      items={sorted}
      previewItems={previewItems}
      itemLabel={itemLabel}
      spacing={2}
      renderItem={(item, i) => (
        <List.Item key={i}>
          <Text size="sm">{item.name || item.slug || '(unnamed)'}</Text>
        </List.Item>
      )}
    />
  );
}

function WebsiteList({ items, collapse }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <Text size="sm" c="gray.7">—</Text>;
  }

  const previewItems = collapse?.previewItems ?? items.length;
  const itemLabel = collapse?.itemLabel ?? 'websites';

  return (
    <ExpandableList
      items={items}
      previewItems={previewItems}
      itemLabel={itemLabel}
      spacing={4}
      renderItem={({ url, type }, i) => (
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
      )}
    />
  );
}

function PublicationList({ items, collapse }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <Text size="sm" c="gray.7">—</Text>;
  }

  const previewItems = collapse?.previewItems ?? items.length;
  const itemLabel = collapse?.itemLabel ?? 'publications';

  return (
    <ExpandableList
      items={items}
      previewItems={previewItems}
      itemLabel={itemLabel}
      spacing={8}
      renderItem={(pub, i) => (
        <List.Item key={i}>
          <Text size="sm">{pub.title || '(untitled)'}</Text>
          <Text size="xs" c="gray.7">
            {pub.datePublished ? `${pub.datePublished}` : ''}
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
      )}
    />
  );
}

function ExpandableList({ items, previewItems, itemLabel, spacing, renderItem }) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = items.length > previewItems;
  const visibleItems = canExpand && !expanded ? items.slice(0, previewItems) : items;

  return (
    <Stack gap={4}>
      <List size="sm" spacing={spacing}>
        {visibleItems.map(renderItem)}
      </List>
      {canExpand && (
        <Anchor component="button" type="button" size="sm" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show fewer' : `Show all ${items.length} ${itemLabel}`}
        </Anchor>
      )}
    </Stack>
  );
}
