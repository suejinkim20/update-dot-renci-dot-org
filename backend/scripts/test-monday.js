/**
 * test-monday.js
 *
 * Manual test script for backend/services/monday.js
 * Creates a clearly labeled throwaway item on the Projects board to confirm
 * end-to-end connectivity with the Monday.com API.
 *
 * Usage:
 *   node backend/scripts/test-monday.js
 *
 * Prerequisites:
 *   - MONDAY_API_KEY must be set in your .env
 *   - MONDAY_PROJECTS_BOARD_ID must be set in your .env
 *   - Run from the repo root (dotenv resolves relative to cwd)
 */

import 'dotenv/config';
import { createItem, createSubitem } from '../services/monday.js';

const boardId = process.env.MONDAY_BOARD_ID;

if (!boardId) {
  console.error('❌ MONDAY_BOARD_ID is not set. Check your .env file.');
  process.exit(1);
}

const colStatus = process.env.MONDAY_COL_STATUS;
const colDate = process.env.MONDAY_COL_DATE;
const colContentType = process.env.MONDAY_COL_CONTENT_TYPE;
const colDescription = process.env.MONDAY_COL_DESCRIPTION;

async function run() {
  console.log('▶ Creating test parent item on Projects board…');
  console.log(`  Board ID: ${boardId}`);

  // Build column values using env-var column IDs
  const columnValues = {};

  if (colStatus) {
    columnValues[colStatus] = { label: 'New' };
  }

  if (colDate) {
    const today = new Date().toISOString().split('T')[0];
    columnValues[colDate] = { date: today };
  }

  if (colContentType) {
    columnValues[colContentType] = { labels: ['Project'] };
  }

  if (colDescription) {
    columnValues[colDescription] = {
      text: 'TEST ITEM — created by test-monday.js. Safe to delete.',
    };
  }

  let parentId;
  try {
    const result = await createItem(
      boardId,
      'TEST - delete me',
      columnValues
    );
    parentId = result.id;
    console.log(`✅ Parent item created. ID: ${parentId}`);
  } catch (err) {
    console.error('❌ Failed to create parent item:', err.message);
    process.exit(1);
  }

  // Create a test subitem to confirm createSubitem works.
  // Subitem column IDs are not yet defined (pending RN-192 board audit),
  // so we pass an empty columnValues object here.
  console.log('\n▶ Creating test subitem under parent item…');
  try {
    const subResult = await createSubitem(
      parentId,
      'TEST subitem - delete me',
      {} // subitem column IDs TBD in RN-192 board audit
    );
    console.log(`✅ Subitem created. ID: ${subResult.id}`);
  } catch (err) {
    console.error('❌ Failed to create subitem:', err.message);
    process.exit(1);
  }

  console.log('\n✅ All tests passed. Check your Monday board and delete the TEST items.');
}

run();