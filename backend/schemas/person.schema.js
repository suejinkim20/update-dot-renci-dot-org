// backend/schemas/person.schema.js
// Schema definitions for Person operations: Add, Update, Archive
// Required-to-submit fields only. Required-to-publish fields are handled
// via subitem auto-flagging and are not enforced here.

export const personSchemas = {
  'person.add': {
    fields: {
      submitterEmail: {
        type: 'string',
        required: true,
        label: 'Submitter email',
      },
      firstName: {
        type: 'string',
        required: true,
        label: 'First name',
      },
      lastName: {
        type: 'string',
        required: true,
        label: 'Last name',
      },
      preferredName: {
        type: 'string',
        required: false,
        label: 'Preferred name',
      },
      jobTitle: {
        type: 'string',
        required: true,
        label: 'Job title',
      },
      groups: {
        type: 'array',
        required: true,
        label: 'Groups',
        minLength: 1,
        minLengthMessage: 'At least one group is required',
      },
      startDate: {
        type: 'string',
        required: true,
        label: 'Start date',
      },
      renciScholar: {
        type: 'boolean',
        required: false,
        label: 'RENCI Scholar',
      },
      renciScholarBio: {
        type: 'string',
        required: false,
        label: 'RENCI Scholar bio',
        // Conditional: required when renciScholar is true.
        // Enforced in validate() via conditionalRequired.
        conditionalRequired: {
          dependsOn: 'renciScholar',
          when: true,
          message: 'RENCI Scholar bio is required when RENCI Scholar is enabled',
        },
      },
      projects: {
        type: 'array',
        required: false,
        label: 'Projects',
      },
      bio: {
        type: 'string',
        required: false,
        label: 'Biography',
      },
      websites: {
        type: 'array',
        required: false,
        label: 'Websites',
      },
    },
  },

  'person.update': {
    fields: {
      submitterEmail: {
        type: 'string',
        required: true,
        label: 'Submitter email',
      },
      slug: {
        type: 'string',
        required: true,
        label: 'Person slug',
      },
      changes: {
        type: 'array',
        required: true,
        label: 'Changes',
        minLength: 1,
        minLengthMessage: 'At least one change is required',
      },
    },
  },

  'person.archive': {
    fields: {
      submitterEmail: {
        type: 'string',
        required: true,
        label: 'Submitter email',
      },
      slug: {
        type: 'string',
        required: true,
        label: 'Person slug',
      },
      effectiveDate: {
        type: 'string',
        required: true,
        label: 'Effective date',
      },
      reason: {
        type: 'string',
        required: true,
        label: 'Reason',
      },
      additionalContext: {
        type: 'string',
        required: false,
        label: 'Additional context',
      },
    },
  },
};