// frontend/src/components/forms/UpdatePersonForm.jsx

import { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
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
  ActionIcon,
  Alert,
  Paper,
  Checkbox,
  Anchor
} from '@mantine/core';
import { IconEye, IconPlus, IconTrash, IconExternalLink } from '@tabler/icons-react';
import {
  TextInput,
  LongTextInput,
  RichTextInput,
  AutocompleteField,
  TagsInput,
  ReadOnlyField,
} from '../form-elements';
import SubmitterEmailField from '../form-blocks/SubmitterEmailField';
import SlugConfirmation from '../form-blocks/SlugConfirmation';
import FormSuccessState from '../form-blocks/FormSuccessState';
import CurrentDataModal from '../form-blocks/CurrentDataModal';
import EditableWebsiteList from '../form-blocks/EditableWebsiteList';
import RelationalFieldEditor from '../form-blocks/RelationalFieldEditor';
import FormIntro from '../form-blocks/FormIntro';
import { usePeople } from '../../hooks/usePeople';
import { useProjects } from '../../hooks/useProjects';
import { useGroups } from '../../hooks/useGroups';

const FIELD_OPTIONS = [
  { value: 'name',          label: 'Update Name' },
  { value: 'jobTitle',      label: 'Update Job Title' },
  { value: 'bio',           label: 'Add/Update Bio' },
  { value: 'renciScholar',  label: 'Update RENCI Scholar Status' },
  { value: 'groups',        label: 'Edit Groups' },
  { value: 'projects',      label: 'Edit Projects' },
  { value: 'websites',      label: 'Edit Websites' },
  { value: 'publications',  label: 'Edit Publications' },
  { value: 'headshot',      label: 'Update Headshot' },
  { value: 'other',         label: 'Other' },
];

// Slim a relational object down to { name, slug, id } only.
// Prevents full normalized records (with description, people, websites, etc.)
// from bloating the payload and causing 403 errors on submission.
function slimObject(v) {
  if (typeof v === 'object' && v !== null) {
    return { name: v.name, slug: v.slug, id: v.id };
  }
  return v;
}

function slimRelational(value) {
  if (!value || typeof value !== 'object') return value;
  return {
    add:    Array.isArray(value.add)    ? value.add.map(slimObject)    : [],
    remove: Array.isArray(value.remove) ? value.remove.map(slimObject) : [],
  };
}

// ---------------------------------------------------------------------------
// Publications repeatable editor
// ---------------------------------------------------------------------------
function EditPublications({ currentItems = [], value, onChange }) {
  const emptyEntry = () => ({ doi: '' });
  const items = Array.isArray(value) && value.length > 0 ? value : [emptyEntry()];

  const update    = (index, patch) => onChange(items.map((item, i) => i === index ? { ...item, ...patch } : item));
  const addEntry  = () => onChange([...items, emptyEntry()]);
  const removeEntry = (index) => {
    const next = items.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [emptyEntry()]);
  };

  const hasCurrentItems = Array.isArray(currentItems) && currentItems.length > 0;

  return (
    <Stack gap="sm">
      {hasCurrentItems && (
        <Box>
          <Text size="xs" fw={500} c="dimmed" tt="uppercase" lts={0.5} mb={6}>
            Current publications
          </Text>
          <Stack gap={6}>
            {currentItems.map((pub, i) => (
              <Box key={i}>
                <Text size="sm">{pub.title || '(untitled)'}</Text>
                <Group gap="xs">
                  {pub.datePublished && <Text size="xs" c="dimmed">{pub.datePublished}</Text>}
                  {pub.doi && (
                    <Text
                      component="a"
                      href={`https://doi.org/${pub.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="xs"
                      c="#005b8e"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}
                    >
                      {pub.doi}
                      <IconExternalLink size={10} />
                    </Text>
                  )}
                </Group>
              </Box>
            ))}
          </Stack>
          <Divider my="sm" variant="dashed" />
          <Text size="xs" fw={500} c="dimmed" tt="uppercase" lts={0.5} mb={4}>
            Add publications
          </Text>
          <Text size="sm" c="gray.7" mb={6}>
            Enter the DOI for each publication. The implementing team will link the full record.
            A DOI looks like: <em>10.1000/xyz123</em>
          </Text>
        </Box>
      )}
      {!hasCurrentItems && (
        <Text size="sm" c="gray.7" mb={4}>
          Enter the DOI for each publication. The implementing team will link the full record.
          A DOI looks like: <em>10.1000/xyz123</em>
        </Text>
      )}
      <Stack gap="xs">
        {items.map((item, index) => (
          <Group key={index} gap="xs" align="flex-end">
            <Box style={{ flex: 1 }}>
              <TextInput
                label={index === 0 ? 'DOI' : undefined}
                placeholder="e.g. 10.1000/xyz123"
                value={item.doi || ''}
                onChange={(e) => update(index, { doi: e.target.value })}
              />
            </Box>
            <ActionIcon
              color="red"
              variant="subtle"
              size="sm"
              mb={2}
              onClick={() => removeEntry(index)}
              disabled={items.length === 1 && !item.doi}
              title="Remove"
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        ))}
      </Stack>
      <Button
        variant="subtle"
        size="xs"
        leftSection={<IconPlus size={14} />}
        onClick={addEntry}
        style={{ alignSelf: 'flex-start' }}
      >
        Add another publication
      </Button>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Change block input switcher
// ---------------------------------------------------------------------------
function ChangeBlockInput({ fieldKey, control, index, selectedPerson }) {
  const { projects } = useProjects();
  const { researchGroups, operationsGroups } = useGroups();
  const [nameChecks, setNameChecks] = useState({
    firstName: false,
    lastName: false,
    preferredName: false,
  });
  const [headshotConfirmed, setHeadshotConfirmed] = useState(false);

  const headshotFileName = selectedPerson?.name || '[Person Name]';

  switch (fieldKey) {
    case 'name':
      return (
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Check the name components you want to update. At least one must be selected.
          </Text>
          {[
            { key: 'firstName',     label: 'First Name' },
            { key: 'lastName',      label: 'Last Name' },
            { key: 'preferredName', label: 'Preferred Name' },
          ].map(({ key, label }) => (
            <Box key={key}>
              <Checkbox
                label={label}
                checked={nameChecks[key]}
                onChange={(e) => {
                  const checked = e.currentTarget.checked;
                  setNameChecks((prev) => ({ ...prev, [key]: checked }));
                }}
              />
              {nameChecks[key] && (
                <Box pl="xl" mt="xs">
                  <Controller
                    name={`changes.${index}.value.${key}`}
                    control={control}
                    rules={{ required: `${label} is required when selected.` }}
                    render={({ field, fieldState }) => (
                      <TextInput
                        {...field}
                        label={`New ${label}`}
                        required
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      );

    case 'jobTitle':
      return (
        <Stack gap="xs">
          {selectedPerson?.jobTitle && (
            <ReadOnlyField label="Current Job Title" value={selectedPerson.jobTitle} />
          )}
          <Controller
            name={`changes.${index}.value`}
            control={control}
            rules={{ required: 'New job title is required.' }}
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                label="New Job Title"
                required
                helperText="Use a semicolon to separate multiple titles."
                error={fieldState.error?.message}
              />
            )}
          />
        </Stack>
      );

    case 'bio':
      return (
        <Stack gap="xs">
          {selectedPerson?.bio && (
            <ReadOnlyField label="Current Bio" value={selectedPerson.bio} isHtml />
          )}
          <Controller
            name={`changes.${index}.value`}
            control={control}
            rules={{ required: 'Bio is required.' }}
            render={({ field, fieldState }) => (
              <RichTextInput
                {...field}
                label="New Bio"
                required
                error={fieldState.error?.message}
              />
            )}
          />
        </Stack>
      );

    case 'renciScholar':
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
                checked={!!field.value}
                onChange={(e) => field.onChange(e.currentTarget.checked)}
                label="RENCI Scholar"
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
                    <RichTextInput
                      {...field}
                      label="RENCI Scholar Bio"
                      error={fieldState.error?.message}
                    />
                  )}
                />
              ) : null
            }
          />
        </Stack>
      );

    case 'groups': {
      const currentGroupSlugs = (selectedPerson?.groups || []).map((g) => g.slug);
      return (
        <Controller
          name={`changes.${index}.value`}
          control={control}
          defaultValue={{ add: [], remove: [] }}
          render={({ field }) => {
            const addValue    = field.value?.add    ?? [];
            const removeValue = field.value?.remove ?? [];
            const notify      = (patch) => field.onChange({ add: addValue, remove: removeValue, ...patch });
            const addedSlugs  = new Set(addValue);
            const addOptions  = [
              {
                group: 'Research Groups',
                items: (researchGroups || [])
                  .filter((g) => !currentGroupSlugs.includes(g.slug) && !addedSlugs.has(g.slug))
                  .map((g) => ({ value: g.slug, label: g.name })),
              },
              {
                group: 'Operations Groups',
                items: (operationsGroups || [])
                  .filter((g) => !currentGroupSlugs.includes(g.slug) && !addedSlugs.has(g.slug))
                  .map((g) => ({ value: g.slug, label: g.name })),
              },
            ];
            return (
              <RelationalFieldEditor
                currentLabel="Current groups"
                addLabel="Add groups"
                currentItems={selectedPerson?.groups || []}
                removeValue={removeValue}
                onRemoveChange={(slugs) => notify({ remove: slugs })}
                emptyMessage="No groups currently assigned."
                addCount={addValue.length}
                addPanel={
                  <MultiSelect
                    data={addOptions}
                    value={addValue}
                    onChange={(vals) => notify({ add: vals })}
                    placeholder="Select groups to add"
                    searchable
                  />
                }
              />
            );
          }}
        />
      );
    }

    case 'projects': {
      const currentProjects = selectedPerson?.projects || [];
      const currentSlugs    = new Set(currentProjects.map((p) => p.slug));
      const available       = (projects || []).filter((p) => !currentSlugs.has(p.slug));
      return (
        <Controller
          name={`changes.${index}.value`}
          control={control}
          defaultValue={{ add: [], remove: [] }}
          render={({ field }) => {
            const addValue    = field.value?.add    ?? [];
            const removeValue = field.value?.remove ?? [];
            const notify      = (patch) => field.onChange({ add: addValue, remove: removeValue, ...patch });
            return (
              <RelationalFieldEditor
                currentLabel="Current projects"
                addLabel="Add projects"
                currentItems={currentProjects}
                removeValue={removeValue}
                onRemoveChange={(slugs) => notify({ remove: slugs })}
                emptyMessage="No projects currently associated."
                addCount={Array.isArray(addValue) ? addValue.length : 0}
                addPanel={
                  <TagsInput
                    data={available}
                    value={addValue}
                    onChange={(vals) => notify({ add: vals })}
                    helperText="Search by name. Free text accepted if no match found."
                  />
                }
              />
            );
          }}
        />
      );
    }

    case 'websites':
      return (
        <Controller
          name={`changes.${index}.value`}
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <EditableWebsiteList
              currentItems={selectedPerson?.websites || []}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      );

    case 'publications':
      return (
        <Controller
          name={`changes.${index}.value`}
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <EditPublications
              currentItems={selectedPerson?.publications || []}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      );

    case 'headshot':
      return (
        <Paper radius="md" p="md" style={{ background: '#f0f7fc', border: '1px solid #bbd6ea' }}>
          <Stack gap="sm">
              <Text size="sm">
                Upload a headshot photo to the{' '}
                <Anchor href="https://drive.google.com/drive/folders/1O2mYei1Wh_sGRC9Ro7Gz_9kVY5mUn6W1?usp=sharing" target="_blank">
                  <strong>shared google org folder</strong>{' '}
                  <IconExternalLink
                    size={12}
                    style={{ flexShrink: 0, marginTop: 3 }}
                  />

                </Anchor>
                , with the file name: <strong>staff_lastName-firstName</strong>.
                The implementing team will retrieve it from there.
              </Text>
            <Checkbox
              label="I have uploaded the headshot to the shared google org folder."
              checked={headshotConfirmed}
              onChange={(e) => {
                const checked = e.currentTarget.checked;
                setHeadshotConfirmed(checked);
              }}
            />
          </Stack>
        </Paper>
      );

    case 'other':
      return (
        <Controller
          name={`changes.${index}.value`}
          control={control}
          rules={{ required: 'Please describe the change.' }}
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

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------
export default function UpdatePersonForm() {
  const navigate = useNavigate();
  const { people, loading: peopleLoading, error: peopleError } = usePeople();
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [fieldSelections, setFieldSelections] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { submitterEmail: '', slug: '', changes: [] },
  });

  const { fields: changeFields, append, remove } = useFieldArray({
    control,
    name: 'changes',
  });

  const handlePersonSelect = (person) => {
    setSelectedPerson(person);
    setValue('slug', person?.slug || '');
    reset((prev) => ({ ...prev, slug: person?.slug || '', changes: [] }));
    setFieldSelections({});
  };

  const handleFieldSelect = (index, val) => {
    setFieldSelections((prev) => ({ ...prev, [index]: val }));
    setValue(`changes.${index}.field`, val);
    const relationalDefaults = {
      groups:       { add: [], remove: [] },
      projects:     { add: [], remove: [] },
      websites:     [],
      publications: [],
    };
    setValue(`changes.${index}.value`, relationalDefaults[val] ?? null);
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

        // Slim relational fields to { name, slug, id } only before submitting.
        // Full normalized records cause oversized payloads and 403 errors.
        let value = change.value;
        if (fieldKey === 'projects' || fieldKey === 'groups') {
          value = slimRelational(value);
        }

        return { field: fieldKey, label, value };
      })
      .filter(Boolean);

    try {
      const res = await fetch('/api/people/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submitterEmail: data.submitterEmail,
          slug:           data.slug,
          name:           selectedPerson?.name || null,
          changes,
        }),
      });

      if (res.status === 503) {
        const body = await res.json().catch(() => ({}));
        if (body.code === 'VPN_REQUIRED') {
          setSubmitError('Could not connect to the data API. Make sure you are connected to the VPN and try again.');
          return;
        }
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSubmitError(
          body.errors?.map((e) => e.message).join(', ') || 'Submission failed. Please try again.'
        );
        return;
      }

      setSubmitSuccess(true);
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.');
    }
  };
  if (submitSuccess) return <FormSuccessState />;

  // TODO: Modal is getting long — consider tabbed layout post-launch.
  const modalFields = selectedPerson
    ? [
        { label: 'Name',              value: selectedPerson.name },
        { label: 'Slug',              value: selectedPerson.slug },
        { label: 'Active',            value: selectedPerson.active === true ? 'Yes' : selectedPerson.active === false ? 'No' : null },
        { label: 'Job Title',         value: selectedPerson.jobTitle },
        { label: 'Groups',            value: selectedPerson.groups,    isList: true },
        { label: 'RENCI Scholar',     value: selectedPerson.renciScholar ? 'Yes' : 'No' },
        { label: 'RENCI Scholar Bio', value: selectedPerson.renciScholarBio, isHtml: true },
        { label: 'Projects',          value: selectedPerson.projects,  isList: true },
        { label: 'Bio',               value: selectedPerson.bio,       isHtml: true },
        { label: 'Websites',          value: selectedPerson.websites,  isWebsites: true },
        { label: 'Publications',      value: selectedPerson.publications, isPublications: true },
      ]
    : [];

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="xl">

        <FormIntro variant="update-person" />

        <Box>
          <Title order={4} mb="sm">Identify the Person</Title>
          <Stack gap="sm">
            {peopleError ? (
              <Alert color="red">
                Could not load people. Make sure you are connected to the VPN.
              </Alert>
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
                    >
                      <IconEye size={18} />
                    </ActionIcon>
                  )}
                </Group>
                {selectedPerson && (
                  <SlugConfirmation
                    slug={selectedPerson.slug}
                    href={`https://renci.org/staff/${selectedPerson.slug}`}
                    linkText="View Profile"
                  />
                )}
              </>
            )}
          </Stack>
        </Box>

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

            <SubmitterEmailField control={control} error={errors.submitterEmail?.message} />
            <Button type="submit" loading={isSubmitting} fullWidth>
              Submit Update Request
            </Button>
          </>
        )}
      </Stack>

      <CurrentDataModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedPerson ? `Current data: ${selectedPerson.name}` : ''}
        fields={modalFields}
      />
    </form>
  );
}