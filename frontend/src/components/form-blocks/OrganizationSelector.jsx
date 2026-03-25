// frontend/src/components/form-blocks/OrganizationSelector.jsx

import { useState } from 'react';
import { Stack, Text, Divider, Button, Group } from '@mantine/core';
import { IconPlus, IconX } from '@tabler/icons-react';
import TagsInput from '../form-elements/TagsInput';
import SectionLabel from './SectionLabel';
import OrgMiniForm from './OrgMiniForm';

/**
 * OrganizationSelector
 * 
 * Hybrid selector for organizations:
 * - Section 1: TagsInput for selecting existing organizations (multi-select)
 * - Dashed divider
 * - Section 2: OrgMiniForm for adding ONE new organization (if not in list)
 * 
 * Used in:
 * - AddProjectForm (fundingOrgs, partnerOrgs)
 * - UpdateProjectForm > EditOrganizations (fundingOrgs, partnerOrgs)
 * 
 * Value shape:
 * {
 *   existing: [{ name, slug, id }, ...],  // Selected from list
 *   new: { officialName, shortName, url } // New org entry (optional)
 * }
 */
export default function OrganizationSelector({
  label,
  allOrganizations = [],
  loading = false,
  value = { existing: [], new: null },
  onChange,
  error,
  helperText,
}) {
  const [showNewForm, setShowNewForm] = useState(false);

  const handleExistingChange = (vals) => {
    onChange({ ...value, existing: vals });
  };

  const handleNewChange = (newOrg) => {
    onChange({ ...value, new: newOrg });
  };

  const handleToggleNewForm = () => {
    setShowNewForm(!showNewForm);
    // Clear new org data when hiding
    if (showNewForm) {
      onChange({ ...value, new: null });
    }
  };

  const hasNewOrgData = value.new?.officialName?.trim();

  return (
    <Stack gap="md">
      {/* Section 1: Select from existing organizations */}
      <div>
        <SectionLabel>{label}</SectionLabel>
        <TagsInput
          data={allOrganizations}
          value={value.existing}
          onChange={handleExistingChange}
          placeholder={loading ? 'Loading organizations…' : 'Search or type and press Enter…'}
          disabled={loading}
          error={error}
          helperText={helperText || "Search for existing organizations."}
        />
        {value.existing.length > 0 && (
          <Text size="xs" c="teal" mt={4}>
            {value.existing.length} selected
          </Text>
        )}
      </div>

      <Divider variant="dashed" />

      {/* Section 2: Add new organization (toggleable) */}
      <div>
        {!showNewForm ? (
          <Button
            variant="subtle"
            size="sm"
            leftSection={<IconPlus size={16} />}
            onClick={handleToggleNewForm}
            style={{ alignSelf: 'flex-start' }}
          >
            Can't find it? Add new organization
          </Button>
        ) : (
          <>
            <Group justify="space-between" align="center" mb="xs">
              <SectionLabel>Add a new organization</SectionLabel>
              <Button
                variant="subtle"
                size="xs"
                color="gray"
                leftSection={<IconX size={14} />}
                onClick={handleToggleNewForm}
              >
                Cancel
              </Button>
            </Group>
            <Text size="sm" c="gray.7" mb="xs">
              Only use this if the organization doesn't exist in the list above.
            </Text>
            <OrgMiniForm
              value={value.new || {}}
              onChange={handleNewChange}
            />
            {hasNewOrgData && (
              <Text size="xs" c="teal" mt={4}>
                1 new organization to be added
              </Text>
            )}
          </>
        )}
      </div>
    </Stack>
  );
}