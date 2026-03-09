// frontend/src/components/forms/UpdateProjectForm.jsx

import { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import {
  Box,
  Button,
  Group,
  Stack,
  Text,
  Title,
  Divider,
  Select,
  Modal,
  ActionIcon,
  Anchor,
  Alert,
  Paper,
  Badge,
  TextInput as MantineTextInput,
} from '@mantine/core';
import {
  IconExternalLink,
  IconEye,
  IconPlus,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import {
  TextInput,
  LongTextInput,
  AutocompleteField,
  TagsInput,
  ReadOnlyField,
} from '../fields';
import { useProjects } from '../../hooks/useProjects';
import { useGroups } from '../../hooks/useGroups';
import { usePeople } from '../../hooks/usePeople';
import { useOrganizations } from '../../hooks/useOrganizations';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const FIELD_OPTIONS = [
  { value: 'name',        label: 'Update Name' },
  { value: 'owningGroup', label: 'Update Owning Group' },
  { value: 'description', label: 'Update Description' },
  { value: 'renciRole',   label: 'Update RENCI Role' },
  { value: 'people',      label: 'Edit Contributors' },
  { value: 'fundingOrgs', label: 'Edit Funding Organizations' },
  { value: 'partnerOrgs', label: 'Edit Partner Organizations' },
  { value: 'websites',    label: 'Edit Websites' },
  { value: 'other',       label: 'Other' },
];

const GROUP_ACRONYMS = {
  'data-management': 'iRODS',
  'earth-data-science': 'EDS',
  'network-research-and-infrastructure': 'NRIG',
  'advanced-cyberinfrastructure-support': 'ACIS',
  'office-of-the-director': 'OOD',
  'research-project-management': 'RPM',
};

function buildGroupOptions(groups, excludeSlug = null) {
  const toOption = (g, groupLabel) => ({
    value: g.slug,
    label: GROUP_ACRONYMS[g.slug] ? `${g.name} (${GROUP_ACRONYMS[g.slug]})` : g.name,
    group: groupLabel,
  });
  const research = (groups?.researchGroups || [])
    .filter((g) => g.slug !== excludeSlug)
    .map((g) => toOption(g, 'Research Groups'));
  const ops = (groups?.operationsGroups || [])
    .filter((g) => g.slug !== excludeSlug)
    .map((g) => toOption(g, 'Operations Groups'));
  return [...research, ...ops];
}

// ---------------------------------------------------------------------------
// SectionLabel — consistent small label used above pill groups and add forms
// ---------------------------------------------------------------------------
function SectionLabel({ children }) {
  return (
    <Text size="xs" fw={500} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.04em' }}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// RemovePills
// Current items as pills; click to mark for removal, click again to restore.
// value: string[] of slugs marked for removal
// ---------------------------------------------------------------------------
function RemovePills({ currentItems = [], value = [], onChange, emptyMessage }) {
  const markedSlugs = new Set(value);

  const toggle = (slug) => {
    const next = markedSlugs.has(slug)
      ? value.filter((s) => s !== slug)
      : [...value, slug];
    onChange(next);
  };

  if (currentItems.length === 0) {
    return <Text size="sm" c="dimmed">{emptyMessage ?? 'None currently listed.'}</Text>;
  }

  return (
    <Group gap="xs" wrap="wrap">
      {[...currentItems]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => {
          const marked = markedSlugs.has(item.slug);
          return (
            <Badge
              key={item.slug}
              variant={marked ? 'filled' : 'light'}
              color={marked ? 'red' : 'gray'}
              size="lg"
              style={{ cursor: 'pointer', textDecoration: marked ? 'line-through' : 'none', userSelect: 'none' }}
              rightSection={
                <ActionIcon
                  size="xs"
                  color={marked ? 'red' : 'gray'}
                  variant="transparent"
                  aria-label={marked ? `Restore ${item.name}` : `Mark ${item.name} for removal`}
                >
                  <IconX size={10} />
                </ActionIcon>
              }
              onClick={() => toggle(item.slug)}
            >
              {item.name}
            </Badge>
          );
        })}
    </Group>
  );
}

// ---------------------------------------------------------------------------
// EditContributors
// Single panel: current items as removable pills + TagsInput to add new ones.
// value: { add: [...], remove: [slugs] }
// ---------------------------------------------------------------------------
function EditContributors({ currentItems = [], allItems = [], value, onChange }) {
  const addValue    = value?.add    ?? [];
  const removeValue = value?.remove ?? [];
  const notify      = (patch) => onChange({ add: addValue, remove: removeValue, ...patch });

  const existingSlugs  = new Set(currentItems.map((i) => i.slug));
  const available      = allItems.filter((i) => !existingSlugs.has(i.slug));
  const markedCount    = removeValue.length;
  const addCount       = Array.isArray(addValue) ? addValue.length : 0;

  return (
    <Stack gap="md">
      {/* Current — removable pills */}
      <Box>
        <Group justify="space-between" align="baseline" mb={6}>
          <SectionLabel>Current contributors</SectionLabel>
          {markedCount > 0 && (
            <Text size="xs" c="red">{markedCount} marked for removal</Text>
          )}
        </Group>
        <RemovePills
          currentItems={currentItems}
          value={removeValue}
          onChange={(slugs) => notify({ remove: slugs })}
          emptyMessage="No contributors currently listed."
        />
      </Box>

      <Divider variant="dashed" />

      {/* Add new */}
      <Box>
        <Group justify="space-between" align="baseline" mb={6}>
          <SectionLabel>Add contributors</SectionLabel>
          {addCount > 0 && (
            <Text size="xs" c="teal">{addCount} to be added</Text>
          )}
        </Group>
        <TagsInput
          data={available}
          value={addValue}
          onChange={(vals) => notify({ add: vals })}
          helperText="Search by name. Free text accepted if no match found."
        />
      </Box>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// OrgMiniForm — single new-org entry
// ---------------------------------------------------------------------------
function OrgMiniForm({ index, value = {}, onChange, onRemove, showRemove }) {
  const update = (field, val) => onChange({ ...value, [field]: val });

  return (
    <Paper withBorder p="sm" radius="sm">
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Text size="xs" fw={500} c="dimmed">New organization {index + 1}</Text>
          {showRemove && (
            <ActionIcon size="sm" color="red" variant="subtle" onClick={onRemove} aria-label="Remove">
              <IconTrash size={14} />
            </ActionIcon>
          )}
        </Group>
        <MantineTextInput
          label="Official name"
          placeholder="National Institutes of Health"
          required
          size="sm"
          value={value.officialName || ''}
          onChange={(e) => update('officialName', e.target.value)}
        />
        <MantineTextInput
          label="Short name / acronym"
          placeholder="NIH"
          size="sm"
          value={value.shortName || ''}
          onChange={(e) => update('shortName', e.target.value)}
        />
        <MantineTextInput
          label="Website URL"
          placeholder="https://nih.gov"
          size="sm"
          value={value.url || ''}
          onChange={(e) => update('url', e.target.value)}
        />
      </Stack>
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// EditOrganizations (Funding or Partner)
// Single panel: current items as removable pills + one or more OrgMiniForms.
// value: { add: [{ officialName, shortName, url }], remove: [slugs] }
// ---------------------------------------------------------------------------
function EditOrganizations({ currentItems = [], value, onChange, noun = 'organization' }) {
  const addValue    = value?.add    ?? [{}];
  const removeValue = value?.remove ?? [];
  const notify      = (patch) => onChange({ add: addValue, remove: removeValue, ...patch });

  const updateOrgAt = (idx, updated) =>
    notify({ add: addValue.map((o, i) => (i === idx ? updated : o)) });

  const addAnother = () => notify({ add: [...addValue, {}] });

  const removeOrgAt = (idx) => {
    const next = addValue.filter((_, i) => i !== idx);
    notify({ add: next.length > 0 ? next : [{}] });
  };

  const markedCount  = removeValue.length;
  const filledCount  = addValue.filter((o) => o.officialName?.trim()).length;

  return (
    <Stack gap="md">
      {/* Current — removable pills */}
      <Box>
        <Group justify="space-between" align="baseline" mb={6}>
          <SectionLabel>Current {noun}s</SectionLabel>
          {markedCount > 0 && (
            <Text size="xs" c="red">{markedCount} marked for removal</Text>
          )}
        </Group>
        <RemovePills
          currentItems={currentItems}
          value={removeValue}
          onChange={(slugs) => notify({ remove: slugs })}
          emptyMessage={`No ${noun}s currently listed.`}
        />
      </Box>

      <Divider variant="dashed" />

      {/* Add new */}
      <Box>
        <Group justify="space-between" align="baseline" mb={6}>
          <SectionLabel>Add {noun}s</SectionLabel>
          {filledCount > 0 && (
            <Text size="xs" c="teal">{filledCount} to be added</Text>
          )}
        </Group>
        <Stack gap="sm">
          {addValue.map((org, idx) => (
            <OrgMiniForm
              key={idx}
              index={idx}
              value={org}
              onChange={(updated) => updateOrgAt(idx, updated)}
              onRemove={() => removeOrgAt(idx)}
              showRemove={addValue.length > 1}
            />
          ))}
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={addAnother}
            style={{ alignSelf: 'flex-start' }}
          >
            Add another {noun}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// EditableWebsiteList — inline toggle + edit, add new rows at bottom
// ---------------------------------------------------------------------------
function EditableWebsiteList({ currentItems = [], value, onChange }) {
  const [items, setItems] = useState(() =>
    value?.length ? value : currentItems.map((w) => ({ ...w, _status: 'included' }))
  );

  const notify = (next) => {
    setItems(next);
    onChange({
      keep:   next.filter((i) => i._status === 'included').map(({ _status, ...r }) => r),
      remove: next.filter((i) => i._status === 'removed').map(({ _status, ...r }) => r),
      add:    next.filter((i) => i._status === 'added').map(({ _status, ...r }) => r),
    });
  };

  const toggle = (idx) => notify(items.map((item, i) => {
    if (i !== idx) return item;
    if (item._status === 'included') return { ...item, _status: 'removed' };
    if (item._status === 'removed')  return { ...item, _status: 'included' };
    if (item._status === 'added')    return { ...item, _status: 'removed' };
    return item;
  }));

  const updateField = (idx, field, val) =>
    notify(items.map((item, i) => (i === idx ? { ...item, [field]: val } : item)));

  const addRow = () => notify([...items, { url: '', label: '', _status: 'added' }]);

  const renderRow = (item, idx) => {
    const isRemoved = item._status === 'removed';
    const isNew     = item._status === 'added';
    return (
      <Group key={idx} gap="xs" align="flex-end" wrap="nowrap">
        <ActionIcon
          size="sm"
          variant="subtle"
          color={isRemoved ? 'red' : isNew ? 'teal' : 'gray'}
          onClick={() => toggle(idx)}
          mb={4}
          aria-label={isRemoved ? 'Restore' : 'Mark for removal'}
        >
          <IconX size={14} style={{ opacity: isRemoved ? 1 : 0.35 }} />
        </ActionIcon>
        <MantineTextInput
          placeholder="https://..."
          value={item.url || ''}
          onChange={(e) => updateField(idx, 'url', e.target.value)}
          disabled={isRemoved}
          style={{ flex: 2, textDecoration: isRemoved ? 'line-through' : 'none' }}
          size="sm"
          label={idx === 0 ? 'URL' : undefined}
        />
        <MantineTextInput
          placeholder="Label (optional)"
          value={item.label || ''}
          onChange={(e) => updateField(idx, 'label', e.target.value)}
          disabled={isRemoved}
          style={{ flex: 1 }}
          size="sm"
          label={idx === 0 ? 'Label' : undefined}
        />
      </Group>
    );
  };

  return (
    <Stack gap="sm">
      {items.length > 0 && (
        <Stack gap="xs">
          {items.map((item, idx) => renderRow(item, idx))}
        </Stack>
      )}
      <Button
        variant="subtle"
        size="xs"
        leftSection={<IconPlus size={14} />}
        onClick={addRow}
        style={{ alignSelf: 'flex-start' }}
      >
        Add website
      </Button>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// ChangeBlockInput
// ---------------------------------------------------------------------------
function ChangeBlockInput({ fieldKey, control, index, selectedProject, people, organizations, groups }) {
  const groupOptions = buildGroupOptions(groups, selectedProject?.owningGroup?.slug);

  switch (fieldKey) {
    case 'name':
      return (
        <Stack gap="xs">
          {selectedProject?.name && <ReadOnlyField label="Current Name" value={selectedProject.name} />}
          <Controller
            name={`changes.${index}.value`}
            control={control}
            rules={{ required: 'New name is required' }}
            render={({ field, fieldState }) => (
              <TextInput {...field} label="New Name" required error={fieldState.error?.message} />
            )}
          />
        </Stack>
      );

    case 'owningGroup':
      return (
        <Stack gap="xs">
          {selectedProject?.owningGroup && (
            <ReadOnlyField
              label="Current Owning Group"
              value={selectedProject.owningGroup.label ?? selectedProject.owningGroup.name}
            />
          )}
          <Controller
            name={`changes.${index}.value`}
            control={control}
            rules={{ required: 'New owning group is required' }}
            render={({ field, fieldState }) => (
              <Select
                {...field}
                label="New Owning Group"
                placeholder="Select a group"
                data={groupOptions}
                required
                error={fieldState.error?.message}
              />
            )}
          />
        </Stack>
      );

    case 'description':
      return (
        <Stack gap="xs">
          {selectedProject?.description && (
            <ReadOnlyField label="Current Description" value={selectedProject.description} />
          )}
          <Controller
            name={`changes.${index}.value`}
            control={control}
            rules={{ required: 'New description is required' }}
            render={({ field, fieldState }) => (
              <LongTextInput {...field} label="New Description" required error={fieldState.error?.message} />
            )}
          />
        </Stack>
      );

    case 'renciRole':
      return (
        <Stack gap="xs">
          {selectedProject?.renciRole && (
            <ReadOnlyField label="Current RENCI Role" value={selectedProject.renciRole} />
          )}
          <Controller
            name={`changes.${index}.value`}
            control={control}
            rules={{ required: 'New RENCI Role is required' }}
            render={({ field, fieldState }) => (
              <TextInput {...field} label="New RENCI Role" required error={fieldState.error?.message} />
            )}
          />
        </Stack>
      );

    case 'people':
      return (
        <Controller
          name={`changes.${index}.value`}
          control={control}
          defaultValue={{ add: [], remove: [] }}
          render={({ field }) => (
            <EditContributors
              currentItems={selectedProject?.people || []}
              allItems={(people || []).map((p) => ({ name: p.name, slug: p.slug, id: p.id }))}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      );

    case 'fundingOrgs':
      return (
        <Controller
          name={`changes.${index}.value`}
          control={control}
          defaultValue={{ add: [{}], remove: [] }}
          render={({ field }) => (
            <EditOrganizations
              currentItems={selectedProject?.fundingOrgs || []}
              value={field.value}
              onChange={field.onChange}
              noun="funding organization"
            />
          )}
        />
      );

    case 'partnerOrgs':
      return (
        <Controller
          name={`changes.${index}.value`}
          control={control}
          defaultValue={{ add: [{}], remove: [] }}
          render={({ field }) => (
            <EditOrganizations
              currentItems={selectedProject?.partnerOrgs || []}
              value={field.value}
              onChange={field.onChange}
              noun="partner organization"
            />
          )}
        />
      );

    case 'websites':
      return (
        <Controller
          name={`changes.${index}.value`}
          control={control}
          defaultValue={null}
          render={({ field }) => (
            <EditableWebsiteList
              currentItems={selectedProject?.websites || []}
              value={field.value?.items || null}
              onChange={(val) => field.onChange(val)}
            />
          )}
        />
      );

    case 'other':
      return (
        <Controller
          name={`changes.${index}.value`}
          control={control}
          rules={{ required: 'Please describe the change' }}
          render={({ field, fieldState }) => (
            <LongTextInput
              {...field}
              label="Describe the change"
              helperText="Use this for edge cases, including slug changes."
              required
              error={fieldState.error?.message}
            />
          )}
        />
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// CurrentDataModal
// ---------------------------------------------------------------------------
function CurrentDataModal({ opened, onClose, project }) {
  if (!project) return null;

  const fields = [
    { label: 'Name',                  value: project.name },
    { label: 'Slug',                  value: project.slug },
    { label: 'Active',                value: project.active === true ? 'Yes' : project.active === false ? 'No' : null },
    { label: 'Description',           value: project.description },
    { label: "RENCI's Role",          value: project.renciRole },
    { label: 'Owning Group',          value: project.owningGroup?.label ?? project.owningGroup?.name },
    { label: 'Contributors',          value: project.people?.length
        ? [...project.people].sort((a, b) => a.name.localeCompare(b.name)).map((p) => p.name).join(', ')
        : null },
    { label: 'Funding Organizations', value: project.fundingOrgs?.length  ? project.fundingOrgs.map((o) => o.name).join(', ') : null },
    { label: 'Partner Organizations', value: project.partnerOrgs?.length  ? project.partnerOrgs.map((o) => o.name).join(', ') : null },
    { label: 'Websites',              value: project.websites?.length
        ? project.websites.map((w) => w.label ? `${w.label}: ${w.url}` : w.url).join(', ')
        : null },
  ];

  return (
    <Modal opened={opened} onClose={onClose} title={`Current data: ${project.name}`} size="lg">
      <Stack gap="sm">
        {fields.map(({ label, value }) => (
          <Box key={label}>
            <Text size="xs" c="dimmed" fw={500} tt="uppercase" lts={0.5}>{label}</Text>
            <Text size="sm">{value || '—'}</Text>
          </Box>
        ))}
      </Stack>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// UpdateProjectForm
// ---------------------------------------------------------------------------
export default function UpdateProjectForm() {
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const { groups } = useGroups();
  const { people } = usePeople();
  const { organizations } = useOrganizations();

  const [selectedProject, setSelectedProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [fieldSelections, setFieldSelections] = useState({});

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { submitterEmail: '', slug: '', changes: [] },
  });

  const { fields: changeFields, append, remove } = useFieldArray({ control, name: 'changes' });

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setValue('slug', project?.slug || '');
    reset((prev) => ({ ...prev, slug: project?.slug || '', changes: [] }));
    setFieldSelections({});
  };

  const handleFieldSelect = (index, val) => {
    setFieldSelections((prev) => ({ ...prev, [index]: val }));
    setValue(`changes.${index}.field`, val);

    // Reset the block's value to a clean default so state from a previous
    // field selection doesn't bleed into the newly selected field.
    const relationalDefaults = {
      people:      { add: [], remove: [] },
      fundingOrgs: { add: [{}], remove: [] },
      partnerOrgs: { add: [{}], remove: [] },
    };
    const defaultValue = relationalDefaults[val] ?? null;
    setValue(`changes.${index}.value`, defaultValue);
  };

  const addChangeBlock = () => append({ field: '', value: null });

  const removeChangeBlock = (index) => {
    remove(index);
    setFieldSelections((prev) => {
      const next = {};
      Object.entries(prev).forEach(([k, v]) => {
        const ki = parseInt(k);
        if (ki < index) next[ki] = v;
        else if (ki > index) next[ki - 1] = v;
      });
      return next;
    });
  };

  const onSubmit = async (data) => {
    setSubmitError(null);

    const validChanges = data.changes.filter((_, i) => fieldSelections[i]);
    if (validChanges.length === 0) {
      setSubmitError('Please add at least one change block.');
      return;
    }

    const changes = data.changes
      .map((change, i) => {
        const fieldKey = fieldSelections[i];
        if (!fieldKey) return null;
        const label = FIELD_OPTIONS.find((o) => o.value === fieldKey)?.label || fieldKey;
        return { field: fieldKey, label, value: change.value };
      })
      .filter(Boolean);

    const payload = { submitterEmail: data.submitterEmail, slug: data.slug, changes };

    try {
      const res = await fetch('/api/projects/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 503) {
        const body = await res.json();
        if (body.code === 'VPN_REQUIRED') {
          setSubmitError('Could not connect to the data API. Make sure you are connected to the VPN and try again.');
          return;
        }
      }

      if (!res.ok) {
        const body = await res.json();
        setSubmitError(body.errors?.map((e) => e.message).join(', ') || 'Submission failed. Please try again.');
        return;
      }

      setSubmitSuccess(true);
      setSelectedProject(null);
      setFieldSelections({});
      reset({ submitterEmail: '', slug: '', changes: [] });
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.');
    }
  };

  if (submitSuccess) {
    return (
      <Alert color="green" title="Request submitted">
        <Text size="sm">Your update request has been submitted. Check your email for a confirmation from the team.</Text>
        <Button mt="md" variant="subtle" size="sm" onClick={() => setSubmitSuccess(false)}>
          Submit another request
        </Button>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="xl">

        {/* Project identification */}
        <Box>
          <Title order={4} mb="sm">Identify the Project</Title>
          <Stack gap="sm">
            {projectsError ? (
              <Alert color="red">Could not load projects. Make sure you are connected to the VPN.</Alert>
            ) : (
              <>
                <Group gap="sm" align="flex-end">
                  <Box style={{ flex: 1 }}>
                    <AutocompleteField
                      label="Project Name"
                      required
                      data={projects || []}
                      value={selectedProject}
                      onChange={handleProjectSelect}
                      loading={projectsLoading}
                    />
                  </Box>
                  {selectedProject && (
                    <ActionIcon
                      variant="subtle"
                      size="lg"
                      mb={1}
                      onClick={() => setModalOpen(true)}
                      title="View current project data"
                      aria-label="View current project data"
                    >
                      <IconEye size={18} />
                    </ActionIcon>
                  )}
                </Group>

                {selectedProject && (
                  <Group justify="space-between" align="center">
                    <ReadOnlyField label="Slug" value={selectedProject.slug} />
                    <Anchor
                      href={`https://renci.org/projects/${selectedProject.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                    >
                      View Project Page <IconExternalLink size={14} />
                    </Anchor>
                  </Group>
                )}
              </>
            )}
          </Stack>
        </Box>

        {/* Change blocks */}
        {selectedProject && (
          <>
            <Divider />
            <Box>
              <Title order={4} mb="xs">Declare Changes</Title>
              <Text size="sm" c="dimmed" mb="md">
                Add one block per change. Each block becomes a separate action item on the ticket.
              </Text>

              <Stack gap="md">
                {changeFields.map((item, index) => (
                  <Paper key={item.id} withBorder p="md" radius="sm">
                    <Stack gap="sm">
                      <Group justify="space-between" align="center">
                        <Text size="sm" fw={500}>Change {index + 1}</Text>
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          size="sm"
                          onClick={() => removeChangeBlock(index)}
                          aria-label="Remove change block"
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>

                      <Select
                        label="What are you changing?"
                        placeholder="Select a field"
                        data={FIELD_OPTIONS}
                        value={fieldSelections[index] || null}
                        onChange={(val) => handleFieldSelect(index, val)}
                        required
                      />

                      {fieldSelections[index] && (
                        <ChangeBlockInput
                          key={fieldSelections[index]}
                          fieldKey={fieldSelections[index]}
                          control={control}
                          index={index}
                          selectedProject={selectedProject}
                          people={people}
                          organizations={organizations}
                          groups={groups}
                        />
                      )}
                    </Stack>
                  </Paper>
                ))}

                <Button
                  variant="light"
                  leftSection={<IconPlus size={16} />}
                  onClick={addChangeBlock}
                  style={{ alignSelf: 'flex-start' }}
                >
                  Add change
                </Button>

                {submitError && <Alert color="red" mt="xs">{submitError}</Alert>}
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Controller
                name="submitterEmail"
                control={control}
                rules={{
                  required: 'Your email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
                }}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label="Your Email"
                    required
                    helperText="You'll receive a confirmation email when the team reviews your request."
                    error={errors.submitterEmail?.message}
                  />
                )}
              />
            </Box>

            <Box>
              <Button type="submit" loading={isSubmitting} fullWidth>
                Submit Update Request
              </Button>
            </Box>
          </>
        )}
      </Stack>

      <CurrentDataModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        project={selectedProject}
      />
    </form>
  );
}