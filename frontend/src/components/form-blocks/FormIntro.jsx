// frontend/src/components/form-blocks/FormIntro.jsx
//
// Introductory text block shown at the top of Add and Update forms.
// Explains the purpose of the form and links to a well-populated example
// on the RENCI website so staff can see how the fields are used in context.
//
// Props:
//   variant: 'add-project' | 'update-project' | 'add-person' | 'update-person'

import { Box, Text, Anchor, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

const CONTENT = {
  'add-project': {
    summary:
      'Use this form to request that a new project be added to the RENCI website. Fill in as much detail as you can. The more context you provide, the faster the web team can get it live.',
    guidance:
      'A project page typically includes a name, description, RENCI\'s role, owning group, contributors, and funding and partner organizations. See an example of a well-populated project page:',
    exampleHref:  'https://renci.org/project/robokop/',
    exampleLabel: 'Example project page',
  },
  'update-project': {
    summary:
      'Use this form to request changes to an existing project on the RENCI website. Add one change block per field you want to update. Each block becomes a separate action item on the review ticket.',
    guidance:
      'Not sure what a well-populated project looks like? See an example before you start:',
    exampleHref:  'https://renci.org/project/robokop/',
    exampleLabel: 'Example project page',
  },
  'add-person': {
    summary:
      'Use this form to request that a new staff profile be added to the RENCI website. The web team will review your submission and publish the profile on or after the start date you provide.',
    guidance:
      'A person profile typically includes a name, job title, group membership, biography, and a headshot. See an example of a well-populated profile:',
    exampleHref:  'https://renci.org/team/example-person',
    exampleLabel: 'Example staff profile',
  },
  'update-person': {
    summary:
      'Use this form to request changes to an existing staff profile on the RENCI website. Add one change block per field you want to update. Each block becomes a separate action item on the review ticket.',
    guidance:
      'Not sure what a well-populated profile looks like? See an example before you start:',
    exampleHref:  'https://renci.org/team/example-person',
    exampleLabel: 'Example staff profile',
  },
};

export default function FormIntro({ variant }) {
  const content = CONTENT[variant];
  if (!content) return null;

  return (
    <Alert
      icon={<IconInfoCircle size={16} />}
      color="gray"
      variant="light"
      mb="md"
      styles={{ message: { fontSize: '0.875rem' } }}
    >
      <Text size="sm" mb={6}>
        {content.summary}
      </Text>
      {/* <Text size="sm">
        {content.guidance}{' '}
        <Anchor
          href={content.exampleHref}
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
        >
          {content.exampleLabel}
        </Anchor>
        .
      </Text> */}
    </Alert>
  );
}