/**
 * backend/scripts/test-graphql.js
 * Manual test script — run from project root:
 *   node backend/scripts/test-graphql.js
 *
 * Loads .env from the project root, then calls getPeople() and getProjects()
 * and logs results to confirm the service is wired up correctly.
 */

// Load .env before importing the service so GRAPHQL_ENDPOINT is available.
// dotenv/config reads from process.cwd(), so run this from the project root.
import 'dotenv/config';
import { getPeople, getProjects } from '../services/graphql.js';

async function main() {
  console.log('GraphQL endpoint:', process.env.GRAPHQL_ENDPOINT);
  console.log('---');

  // Test getPeople
  console.log('Fetching people...');
  try {
    const people = await getPeople();
    console.log(`✅ getPeople: returned ${people.length} people`);
    console.log('First person sample:');
    console.log(JSON.stringify(people[0], null, 2));
  } catch (err) {
    console.error('❌ getPeople failed:', err.message);
  }

  console.log('---');

  // Test getProjects
  console.log('Fetching projects...');
  try {
    const projects = await getProjects();
    console.log(`✅ getProjects: returned ${projects.length} projects`);
    console.log('First project sample:');
    console.log(JSON.stringify(projects[0], null, 2));
  } catch (err) {
    console.error('❌ getProjects failed:', err.message);
  }
}

main();