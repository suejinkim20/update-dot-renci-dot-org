// frontend/src/components/form-blocks/OrgMiniForm.jsx

import { Stack, Paper, TextInput } from '@mantine/core';

/**
 * OrgMiniForm
 * 
 * Form for adding a new organization (not in the existing list).
 * Used in OrganizationSelector and EditOrganizations.
 * 
 * Value shape: { officialName, shortName, url }
 */
export default function OrgMiniForm({ value = {}, onChange }) {
  const handleFieldChange = (field, val) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <Paper withBorder p="sm" radius="sm">
      <Stack gap="xs">
        <TextInput
          label="Official name"
          placeholder="National Institutes of Health"
          size="sm"
          value={value.officialName || ''}
          onChange={(e) => handleFieldChange('officialName', e.target.value)}
        />
        <TextInput
          label="Short name / acronym"
          placeholder="NIH"
          size="sm"
          value={value.shortName || ''}
          onChange={(e) => handleFieldChange('shortName', e.target.value)}
        />
        <TextInput
          label="Website URL"
          placeholder="https://nih.gov"
          size="sm"
          value={value.url || ''}
          onChange={(e) => handleFieldChange('url', e.target.value)}
        />
      </Stack>
    </Paper>
  );
}