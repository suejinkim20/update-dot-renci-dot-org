// frontend/src/components/forms/AddProjectForm.jsx

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  Stack,
  Group,
  Button,
  Select,
  Title,
  Text,
  Alert,
  Divider,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

import TextInput from '../form-elements/TextInput';
import RichTextInput from '../form-elements/RichTextInput';
import TagsInput from '../form-elements/TagsInput';
import EditableWebsiteList from '../form-blocks/EditableWebsiteList';
import SubmitterEmailField from '../form-blocks/SubmitterEmailField';
import FormSuccessState from '../form-blocks/FormSuccessState';
import FormIntro from '../form-blocks/FormIntro';
import OrganizationSelector from '../form-blocks/OrganizationSelector';

import { usePeople } from '../../hooks/usePeople';
import { useGroups } from '../../hooks/useGroups';
import { useOrganizations } from '../../hooks/useOrganizations';

// Acronyms are display-only — stored value is always the group slug.
const GROUP_ACRONYMS = {
  'data-management':                     'iRODS',
  'earth-data-science':                  'EDS',
  'network-research-and-infrastructure': 'NRIG',
  'advanced-cyberinfrastructure-support':'ACIS',
  'office-of-the-director':              'OOD',
  'research-project-management':         'RPM',
};

function groupLabel(group) {
  const acronym = GROUP_ACRONYMS[group.slug];
  return acronym ? `${group.name} (${acronym})` : group.name;
}

export default function AddProjectForm() {
  const navigate = useNavigate();
  const { people, loading: peopleLoading } = usePeople();
  const { researchGroups, operationsGroups, loading: groupsLoading } = useGroups();
  const { organizations, loading: orgsLoading } = useOrganizations();

  const owningGroupOptions = [
    {
      group: 'Research Groups',
      items: (researchGroups || []).map((g) => ({ value: g.slug, label: groupLabel(g) })),
    },
    {
      group: 'Operations Groups',
      items: (operationsGroups || []).map((g) => ({ value: g.slug, label: groupLabel(g) })),
    },
  ];

  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      submitterEmail: '',
      name: '',
      slug: '',
      description: '',
      renciRole: '',
      owningGroup: null,
      people: [],
      fundingOrgs: { existing: [], new: null },
      partnerOrgs: { existing: [], new: null },
      websites: [],
    },
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    setSubmitError('');

    // Flatten org structure: combine existing (slim objects) + new (if present)
    const fundingOrgs = [
      ...data.fundingOrgs.existing,
      ...(data.fundingOrgs.new?.officialName?.trim() ? [data.fundingOrgs.new] : []),
    ];
    const partnerOrgs = [
      ...data.partnerOrgs.existing,
      ...(data.partnerOrgs.new?.officialName?.trim() ? [data.partnerOrgs.new] : []),
    ];

    const payload = {
      ...data,
      fundingOrgs,
      partnerOrgs,
      websites: (data.websites || []).filter((w) => w.url?.trim()),
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 503) {
        setSubmitError("Unable to reach the data server. Please make sure you're connected to the VPN and try again.");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSubmitError(
          body?.errors?.map((e) => e.message).join(', ') || `Submission failed (${res.status})`
        );
        return;
      }

      setSubmitSuccess(true);
    } catch {
      setSubmitError("Unable to reach the data server. Please make sure you're connected to the VPN and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitSuccess) return <FormSuccessState />;

  return (
    <Stack gap="xl">
      <div>
        <Title order={3}>Add Project</Title>
      </div>

      <FormIntro variant="add-project" />

      {submitError && (
        <Alert
          icon={<IconAlertCircle size={18} />}
          title="Submission failed"
          color="red"
          variant="light"
        >
          {submitError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="lg">

          <Divider label="Project details" labelPosition="left" />

          <Controller
            name="name"
            control={control}
            rules={{ required: 'Project Name is required.' }}
            render={({ field }) => (
              <TextInput
                {...field}
                label="Project Name"
                required
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            name="slug"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                label="Preferred Slug"
                helperText='A slug is the URL identifier for this page — e.g. "my-project-name" in renci.org/project/my-project-name. Leave blank and the team will generate one. Must be approved before going live.'
                error={errors.slug?.message}
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            rules={{ required: 'Description is required.' }}
            render={({ field }) => (
              <RichTextInput
                {...field}
                label="Description"
                required
                error={errors.description?.message}
              />
            )}
          />

          <Controller
            name="renciRole"
            control={control}
            rules={{ required: "RENCI's Role is required." }}
            render={({ field }) => (
              <RichTextInput
                {...field}
                label="RENCI's Role"
                required
                error={errors.renciRole?.message}
              />
            )}
          />

          <Controller
            name="owningGroup"
            control={control}
            rules={{ required: 'Owning Group is required.' }}
            render={({ field }) => (
              <Select
                {...field}
                label="Owning Group"
                data={owningGroupOptions}
                placeholder={groupsLoading ? 'Loading groups…' : 'Select a group…'}
                disabled={groupsLoading}
                required
                error={errors.owningGroup?.message}
                clearable
                searchable
                styles={{
                  label: { fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 },
                  input: { fontSize: '0.9375rem', borderRadius: 6 },
                }}
              />
            )}
          />

          <Divider label="People & organizations" labelPosition="left" />

          <Controller
            name="people"
            control={control}
            render={({ field }) => (
              <TagsInput
                {...field}
                label="Contributors"
                data={people || []}
                placeholder={peopleLoading ? 'Loading people…' : 'Search by name…'}
                disabled={peopleLoading}
                error={errors.people?.message}
                helperText="Search for existing staff members. Free text accepted if no match found."
              />
            )}
          />

          <Controller
            name="fundingOrgs"
            control={control}
            render={({ field }) => (
              <OrganizationSelector
                label="Funding Organizations"
                allOrganizations={organizations || []}
                loading={orgsLoading}
                value={field.value}
                onChange={field.onChange}
                error={errors.fundingOrgs?.message}
                helperText="Select existing organizations or add a new one if not listed."
              />
            )}
          />

          <Controller
            name="partnerOrgs"
            control={control}
            render={({ field }) => (
              <OrganizationSelector
                label="Partner Organizations"
                allOrganizations={organizations || []}
                loading={orgsLoading}
                value={field.value}
                onChange={field.onChange}
                error={errors.partnerOrgs?.message}
                helperText="Select existing organizations or add a new one if not listed."
              />
            )}
          />

          <Divider label="Websites" labelPosition="left" />

          <Controller
            name="websites"
            control={control}
            render={({ field }) => (
              <EditableWebsiteList
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Divider />

          <SubmitterEmailField control={control} error={errors.submitterEmail?.message} />

          <Group justify="flex-end">
            <Button type="submit" loading={submitting} disabled={submitting}>
              Submit request
            </Button>
          </Group>

        </Stack>
      </form>
    </Stack>
  );
}