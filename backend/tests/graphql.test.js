import { describe, expect, it } from 'vitest';
import { normalizePerson, normalizeProject } from '../services/graphql.js';

describe('normalizePerson', () => {
  it('maps job_title and orcid, and leaves unavailable fields undefined', () => {
    const person = normalizePerson({
      post_id: 1,
      name: 'Ada Lovelace',
      slug: 'ada-lovelace',
      job_title: 'Research Scientist',
      orcid: '0000-0002-1825-0097',
      biography: '<p>Bio</p>',
      urls: ['https://example.com'],
      research_groups: [],
      operations_groups: [],
      projects: [],
      publications: [],
    });

    expect(person.jobTitle).toBe('Research Scientist');
    expect(person.orcid).toBe('0000-0002-1825-0097');
    expect(person.active).toBeUndefined();
    expect(person.renciScholar).toBeUndefined();
    expect(person.renciScholarBio).toBeUndefined();
  });
});

describe('normalizeProject', () => {
  it('keeps the inferred owning group derived from group membership and normalizes numeric active flags', () => {
    const project = normalizeProject({
      post_id: 2,
      name: 'Project Alpha',
      slug: 'project-alpha',
      active: 1,
      description: '<p>Description</p>',
      additional_description: '<p>More</p>',
      rencis_role: '<p>Role</p>',
      urls: [],
      contributors: [],
      research_groups: [{ post_id: 10, name: 'Research Group', slug: 'research-group' }],
      operations_groups: [{ post_id: 11, name: 'Operations Group', slug: 'operations-group' }],
      funding_organizations: [],
      partner_organizations: [],
    });

    expect(project.active).toBe(true);
    expect(project.owningGroup).toEqual({ id: 10, name: 'Research Group', slug: 'research-group' });
    expect(project.additionalDescription).toBe('<p>More</p>');
  });

  it('normalizes inactive numeric flags', () => {
    const project = normalizeProject({
      post_id: 3,
      name: 'Project Beta',
      slug: 'project-beta',
      active: 0,
      urls: [],
      contributors: [],
      research_groups: [],
      operations_groups: [],
      funding_organizations: [],
      partner_organizations: [],
    });

    expect(project.active).toBe(false);
  });
});
