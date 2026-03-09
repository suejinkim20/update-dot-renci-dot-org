// backend/schemas/project.schema.js
// Schema definitions for Project operations: Add, Update, Archive
// Required-to-submit fields only. Required-to-publish fields are handled
// via subitem auto-flagging and are not enforced here.

export const projectSchemas = {
  'project.add': {
    fields: {
      submitterEmail: {
        type: 'string',
        required: true,
        label: 'Submitter email',
      },
      name: {
        type: 'string',
        required: false,
        label: 'Project name',
      },
      slug: {
        type: 'string',
        required: false,
        label: 'Preferred slug',
      },
      description: {
        type: 'string',
        required: false,
        label: 'Description',
      },
      renciRole: {
        type: 'string',
        required: false,
        label: 'RENCI\'s role',
      },
      owningGroup: {
        type: 'object',
        required: false,
        label: 'Owning group',
      },
      people: {
        type: 'array',
        required: false,
        label: 'Contributors',
      },
      fundingOrgs: {
        type: 'array',
        required: false,
        label: 'Funding organizations',
      },
      partnerOrgs: {
        type: 'array',
        required: false,
        label: 'Partner organizations',
      },
      websites: {
        type: 'array',
        required: false,
        label: 'Websites',
      },
    },
  },

  'project.update': {
    fields: {
      submitterEmail: {
        type: 'string',
        required: true,
        label: 'Submitter email',
      },
      slug: {
        type: 'string',
        required: true,
        label: 'Project slug',
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

  'project.archive': {
    fields: {
      submitterEmail: {
        type: 'string',
        required: true,
        label: 'Submitter email',
      },
      slug: {
        type: 'string',
        required: true,
        label: 'Project slug',
      },
      reason: {
        type: 'string',
        required: true,
        label: 'Reason for archiving',
      },
    },
  },
};