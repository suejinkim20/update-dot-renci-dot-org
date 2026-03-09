// frontend/src/components/forms/UpdatePersonForm.jsx

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
  MultiSelect,
  Switch,
  Modal,
  ActionIcon,
  Anchor,
  Alert,
  Paper,
  Badge,
  Checkbox,
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
import { usePeople } from '../../hooks/usePeople';
import { useProjects } from '../../hooks/useProjects';
import { useGroups } from '../../hooks/useGroups';

// ── Constants ─────────────────────────────────────────────────────────────────

const FIELD_OPTIONS = [
  { value: 'name',          label: 'Update Name' },
  { value: 'jobTitle',      label: 'Update Job Title' },
  { value: 'bio',           label: 'Add/Update Bio' },
  { value: 'renciScholar',  label: 'Update RENCI Scholar Status' },
  { value: 'groups',        label: 'Edit Groups' },
  { value: 'projects',      label: 'Edit Projects' },
  { value: 'websites',      label: 'Edit Websites' },
  { value: 'headshot',      label: 'Update Headshot' },
  { value: 'other',         label: 'Other' },
];

const GROUP_ACRONYMS = {
  'earth-data-science': 'EDS',
  'networking-research-infrastructure': 'NRIG',
  'acis': 'ACIS',
  'ood': 'OOD',
  'research-project-management': 'RPM',
};

function groupLabel(group) {
  const acronym = GROUP_ACRONYMS[group.slug];
  return acronym ? `${group.name} (${acronym})` : group.name;
}

// ── SectionLabel ──────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <Text size="xs" fw={500} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.04em' }}>
      {children}
    </Text>
  );
}

// ── RemovePills ───────────────────────────────────────────────────────────────
// Current items as pills; click to mark for removal, click again to restore.
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
              style={{
                cursor: 'pointer',
                textDecoration: marked ? 'line-through' : 'none',
                userSelect: 'none',
              }}
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

// ── EditableWebsiteList ───────────────────────────────────────────────────────
// Mirrors the same component in UpdateProjectForm exactly.
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

// ── ChangeBlockInput ──────────────────────────────────────────────────────────
function ChangeBlockInput({ fieldKey, control, index, selectedPerson, allProjects, researchGroups, operationsGroups }) {

  const allGroupOptions = [
    {
      group: 'Research Groups',
      items: (researchGroups || []).map((g) => ({ value: g.slug, label: groupLabel(g) })),
    },
    {
      group: 'Operations Groups',
      items: (operationsGroups || []).map((g) => ({ value: g.slug, label: groupLabel(g) })),
    },
  ];

  switch (fieldKey) {

    // ── Update Name ────────────────────────────────────────────────────────────
    // Expands to three optional sub-fields; at least one checkbox must be checked.
    case 'name':
      return (
        <NameBlock
          control={control}
          index={index}
          selectedPerson={selectedPerson}
        />
      );

    // ── Update Job Title ───────────────────────────────────────────────────────
    case 'jobTitle':
      return (
        <Stack gap="xs">
          {selectedPerson?.jobTitle && (
            <ReadOnlyField label="Current Job Title" value={selectedPerson.jobTitle} />
          )}
          <Controller
            name={`changes.${index}.value`}
            control={control}
            rules={{ required: 'New job title is required' }}
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                label="New Job Title"
                required
                helperText="Semicolon-separated if multiple titles."
                error={fieldState.error?.message}
              />
            )}
          />
        </Stack>
      );

    // ── Add/Update Bio ─────────────────────────────────────────────────────────
    case 'bio':
      return (
        <Stack gap="xs">
          {selectedPerson?.bio && (
            <ReadOnlyField label="Current Bio" value={selectedPerson.bio} />
          )}
          <Controller
            name={`changes.${index}.value`}
            control={control}
            rules={{ required: 'Bio content is required' }}
            render={({ field, fieldState }) => (
              <LongTextInput
                {...field}
                label="New Bio"
                required
                helperText="Note: this field will use a rich text editor in a future update."
                error={fieldState.error?.message}
              />
            )}
          />
        </Stack>
      );

    // ── Update RENCI Scholar Status ────────────────────────────────────────────
    case 'renciScholar':
      return (
        <RenciScholarBlock
          control={control}
          index={index}
          selectedPerson={selectedPerson}
        />
      );

    // ── Edit Groups ────────────────────────────────────────────────────────────
    case 'groups':
      return (
        <Controller
          name={`changes.${index}.value`}
          control={control}
          defaultValue={{ add: [], remove: [] }}
          render={({ field }) => (
            <EditGroups
              currentItems={selectedPerson?.groups || []}
              allGroupOptions={allGroupOptions}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      );

    // ── Edit Projects ──────────────────────────────────────────────────────────
    case 'projects':
      return (
        <Controller
          name={`changes.${index}.value`}
          control={control}
          defaultValue={{ add: [], remove: [] }}
          render={({ field }) => (
            <EditProjects
              currentItems={selectedPerson?.projects || []}
              allProjects={allProjects || []}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      );

    // ── Edit Websites ──────────────────────────────────────────────────────────
    case 'websites':
      return (
        <Controller
          name={`changes.${index}.value`}
          control={control}
          defaultValue={null}
          render={({ field }) => (
            <EditableWebsiteList
              currentItems={selectedPerson?.websites || []}
              value={field.value?.items || null}
              onChange={(val) => field.onChange(val)}
            />
          )}
        />
      );

    // ── Update Headshot ────────────────────────────────────────────────────────
    case 'headshot':
      return (
        <Paper radius="md" p="md" style={{ background: '#f0f7fc', border: '1px solid #bfdbf7' }}>
          <Text size="sm">
            Please upload a new headshot to the shared org folder labeled "
            {[selectedPerson?.firstName, selectedPerson?.lastName].filter(Boolean).join(' ') ||
              selectedPerson?.name ||
              '[Person Name]'}
            ". The implementing team will retrieve it from there.
          </Text>
        </Paper>
      );

    // ── Other ──────────────────────────────────────────────────────────────────
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
              helperText="Use this for edge cases not covered by the options above."
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

// ── NameBlock ─────────────────────────────────────────────────────────────────
// Three optional sub-fields: First Name, Last Name, Preferred Name.
// Each has a checkbox; checking reveals the input. At least one must be checked.
function NameBlock({ control, index, selectedPerson }) {
  const [checked, setChecked] = useState({ firstName: false, lastName: false, preferredName: false });

  const toggle = (key) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const subFields = [
    { key: 'firstName',    label: 'First Name',    current: selectedPerson?.firstName },
    { key: 'lastName',     label: 'Last Name',     current: selectedPerson?.lastName },
    { key: 'preferredName', label: 'Preferred Name', current: selectedPerson?.preferredName },
  ];

  return (
    <Stack gap="sm">
      <Text size="xs" c="dimmed">Check each name component you want to update.</Text>
      {subFields.map(({ key, label, current }) => (
        <Stack key={key} gap="xs">
          <Checkbox
            label={label}
            checked={checked[key]}
            onChange={() => toggle(key)}
          />
          {checked[key] && (
            <Stack gap={4} pl="xl">
              {current && <ReadOnlyField label={`Current ${label}`} value={current} />}
              <Controller
                name={`changes.${index}.value.${key}`}
                control={control}
                rules={{ required: `New ${label.toLowerCase()} is required` }}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    label={`New ${label}`}
                    required
                    error={fieldState.error?.message}
                  />
                )}
              />
            </Stack>
          )}
        </Stack>
      ))}
    </Stack>
  );
}

// ── RenciScholarBlock ─────────────────────────────────────────────────────────
function RenciScholarBlock({ control, index, selectedPerson }) {
  return (
    <Stack gap="sm">
      {selectedPerson?.renciScholar !== undefined && (
        <ReadOnlyField
          label="Current Status"
          value={selectedPerson.renciScholar ? 'RENCI Scholar: Yes' : 'RENCI Scholar: No'}
        />
      )}
      <Controller
        name={`changes.${index}.value.renciScholar`}
        control={control}
        render={({ field }) => (
          <Switch
            label="RENCI Scholar"
            checked={!!field.value}
            onChange={(e) => field.onChange(e.currentTarget.checked)}
          />
        )}
      />
      <Controller
        name={`changes.${index}.value.renciScholar`}
        control={control}
        render={({ field: switchField }) =>
          switchField.value ? (
            <Controller
              name={`changes.${index}.value.renciScholarBio`}
              control={control}
              render={({ field, fieldState }) => (
                <LongTextInput
                  {...field}
                  label="RENCI Scholar Bio"
                  helperText="Note: this field will use a rich text editor in a future update."
                  error={fieldState.error?.message}
                />
              )}
            />
          ) : null
        }
      />
    </Stack>
  );
}

// ── EditGroups ────────────────────────────────────────────────────────────────
// Single-panel add/remove. Groups is a small fixed list so MultiSelect is used
// for the add input (not TagsInput) — no free text needed.
function EditGroups({ currentItems = [], allGroupOptions, value, onChange }) {
  const addValue    = value?.add    ?? [];
  const removeValue = value?.remove ?? [];
  const notify      = (patch) => onChange({ add: addValue, remove: removeValue, ...patch });

  // Exclude already-assigned slugs and already-to-be-added slugs from the add dropdown
  const currentSlugs = new Set(currentItems.map((g) => g.slug));
  const filteredGroupOptions = allGroupOptions.map((optGroup) => ({
    ...optGroup,
    items: optGroup.items.filter(
      (opt) => !currentSlugs.has(opt.value) && !addValue.includes(opt.value)
    ),
  }));

  const markedCount = removeValue.length;
  const addCount    = addValue.length;

  return (
    <Stack gap="md">
      <Box>
        <Group justify="space-between" align="baseline" mb={6}>
          <SectionLabel>Current groups</SectionLabel>
          {markedCount > 0 && (
            <Text size="xs" c="red">{markedCount} marked for removal</Text>
          )}
        </Group>
        <RemovePills
          currentItems={currentItems}
          value={removeValue}
          onChange={(slugs) => notify({ remove: slugs })}
          emptyMessage="No groups currently assigned."
        />
      </Box>

      <Divider variant="dashed" />

      <Box>
        <Group justify="space-between" align="baseline" mb={6}>
          <SectionLabel>Add groups</SectionLabel>
          {addCount > 0 && (
            <Text size="xs" c="teal">{addCount} to be added</Text>
          )}
        </Group>
        <MultiSelect
          data={filteredGroupOptions}
          value={addValue}
          onChange={(val) => notify({ add: val })}
          placeholder="Select groups to add"
          searchable
          styles={{
            input: { fontSize: '0.9375rem', borderRadius: 6 },
          }}
        />
      </Box>
    </Stack>
  );
}

// ── EditProjects ──────────────────────────────────────────────────────────────
// Single-panel add/remove. Projects uses TagsInput autocomplete with free-text
// fallback — same pattern as EditContributors in UpdateProjectForm.
function EditProjects({ currentItems = [], allProjects, value, onChange }) {
  const addValue    = value?.add    ?? [];
  const removeValue = value?.remove ?? [];
  const notify      = (patch) => onChange({ add: addValue, remove: removeValue, ...patch });

  const currentSlugs = new Set(currentItems.map((p) => p.slug));
  const available    = allProjects.filter((p) => !currentSlugs.has(p.slug));

  const markedCount = removeValue.length;
  const addCount    = Array.isArray(addValue) ? addValue.length : 0;

  return (
    <Stack gap="md">
      <Box>
        <Group justify="space-between" align="baseline" mb={6}>
          <SectionLabel>Current projects</SectionLabel>
          {markedCount > 0 && (
            <Text size="xs" c="red">{markedCount} marked for removal</Text>
          )}
        </Group>
        <RemovePills
          currentItems={currentItems}
          value={removeValue}
          onChange={(slugs) => notify({ remove: slugs })}
          emptyMessage="No projects currently associated."
        />
      </Box>

      <Divider variant="dashed" />

      <Box>
        <Group justify="space-between" align="baseline" mb={6}>
          <SectionLabel>Add projects</SectionLabel>
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

// ── CurrentDataModal ──────────────────────────────────────────────────────────
function CurrentDataModal({ opened, onClose, person }) {
  if (!person) return null;

  const fields = [
    { label: 'Name',             value: person.name },
    { label: 'Slug',             value: person.slug },
    { label: 'Active',           value: person.active === true ? 'Yes' : person.active === false ? 'No' : null },
    { label: 'First Name',       value: person.firstName },
    { label: 'Last Name',        value: person.lastName },
    { label: 'Preferred Name',   value: person.preferredName },
    { label: 'Job Title',        value: person.jobTitle },
    { label: 'Groups',           value: person.groups?.length
        ? [...person.groups].sort((a, b) => a.name.localeCompare(b.name)).map((g) => g.name).join(', ')
        : null },
    { label: 'Start Date',       value: person.startDate },
    { label: 'RENCI Scholar',    value: person.renciScholar ? 'Yes' : 'No' },
    { label: 'RENCI Scholar Bio', value: person.renciScholarBio },
    { label: 'Projects',         value: person.projects?.length
        ? [...person.projects].sort((a, b) => a.name.localeCompare(b.name)).map((p) => p.name).join(', ')
        : null },
    { label: 'Bio',              value: person.bio },
    { label: 'Websites',         value: person.websites?.length
        ? person.websites.map((w) => w.label ? `${w.label}: ${w.url}` : w.url).join(', ')
        : null },
  ];

  return (
    <Modal opened={opened} onClose={onClose} title={`Current data: ${person.name}`} size="lg">
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

// ── UpdatePersonForm ──────────────────────────────────────────────────────────
export default function UpdatePersonForm() {
  const { people, loading: peopleLoading, error: peopleError } = usePeople();
  const { projects } = useProjects();
  const { researchGroups, operationsGroups } = useGroups();

  const [selectedPerson, setSelectedPerson] = useState(null);
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

  const handlePersonSelect = (person) => {
    setSelectedPerson(person);
    setValue('slug', person?.slug || '');
    reset((prev) => ({ ...prev, slug: person?.slug || '', changes: [] }));
    setFieldSelections({});
  };

  const handleFieldSelect = (index, val) => {
    setFieldSelections((prev) => ({ ...prev, [index]: val }));
    setValue(`changes.${index}.field`, val);

    // Reset block value to clean default on field type change
    const relationalDefaults = {
      groups:   { add: [], remove: [] },
      projects: { add: [], remove: [] },
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

    const payload = {
      submitterEmail: data.submitterEmail,
      slug: data.slug,
      changes,
    };

    try {
      const res = await fetch('/api/people/update', {
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
      setSelectedPerson(null);
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

        {/* Person identification */}
        <Box>
          <Title order={4} mb="sm">Identify the Person</Title>
          <Stack gap="sm">
            {peopleError ? (
              <Alert color="red">Could not load people. Make sure you are connected to the VPN.</Alert>
            ) : (
              <>
                <Group gap="sm" align="flex-end">
                  <Box style={{ flex: 1 }}>
                    <AutocompleteField
                      label="Person"
                      required
                      data={people || []}
                      value={selectedPerson}
                      onChange={handlePersonSelect}
                      loading={peopleLoading}
                    />
                  </Box>
                  {selectedPerson && (
                    <ActionIcon
                      variant="subtle"
                      size="lg"
                      mb={1}
                      onClick={() => setModalOpen(true)}
                      title="View current person data"
                      aria-label="View current person data"
                    >
                      <IconEye size={18} />
                    </ActionIcon>
                  )}
                </Group>

                {selectedPerson && (
                  <Group justify="space-between" align="center">
                    <ReadOnlyField label="Slug" value={selectedPerson.slug} />
                    <Anchor
                      href={`https://renci.org/team/${selectedPerson.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                    >
                      View Profile <IconExternalLink size={14} />
                    </Anchor>
                  </Group>
                )}
              </>
            )}
          </Stack>
        </Box>

        {/* Change blocks */}
        {selectedPerson && (
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
                          selectedPerson={selectedPerson}
                          allProjects={projects}
                          researchGroups={researchGroups}
                          operationsGroups={operationsGroups}
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
        person={selectedPerson}
      />
    </form>
  );
}