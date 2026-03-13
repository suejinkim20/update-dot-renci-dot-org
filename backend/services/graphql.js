/**
 * backend/services/graphql.js
 * Fetches People, Projects, Groups, and Organizations from the GraphQL intermediate API.
 * All post_id fields are normalized to id throughout.
 * Handles pagination via PaginationInput { offset, limit }.
 */

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT;
const PAGE_LIMIT = 50;

async function graphqlFetch(query, variables = {}) {
  if (!GRAPHQL_ENDPOINT) {
    throw new Error('GRAPHQL_ENDPOINT is not defined in environment variables.');
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    if (response.status === 403) {
      const vpnError = new Error('Cannot reach the Website Content GraphQL API. Are you on the RENCI VPN?');
      vpnError.code = 'VPN_REQUIRED';
      throw vpnError;
    }
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (json.errors && json.errors.length > 0) {
    throw new Error(`GraphQL errors: ${json.errors.map((e) => e.message).join('; ')}`);
  }

  return json.data;
}

async function fetchAllPages(fetchPage) {
  const results = [];
  let offset = 0;

  while (true) {
    const page = await fetchPage(offset);
    results.push(...page);
    if (page.length < PAGE_LIMIT) break;
    offset += PAGE_LIMIT;
  }

  return results;
}

function normalizeIds(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key === 'post_id') {
      result['id'] = value;
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => normalizeIds(item));
    } else {
      result[key] = value;
    }
  }

  return result;
}

export async function getPeople() {
  // Fields confirmed available in the API as of RN-201.
  // Not yet in API (add when confirmed): active, job_title, start_date,
  // chief_scientist, chief_scientist_bio.
  const query = `
    query AllPeople($page: PaginationInput) {
      all_staff(page: $page) {
        name
        post_id
        slug
        sorting_name
        biography
        urls
        projects { name post_id slug }
        research_groups { name post_id slug }
        operations_groups { name slug post_id }
        publications {
          publication_type
          status
          date_published
          title
          doi
          slug
        }
      }
    }
  `;

  const people = await fetchAllPages(async (offset) => {
    const data = await graphqlFetch(query, { page: { limit: PAGE_LIMIT, offset } });

    if (!data.all_staff || !Array.isArray(data.all_staff)) {
      throw new Error('getPeople: unexpected response shape - all_staff missing or not an array');
    }

    return data.all_staff;
  });

  if (people.length === 0) {
    throw new Error('getPeople: returned an empty array');
  }

  return people.map(normalizePerson);
}

/**
 * Normalize a raw GraphQL person object.
 *
 * biography → bio: matches the form field name and content model.
 * urls: flat string array from API. Normalized to { url } objects —
 * consistent with how EditableWebsiteList and formatWebsites handle entries.
 * sorting_name: kept as-is; informational only, not a form field.
 *
 * Not yet in API (defaulted to null/false until available):
 *   active, jobTitle, startDate, renciScholar, renciScholarBio
 *
 * groups: merged flat list of research + operations groups, each tagged with
 * a `type` field for grouped MultiSelect display in the Update Person form.
 *
 * publications: normalized from API. Displayed read-only in modal.
 * Staff can submit publication additions via Update Person form (DOI-based).
 * citation is intentionally excluded — too long for form display.
 */
function normalizePerson(raw) {
  const p = normalizeIds(raw);

  const researchGroups = (p.research_groups || []).map(normalizeIds);
  const operationsGroups = (p.operations_groups || []).map(normalizeIds);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sortingName: p.sorting_name ?? null,
    bio: p.biography ?? null,
    // urls is a flat string array from the API — normalize to { url } objects only.
    websites: (p.urls || []).map((url) => ({ url })),

    // Not yet in API
    active: null,
    jobTitle: null,
    startDate: null,
    renciScholar: false,
    renciScholarBio: null,

    projects: (p.projects || []).map(normalizeIds),
    researchGroups,
    operationsGroups,
    // Merged flat list used by Update Person form for pill display and add panel.
    // type field distinguishes Research vs Operations for grouped rendering.
    groups: [
      ...researchGroups.map((g) => ({ ...g, type: 'research' })),
      ...operationsGroups.map((g) => ({ ...g, type: 'operations' })),
    ],
    // Publications from API. citation field excluded (too long for display).
    // Modal shows title, date_published, doi only.
    // Staff submit additions via Update Person form using DOI.
    publications: (p.publications || []).map((pub) => ({
      title: pub.title ?? null,
      publicationType: pub.publication_type ?? null,
      status: pub.status ?? null,
      datePublished: pub.date_published ?? null,
      doi: pub.doi ?? null,
      slug: pub.slug ?? null,
    })),
  };
}

export async function getProjects() {
  const query = `
    query AllProjects($page: PaginationInput) {
      projects(page: $page) {
        slug
        post_id
        name
        active
        description
        additional_description
        rencis_role
        urls
        contributors { name slug post_id }
        research_groups { name slug post_id }
        operations_groups { name slug post_id }
        funding_organizations { name slug post_id }
        partner_organizations { name slug post_id }
      }
    }
  `;

  const projects = await fetchAllPages(async (offset) => {
    const data = await graphqlFetch(query, { page: { limit: PAGE_LIMIT, offset } });

    if (!data.projects || !Array.isArray(data.projects)) {
      throw new Error('getProjects: unexpected response shape - projects missing or not an array');
    }

    return data.projects;
  });

  if (projects.length === 0) {
    throw new Error('getProjects: returned an empty array');
  }

  return projects.map(normalizeProject);
}

/**
 * Normalize a raw GraphQL project object.
 *
 * owningGroup: inferred from research_groups[0] ?? operations_groups[0].
 * rencis_role: API field name has a typo (should be renci_role). Mapped to
 * renciRole here. If the API corrects the typo, update this line only.
 * additionalDescription: available on the project object and surfaced in
 * CurrentDataModal. Not yet a form field.
 * urls: flat string array, normalized to { url } objects — same pattern as people.
 */
function normalizeProject(raw) {
  const p = normalizeIds(raw);

  const researchGroups = (p.research_groups || []).map(normalizeIds);
  const operationsGroups = (p.operations_groups || []).map(normalizeIds);
  const owningGroup = researchGroups[0] ?? operationsGroups[0] ?? null;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    active: p.active ?? null,

    description: p.description ?? null,
    // API field is `additional_description` — surfaced in CurrentDataModal only, not a form field.
    additionalDescription: p.additional_description ?? null,
    // Note: API field is `rencis_role` (typo — should be `renci_role`).
    // If/when the API corrects the typo, update this mapping only.
    renciRole: p.rencis_role ?? null,

    // urls is a flat string array from the API — normalize to { url } objects only.
    websites: (p.urls || []).map((url) => ({ url })),

    owningGroup,
    people: (p.contributors || []).map(normalizeIds),
    fundingOrgs: (p.funding_organizations || []).map(normalizeIds),
    partnerOrgs: (p.partner_organizations || []).map(normalizeIds),
    researchGroups,
    operationsGroups,
  };
}

/**
 * Fetch all research groups and operations groups.
 * Returns { researchGroups: [...], operationsGroups: [...] }
 */
export async function getGroups() {
  const query = `
    query AllGroups {
      research_groups {
        name
        post_id
        slug
      }
      operations_groups {
        name
        slug
        post_id
      }
    }
  `;

  const data = await graphqlFetch(query);

  if (!data.research_groups || !data.operations_groups) {
    throw new Error('getGroups: unexpected response shape - research_groups or operations_groups missing');
  }

  return {
    researchGroups: data.research_groups.map(normalizeIds),
    operationsGroups: data.operations_groups.map(normalizeIds),
  };
}

/**
 * Fetch all organizations.
 * Returns array of { name, slug, id }
 */
export async function getOrganizations() {
  const query = `
    query AllOrganizations($page: PaginationInput) {
      organizations(page: $page) {
        name
        slug
        post_id
      }
    }
  `;

  const organizations = await fetchAllPages(async (offset) => {
    const data = await graphqlFetch(query, { page: { limit: PAGE_LIMIT, offset } });

    if (!data.organizations || !Array.isArray(data.organizations)) {
      throw new Error('getOrganizations: unexpected response shape - organizations missing or not an array');
    }

    return data.organizations;
  });

  return organizations.map(normalizeIds);
}