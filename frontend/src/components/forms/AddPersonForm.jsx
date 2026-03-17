// frontend/src/components/forms/AddPersonForm.jsx

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  Stack,
  Group,
  Button,
  MultiSelect,
  Switch,
  Title,
  Text,
  Alert,
  Divider,
  Paper,
  Collapse,
  Checkbox,
  Anchor
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconAlertCircle, IconExternalLink } from '@tabler/icons-react';

import TextInput from '../form-elements/TextInput';
import RichTextInput from '../form-elements/RichTextInput';
import TagsInput from '../form-elements/TagsInput';
import EditableWebsiteList from '../form-blocks/EditableWebsiteList';
import SubmitterEmailField from '../form-blocks/SubmitterEmailField';
import FormSuccessState from '../form-blocks/FormSuccessState';
import FormIntro from '../form-blocks/FormIntro';

import { useProjects } from '../../hooks/useProjects';
import { useGroups } from '../../hooks/useGroups';

export default function AddPersonForm() {
  const navigate = useNavigate();
  const { researchGroups, operationsGroups, loading: groupsLoading } = useGroups();
  const { projects, loading: projectsLoading } = useProjects();

  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      submitterEmail: '',
      firstName: '',
      lastName: '',
      preferredName: '',
      jobTitle: '',
      groups: [],
      startDate: null,
      renciScholar: false,
      renciScholarBio: '',
      projects: [],
      bio: '',
      websites: [],
      headshotConfirmed: false,
    },
  });

  const renciScholar = watch('renciScholar');
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const preferredName = watch('preferredName');

  const displayName = preferredName?.trim()
    ? `${preferredName.trim()} ${lastName?.trim() || ''}`.trim()
    : `${firstName?.trim() || ''} ${lastName?.trim() || ''}`.trim();

  const groupOptions = [
    {
      group: 'Research Groups',
      items: (researchGroups || []).map((g) => ({ value: g.slug, label: g.name })),
    },
    {
      group: 'Operations Groups',
      items: (operationsGroups || []).map((g) => ({ value: g.slug, label: g.name })),
    },
  ];

  const onSubmit = async (data) => {
    setSubmitting(true);
    setSubmitError('');

    const payload = {
      ...data,
      startDate: data.startDate ? data.startDate.toISOString().slice(0, 10) : null,
      websites: (data.websites || []).filter((w) => w.url?.trim()),
    };

    try {
      const res = await fetch('/api/people', {
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
        <Title order={2}>Add Person</Title>
      </div>

      <FormIntro variant="add-person" />

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

          <Divider label="Name" labelPosition="left" />

          <Group grow align="flex-start">
            <Controller
              name="firstName"
              control={control}
              rules={{ required: 'First name is required.' }}
              render={({ field }) => (
                <TextInput
                  {...field}
                  label="First Name"
                  required
                  error={errors.firstName?.message}
                />
              )}
            />
            <Controller
              name="lastName"
              control={control}
              rules={{ required: 'Last name is required.' }}
              render={({ field }) => (
                <TextInput
                  {...field}
                  label="Last Name"
                  required
                  error={errors.lastName?.message}
                />
              )}
            />
          </Group>

          <Controller
            name="preferredName"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                label="Preferred Name"
                helperText="How their name will appear publicly — preferred first name, middle name included or excluded, etc."
                error={errors.preferredName?.message}
              />
            )}
          />

          <Divider label="Role & groups" labelPosition="left" />

          <Controller
            name="jobTitle"
            control={control}
            rules={{ required: 'Job title is required.' }}
            render={({ field }) => (
              <TextInput
                {...field}
                label="Job Title"
                required
                helperText="Use a semicolon to separate multiple titles."
                error={errors.jobTitle?.message}
              />
            )}
          />

          <Controller
            name="groups"
            control={control}
            rules={{
              validate: (v) =>
                (Array.isArray(v) && v.length > 0) || 'At least one group is required.',
            }}
            render={({ field }) => (
              <MultiSelect
                {...field}
                label="Groups"
                data={groupOptions}
                placeholder={groupsLoading ? 'Loading groups…' : 'Select groups…'}
                disabled={groupsLoading}
                required
                searchable
                error={errors.groups?.message}
                styles={{
                  label: { fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 },
                  input: { fontSize: '0.9375rem', borderRadius: 6 },
                }}
              />
            )}
          />

          <Controller
            name="startDate"
            control={control}
            rules={{ required: 'Start date is required.' }}
            render={({ field }) => (
              <DateInput
                {...field}
                label="Start Date"
                required
                clearable
                placeholder="Pick a date"
                description="The implementing team will not publish the profile before this date."
                error={errors.startDate?.message}
                styles={{
                  label:       { fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 },
                  description: { fontSize: '0.8rem', color: '#555' },
                }}
              />
            )}
          />

          <Divider label="RENCI Scholar" labelPosition="left" />

          <Controller
            name="renciScholar"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onChange={(e) => field.onChange(e.currentTarget.checked)}
                label="RENCI Scholar"
              />
            )}
          />

          <Collapse in={renciScholar}>
            <Controller
              name="renciScholarBio"
              control={control}
              rules={{
                validate: (v) =>
                  !renciScholar ||
                  (typeof v === 'string' && v.trim().length > 0) ||
                  'RENCI Scholar bio is required when RENCI Scholar is enabled.',
              }}
              render={({ field }) => (
                <RichTextInput
                  {...field}
                  label="RENCI Scholar Bio"
                  required
                  error={errors.renciScholarBio?.message}
                />
              )}
            />
          </Collapse>

          <Divider label="Projects & bio" labelPosition="left" />

          <Controller
            name="projects"
            control={control}
            render={({ field }) => (
              <TagsInput
                {...field}
                label="Projects"
                data={projects || []}
                placeholder={projectsLoading ? 'Loading projects…' : 'Search by name…'}
                disabled={projectsLoading}
                error={errors.projects?.message}
                helperText="Associate this person with existing projects. Free text accepted if no match found."
              />
            )}
          />

          <Controller
            name="bio"
            control={control}
            render={({ field }) => (
              <RichTextInput
                {...field}
                label="Biography"
                error={errors.bio?.message}
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

          <Divider label="Headshot" labelPosition="left" />

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
              <Controller
                name="headshotConfirmed"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="I have uploaded the headshot to the shared google org folder."
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.currentTarget.checked)}
                  />
                )}
              />
            </Stack>
          </Paper>

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