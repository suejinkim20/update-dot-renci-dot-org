// backend/schemas/validate.js
// Shared validation function for all form operations.
// Usage in route handlers:
//   const result = validate('project.add', req.body)
//   if (!result.valid) return res.status(400).json({ errors: result.errors })

import { projectSchemas } from './project.schema.js';
import { personSchemas } from './person.schema.js';

const allSchemas = {
  ...projectSchemas,
  ...personSchemas,
};

/**
 * Check whether a value is considered "present" for a required field.
 * Empty strings, empty arrays, null, and undefined all count as missing.
 */
function isPresent(value, type) {
  if (value === null || value === undefined) return false;
  if (type === 'string' && typeof value === 'string') return value.trim().length > 0;
  if (type === 'array' && Array.isArray(value)) return true; // minLength checked separately
  if (type === 'boolean') return typeof value === 'boolean';
  if (type === 'object') return typeof value === 'object' && !Array.isArray(value);
  return false;
}

/**
 * validate(operation, payload)
 *
 * @param {string} operation - e.g. 'project.add', 'person.update', 'project.archive'
 * @param {object} payload   - the request body from the route handler
 * @returns {{ valid: true } | { valid: false, errors: Array<{ field: string, message: string }> }}
 */
export function validate(operation, payload) {
  const schema = allSchemas[operation];

  if (!schema) {
    return {
      valid: false,
      errors: [{ field: '_operation', message: `Unknown operation: "${operation}"` }],
    };
  }

  const errors = [];
  const { fields } = schema;

  for (const [fieldName, fieldDef] of Object.entries(fields)) {
    const value = payload[fieldName];
    const { type, required, label, minLength, minLengthMessage, conditionalRequired } = fieldDef;

    // Required field check
    if (required && !isPresent(value, type)) {
      errors.push({ field: fieldName, message: `${label} is required` });
      continue; // skip further checks for this field if it's outright missing
    }

    // Array minLength check (e.g. changes, groups)
    if (
      type === 'array' &&
      minLength !== undefined &&
      Array.isArray(value) &&
      value.length < minLength
    ) {
      errors.push({
        field: fieldName,
        message: minLengthMessage || `${label} must have at least ${minLength} item(s)`,
      });
    }

    // Conditional required check (e.g. renciScholarBio when renciScholar is true)
    if (conditionalRequired) {
      const { dependsOn, when, message } = conditionalRequired;
      const dependsOnValue = payload[dependsOn];
      if (dependsOnValue === when && !isPresent(value, type)) {
        errors.push({ field: fieldName, message });
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}