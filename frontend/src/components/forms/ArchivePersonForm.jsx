// frontend/src/components/forms/ArchivePersonForm.jsx

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Stack, Text, Button, Alert, Box, Paper } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { AutocompleteField, LongTextInput } from '../form-elements';
import SubmitterEmailField from '../form-blocks/SubmitterEmailField';
import SlugConfirmation from '../form-blocks/SlugConfirmation';
import ArchiveConfirmation from '../form-blocks/ArchiveConfirmation';
import FormSuccessState from '../form-blocks/FormSuccessState';
import { usePeople } from '../../hooks/usePeople';

export default function ArchivePersonForm() {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const { people = [], error: peopleError } = usePeople();
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
      person: null,
      effectiveDate: null,
      reason: '',
    },
  });

  const selectedPerson = watch('person');

  async function onSubmit(data) {
    setSubmitError(null);
    try {
      const res = await fetch('/api/people/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submitterEmail: data.submitterEmail,
          slug:          data.person?.slug,
          name:          data.person?.name,
          effectiveDate: data.effectiveDate
            ? data.effectiveDate.toISOString().slice(0, 10)
            : null,
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

      setSubmitSuccess(true);
    } catch {
      setSubmitError('Could not reach the server. Check your connection and try again.');
    }
  }

  if (submitSuccess) return <FormSuccessState />;

  if (confirming) {
    return (
      <ArchiveConfirmation
        entityName={selectedPerson?.name}
        entityType="person"
        onConfirm={handleSubmit(onSubmit)}
        onBack={() => { setConfirming(false); setSubmitError(null); }}
        loading={isSubmitting}
        error={submitError}
      />
    );
  }
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(() => setConfirming(true))(); }}>
      <Stack gap="lg">

        <Stack gap="xs">
          {peopleError ? (
            <Alert color="red">Could not load people. Make sure you are connected to the VPN.</Alert>
          ) : (
            <Controller
              name="person"
              control={control}
              rules={{ required: 'Please select a person.' }}
              render={({ field }) => (
                <AutocompleteField
                  {...field}
                  label="Person"
                  required
                  data={people}
                  error={errors.person?.message}
                />
              )}
            />
          )}
          {selectedPerson && (
            <SlugConfirmation
              slug={selectedPerson.slug}
              href={`https://renci.org/staff/${selectedPerson.slug}`}
              linkText="View Profile"
              noHelper
            />
          )}
        </Stack>

        <Controller
          name="effectiveDate"
          control={control}
          rules={{ required: 'Effective date is required.' }}
          render={({ field }) => (
            <DateInput
              {...field}
              label="Effective Date"
              required
              clearable
              placeholder="Pick a date"
              description="Last day / date the archival takes effect."
              error={errors.effectiveDate?.message}
              styles={{
                label:       { fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 },
                description: { fontSize: '0.8rem', color: '#555' },
              }}
            />
          )}
        />

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
              helperText="Briefly describe why this person's profile should be archived."
            />
          )}
        />

        <Paper radius="md" p="md" style={{ background: '#fff8f0', border: '1px solid #f59e0b' }}>
          <Text size="sm" c="gray.7">
            Archiving a person sets their profile to inactive. Their profile page will no longer
            be publicly accessible. The implementing team will review this request before making
            any changes.
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