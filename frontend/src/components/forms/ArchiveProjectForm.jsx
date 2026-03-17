// frontend/src/components/forms/ArchiveProjectForm.jsx

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Stack, Text, Button, Alert, Box, Paper } from '@mantine/core';
import { AutocompleteField, LongTextInput } from '../form-elements';
import SubmitterEmailField from '../form-blocks/SubmitterEmailField';
import SlugConfirmation from '../form-blocks/SlugConfirmation';
import ArchiveConfirmation from '../form-blocks/ArchiveConfirmation';
import FormSuccessState from '../form-blocks/FormSuccessState';
import { useProjects } from '../../hooks/useProjects';

export default function ArchiveProjectForm() {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const { projects = [], error: projectsError } = useProjects();
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      submitterEmail: '',
      project: null,
      reason: '',
    },
  });

  const selectedProject = watch('project');

  async function onSubmit(data) {
    setSubmitError(null);
    try {
      const res = await fetch('/api/projects/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submitterEmail: data.submitterEmail,
          slug:           data.project?.slug,
          name:           data.project?.name,
          reason:         data.reason,
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

      setSubmitSuccess(true);
    } catch {
      setSubmitError('Could not reach the server. Check your connection and try again.');
    }
  }

  if (confirming) {
    return (
      <ArchiveConfirmation
        entityName={selectedProject?.name}
        entityType="project"
        onConfirm={handleSubmit(onSubmit)}
        onBack={() => { setConfirming(false); setSubmitError(null); }}
        loading={isSubmitting}
        error={submitError}
      />
    );
  }
  
  if (submitSuccess) return <FormSuccessState />;
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(() => setConfirming(true))(); }}>
      <Stack gap="lg">

        <Stack gap="xs">
          {projectsError ? (
            <Alert color="red">Could not load projects. Make sure you are connected to the VPN.</Alert>
          ) : (
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
          )}
          {selectedProject && (
            <SlugConfirmation
              slug={selectedProject.slug}
              href={`https://renci.org/project/${selectedProject.slug}`}
              linkText="View Project Page"
              noHelper
            />
          )}
        </Stack>

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

        <Paper radius="md" p="md" style={{ background: '#fff8f0', border: '1px solid #f59e0b' }}>
          <Text size="sm" c="gray.7">
            Archiving a project sets it to inactive. The project page remains publicly
            accessible but will no longer appear in active project listings.
            The implementing team will review this request before making any changes.
          </Text>
        </Paper>

        <SubmitterEmailField control={control} error={errors.submitterEmail?.message} />

        <Box style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" color="orange">Review &amp; confirm</Button>
        </Box>

      </Stack>
    </form>
  );
}