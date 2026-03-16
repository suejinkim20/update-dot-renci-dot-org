/**
 * Monday.com API Service
 *
 * Column IDs (sourced from environment variables, never hardcoded):
 *
 * Parent item columns:
 *   MONDAY_COL_STATUS           — item status (New, In Review, In Sprint, etc.)
 *   MONDAY_COL_DATE             — date submitted
 *   MONDAY_COL_CONTENT_TYPE     — dropdown: Project / Person
 *   MONDAY_COL_OPERATION        — dropdown: Add / Update / Archive
 *   MONDAY_COL_ITEM_NAME        — name of the entity being changed (e.g. "Suejin Kim", "iRODS")
 *   MONDAY_COL_DESCRIPTION      — structured summary of submission (feeds confirmation email automation)
 *   MONDAY_COL_ASSIGNED_PERSON  — web team member assigned to ticket (set manually)
 *   MONDAY_COL_SUBMITTER_EMAIL  — email of the person who submitted the request
 *   MONDAY_COL_WORDPRESS_LINK   — live page URL (set by web team before marking Complete)
 *   MONDAY_COL_DUE_DATE         — due date (set by web team during triage)
 *
 * Subitem columns:
 *   MONDAY_SUBITEM_COL_CONTENT  — full untruncated text for long fields (bio, description, etc.)
 *                                  for web team reference; not included in email automations
 *
 * Board IDs:
 *   MONDAY_BOARD_ID             — single board for all submissions (Projects + People)
 */

const MONDAY_API_URL = 'https://api.monday.com/v2';

/**
 * Execute a GraphQL query/mutation against the Monday.com API.
 */
async function mondayFetch(query, variables = {}) {
  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) {
    throw new Error('MONDAY_API_KEY is not set in environment variables');
  }

  const response = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': apiKey,
      'API-Version':   '2023-10',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Monday.com API HTTP error ${response.status}: ${text}`);
  }

  const json = await response.json();

  if (json.errors && json.errors.length > 0) {
    const messages = json.errors.map((e) => e.message).join('; ');
    throw new Error(`Monday.com API error: ${messages}`);
  }

  return json.data;
}

/**
 * Create a parent item on a Monday.com board.
 */
export async function createItem(boardId, itemName, columnValues = {}) {
  const query = `
    mutation CreateItem($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item(
        board_id: $boardId
        item_name: $itemName
        column_values: $columnValues
      ) {
        id
      }
    }
  `;

  const data = await mondayFetch(query, {
    boardId:      String(boardId),
    itemName,
    columnValues: JSON.stringify(columnValues),
  });

  const id = data?.create_item?.id;
  if (!id) throw new Error('Monday.com createItem: no item ID returned in response');
  return { id };
}

/**
 * Create a subitem under an existing Monday.com parent item.
 */
export async function createSubitem(parentItemId, itemName, columnValues = {}) {
  const query = `
    mutation CreateSubitem($parentItemId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_subitem(
        parent_item_id: $parentItemId
        item_name: $itemName
        column_values: $columnValues
      ) {
        id
      }
    }
  `;

  const data = await mondayFetch(query, {
    parentItemId: String(parentItemId),
    itemName,
    columnValues: JSON.stringify(columnValues),
  });

  const id = data?.create_subitem?.id;
  if (!id) throw new Error('Monday.com createSubitem: no subitem ID returned in response');
  return { id };
}