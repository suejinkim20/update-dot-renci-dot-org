// frontend/src/components/forms/UpdateProjectForm.jsx

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
  ActionIcon,
  Alert,
  Paper,
} from '@mantine/core';
import { IconEye, IconPlus, IconTrash } from '@tabler/icons-react';
import {
  TextInput as RenciTextInput,
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
import OrganizationSelector from '../form-blocks/OrganizationSelector';
import { useProjects } from '../../hooks/useProjects';
import { useGroups } from '../../hooks/useGroups';
import { usePeople } from '../../hooks/usePeople';
import { useOrganizations } from '../../hooks/useOrganizations';

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
  'data-management':                     'iRODS',
  'earth-data-science':                  'EDS',
  'network-research-and-infrastructure': 'NRIG',
  'advanced-cyberinfrastructure-support':'ACIS',
  'office-of-the-director':             'OOD',
  'research-project-management':         'RPM',
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

function EditContributors({ currentItems = [], allItems = [], value, onChange }) {
  const addValue    = value?.add    ?? [];
  const removeValue = value?.remove ?? [];
  const notify      = (patch) => onChange({ add: addValue, remove: removeValue, ...patch });
  const existingSlugs = new Set(currentItems.map((i) => i.slug));
  const available   = allItems.filter((i) => !existingSlugs.has(i.slug));
  return (
    <RelationalFieldEditor
      currentLabel="Current contributors"
      addLabel="Add contributors"
      currentItems={currentItems}
      removeValue={removeValue}
      onRemoveChange={(slugs) => notify({ remove: slugs })}
      emptyMessage="No contributors currently listed."
      addCount={addValue.length}
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
}

function EditOrganizations({ currentItems = [], allOrganizations = [], value, onChange, noun = 'organization' }) {
  const addExisting = value?.addExisting ?? [];
  const addNew      = value?.addNew ?? null;
  const removeValue = value?.remove ?? [];
  
  const notify = (patch) => onChange({ 
    addExisting, 
    addNew, 
    remove: removeValue, 
    ...patch 
  });

  // Filter out orgs that are already current
  const existingSlugs = new Set(currentItems.map((i) => i.slug));
  const availableOrgs = allOrganizations.filter((o) => !existingSlugs.has(o.slug));

  const addCount = addExisting.length + (addNew?.officialName?.trim() ? 1 : 0);

  return (
    <RelationalFieldEditor
      currentLabel={`Current ${noun}s`}
      addLabel={`Add ${noun}s`}
      currentItems={currentItems}
      removeValue={removeValue}
      onRemoveChange={(slugs) => notify({ remove: slugs })}
      emptyMessage={`No ${noun}s currently listed.`}
      addCount={addCount}
      addPanel={
        <OrganizationSelector
          label={`Select existing ${noun}s`}
          allOrganizations={availableOrgs}
          value={{ existing: addExisting, new: addNew }}
          onChange={(val) => notify({ addExisting: val.existing, addNew: val.new })}
          helperText={`Select from the list or add a new ${noun} if not listed.`}
        />
      }
    />
  );
}

function ChangeBlockInput({ fieldKey, control, index, selectedProject, people, organizations, groups }) {
  const groupOptions = buildGroupOptions(groups, selectedProject?.owningGroup?.slug);

  switch (fieldKey) {
    case 'name':
      return (
        <Stack gap="xs">
          {selectedProject?.name && <ReadOnlyField label="Current Name" value={selectedProject.name} />}
          <Controller name={`changes.${index}.value`} control={control} rules={{ required: 'New name is required' }}
            render={({ field, fieldState }) => <RenciTextInput {...field} label="New Name" required error={fieldState.error?.message} />}
          />
        </Stack>
      );
    case 'owningGroup':
      return (
        <Stack gap="xs">
          {selectedProject?.owningGroup && <ReadOnlyField label="Current Owning Group" value={selectedProject.owningGroup.label ?? selectedProject.owningGroup.name} />}
          <Controller name={`changes.${index}.value`} control={control} rules={{ required: 'New owning group is required' }}
            render={({ field, fieldState }) => <Select {...field} label="New Owning Group" placeholder="Select a group" data={groupOptions} required error={fieldState.error?.message} />}
          />
        </Stack>
      );
    case 'description':
      return (
        <Stack gap="xs">
          {selectedProject?.description && <ReadOnlyField label="Current Description" value={selectedProject.description} isHtml />}
          <Controller name={`changes.${index}.value`} control={control} rules={{ required: 'New description is required' }}
            render={({ field, fieldState }) => <RichTextInput {...field} label="New Description" required error={fieldState.error?.message} />}
          />
        </Stack>
      );
    case 'renciRole':
      return (
        <Stack gap="xs">
          {selectedProject?.renciRole && <ReadOnlyField label="Current RENCI Role" value={selectedProject.renciRole} isHtml />}
          <Controller name={`changes.${index}.value`} control={control} rules={{ required: 'New RENCI Role is required' }}
            render={({ field, fieldState }) => <RichTextInput {...field} label="New RENCI Role" required error={fieldState.error?.message} />}
          />
        </Stack>
      );
    case 'people':
      return (
        <Controller name={`changes.${index}.value`} control={control} defaultValue={{ add: [], remove: [] }}
          render={({ field }) => <EditContributors currentItems={selectedProject?.people || []} allItems={(people || []).map((p) => ({ name: p.name, slug: p.slug, id: p.id }))} value={field.value} onChange={field.onChange} />}
        />
      );
    case 'fundingOrgs':
      return (
        <Controller name={`changes.${index}.value`} control={control} defaultValue={{ addExisting: [], addNew: null, remove: [] }}
          render={({ field }) => <EditOrganizations currentItems={selectedProject?.fundingOrgs || []} allOrganizations={(organizations || []).map((o) => ({ name: o.name, slug: o.slug, id: o.id }))} value={field.value} onChange={field.onChange} noun="funding organization" />}
        />
      );
    case 'partnerOrgs':
      return (
        <Controller name={`changes.${index}.value`} control={control} defaultValue={{ addExisting: [], addNew: null, remove: [] }}
          render={({ field }) => <EditOrganizations currentItems={selectedProject?.partnerOrgs || []} allOrganizations={(organizations || []).map((o) => ({ name: o.name, slug: o.slug, id: o.id }))} value={field.value} onChange={field.onChange} noun="partner organization" />}
        />
      );
    case 'websites':
      return (
        <Controller name={`changes.${index}.value`} control={control} defaultValue={[]}
          render={({ field }) => <EditableWebsiteList currentItems={selectedProject?.websites || []} value={field.value} onChange={field.onChange} />}
        />
      );
    case 'other':
      return (
        <Controller name={`changes.${index}.value`} control={control} rules={{ required: 'Please describe the change' }}
          render={({ field, fieldState }) => <LongTextInput {...field} label="Describe the change" helperText="Use this for edge cases, including slug changes." required error={fieldState.error?.message} />}
        />
      );
    default:
      return null;
  }
}

export default function UpdateProjectForm() {
  const navigate = useNavigate();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const { groups } = useGroups();
  const { people } = usePeople();
  const { organizations } = useOrganizations();

  const [selectedProject, setSelectedProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [fieldSelections, setFieldSelections] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
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
    const relationalDefaults = {
      people:      { add: [], remove: [] },
      fundingOrgs: { addExisting: [], addNew: null, remove: [] },
      partnerOrgs: { addExisting: [], addNew: null, remove: [] },
      websites:    [],
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
        
        // Enrich remove slugs with full objects for org fields
        let enrichedValue = change.value;
        if ((fieldKey === 'fundingOrgs' || fieldKey === 'partnerOrgs') && change.value?.remove) {
          const currentItems = fieldKey === 'fundingOrgs' 
            ? selectedProject?.fundingOrgs || []
            : selectedProject?.partnerOrgs || [];
          
          enrichedValue = {
            ...change.value,
            remove: change.value.remove.map(slug => {
              const found = currentItems.find(item => item.slug === slug);
              return found || slug; // fallback to slug if not found
            })
          };
        }
        
        return { field: fieldKey, label, value: enrichedValue };
      })
      .filter(Boolean);

    try {
      const res = await fetch('/api/projects/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submitterEmail: data.submitterEmail,
          slug:           data.slug,
          name:           selectedProject?.name || null,
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
  
  const modalFields = selectedProject
    ? [
        { label: 'Name',                   value: selectedProject.name },
        { label: 'Slug',                   value: selectedProject.slug },
        { label: 'Active',                 value: selectedProject.active === true ? 'Yes' : selectedProject.active === false ? 'No' : null },
        { label: 'Description',            value: selectedProject.description,           isHtml: true },
        { label: 'Additional Description', value: selectedProject.additionalDescription, isHtml: true },
        { label: "RENCI's Role",           value: selectedProject.renciRole,             isHtml: true },
        { label: 'Owning Group',           value: selectedProject.owningGroup?.label ?? selectedProject.owningGroup?.name },
        { label: 'Contributors',           value: selectedProject.people,                isList: true },
        { label: 'Funding Organizations',  value: selectedProject.fundingOrgs,           isList: true },
        { label: 'Partner Organizations',  value: selectedProject.partnerOrgs,           isList: true },
        { label: 'Websites',               value: selectedProject.websites,              isWebsites: true },
      ]
    : [];

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="xl">

        <FormIntro variant="update-project" />

        <Box>
          <Title order={4} mb="sm">Identify the Project</Title>
          <Stack gap="sm">
            {projectsError ? (
              <Alert color="red">Could not load projects. Make sure you are connected to the VPN.</Alert>
            ) : (
              <>
                <Group gap="sm" align="flex-end">
                  <Box style={{ flex: 1 }}>
                    <AutocompleteField label="Project Name" required data={projects || []} value={selectedProject} onChange={handleProjectSelect} loading={projectsLoading} />
                  </Box>
                  {selectedProject && (
                    <ActionIcon variant="subtle" size="lg" mb={1} onClick={() => setModalOpen(true)} title="View current project data">
                      <IconEye size={18} />
                    </ActionIcon>
                  )}
                </Group>
                {selectedProject && (
                  <SlugConfirmation
                    slug={selectedProject.slug}
                    href={`https://renci.org/project/${selectedProject.slug}`}
                    linkText="View Project Page"
                  />
                )}
              </>
            )}
          </Stack>
        </Box>

        {selectedProject && (
          <>
            <Divider />
            <Box>
              <Title order={4} mb="xs">Declare Changes</Title>
              <Text size="sm" c="gray.7" mb="md">
                Add one block per change. Each block becomes a separate action item on the ticket.
              </Text>
              <Stack gap="md">
                {changeFields.map((item, index) => (
                  <Paper key={item.id} withBorder p="md" radius="sm">
                    <Stack gap="sm">
                      <Group justify="space-between" align="center">
                        <Text size="sm" fw={500}>Change {index + 1}</Text>
                        <ActionIcon color="red" variant="subtle" size="sm" onClick={() => removeChangeBlock(index)}>
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
                <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addChangeBlock} style={{ alignSelf: 'flex-start' }}>
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
        title={selectedProject ? `Current data: ${selectedProject.name}` : ''}
        fields={modalFields}
      />
    </form>
  );
}