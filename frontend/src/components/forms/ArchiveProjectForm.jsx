// frontend/src/components/forms/ArchiveProjectForm.jsx
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Stack, Text, Button, Alert, Box, Paper } from '@mantine/core';
import { IconAlertTriangle, IconExternalLink } from '@tabler/icons-react';
import { AutocompleteField, ReadOnlyField, LongTextInput, TextInput } from '../fields';

import { useProjects } from '../../hooks/useProjects';

export default function ArchiveProjectForm() {
  const [confirming, setConfirming] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const { projects = [], loading, error: projectsError } = useProjects();

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      submitterEmail: '',
      project: null,   // { name, slug, id }
      reason: '',
    },
  });

  const selectedProject = watch('project');

  // ── Submission ─────────────────────────────────────────────────────────────
  async function onSubmit(data) {
    setSubmitError(null);
    try {
      const res = await fetch('/api/projects/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submitterEmail: data.submitterEmail,
          slug: data.project?.slug,
          name: data.project?.name,
          reason: data.reason,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.code === 'VPN_REQUIRED') {
          setSubmitError('This app requires a VPN connection to submit. Please connect and try again.');
        } else if (Array.isArray(body.errors)) {
          setSubmitError(body.errors.map((e) => e.message).join(' '));
        } else {
          setSubmitError(body.message || 'Something went wrong. Please try again.');
        }
        return;
      }

      setSubmitted(true);
      reset();
      setConfirming(false);
    } catch {
      setSubmitError('Could not reach the server. Check your connection and try again.');
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <Stack gap="md" align="center" py="xl">
        <Text size="sm" fw={600} c="#005b8e">Request submitted</Text>
        <Text size="sm" c="dimmed" ta="center">
          Your archive request has been received. Check your email for a confirmation from Monday.com.
        </Text>
        <Button variant="subtle" size="xs" onClick={() => setSubmitted(false)}>
          Submit another request
        </Button>
      </Stack>
    );
  }

  // ── Confirmation step ──────────────────────────────────────────────────────
  if (confirming) {
    return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="lg">
          <Alert
            icon={<IconAlertTriangle size={16} />}
            color="orange"
            radius="md"
            title="Confirm archive request"
          >
            <Text size="sm">
              Are you sure you want to request archiving{' '}
              <strong>{selectedProject?.name}</strong>? The implementing team
              will review before any changes are made.
            </Text>
          </Alert>

          {submitError && (
            <Alert color="red" radius="md" title="Submission error">
              <Text size="sm">{submitError}</Text>
            </Alert>
          )}

          <Box style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button
              variant="subtle"
              color="gray"
              onClick={() => { setConfirming(false); setSubmitError(null); }}
              disabled={isSubmitting}
            >
              Go back
            </Button>
            <Button
              type="submit"
              color="orange"
              loading={isSubmitting}
            >
              Yes, submit request
            </Button>
          </Box>
        </Stack>
      </form>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(() => setConfirming(true))(); }}>
      <Stack gap="lg">

        <Text size="xs" c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
          Archive Project
        </Text>

        {/* Project identification */}
        <Stack gap="xs">
          <Controller
            name="project"
            control={control}
            rules={{ required: 'Please select a project.' }}
            render={({ field }) => (
              <AutocompleteField
                {...field}
                label="Project"
                required
                data={projects}
                error={errors.project?.message}
              />
            )}
          />
          {selectedProject?.slug && (
            <Stack gap={4}>
              <ReadOnlyField label="Slug" value={selectedProject.slug} />
              <Box style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Text
                  component="a"
                  href={`https://renci.org/projects/${selectedProject.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  size="xs"
                  c="#005b8e"
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  View Project Page
                  <IconExternalLink size={12} />
                </Text>
              </Box>
            </Stack>
          )}
        </Stack>

        {/* Reason */}
        <Controller
          name="reason"
          control={control}
          rules={{ required: 'Please provide a reason for archiving.' }}
          render={({ field }) => (
            <LongTextInput
              {...field}
              label="Reason for archiving"
              required
              error={errors.reason?.message}
              helperText="Briefly describe why this project should be archived."
            />
          )}
        />

        {/* Submitter email */}
        <Controller
          name="submitterEmail"
          control={control}
          rules={{
            required: 'Your email is required.',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' },
          }}
          render={({ field }) => (
            <TextInput
              {...field}
              label="Your Email"
              required
              error={errors.submitterEmail?.message}
              helperText="Used for Monday.com ticket notifications."
            />
          )}
        />

        {/* Warning callout */}
        <Paper radius="md" p="md" style={{ background: '#fff8f0', border: '1px solid #f59e0b' }}>
          <Text size="xs" c="dimmed">
            Archiving a project sets it to inactive. The project page remains publicly
            accessible but will no longer appear in active project listings.
            The implementing team will review this request before making any changes.
          </Text>
        </Paper>

        <Box style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" color="orange">
            Review &amp; confirm
          </Button>
        </Box>

      </Stack>
    </form>
  );
}