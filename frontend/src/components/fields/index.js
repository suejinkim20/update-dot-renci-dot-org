// frontend/src/components/fields/index.js
// Barrel export for all reusable field components.
// Import from here: import { TextInput, AutocompleteField } from '../components/fields';
//
// Deferred (build in first form task that needs them):
//   RichTextInput  — RN-201
//   TagsInput      — RN-197
//   ReviewCheckbox — RN-201

export { default as TextInput } from './TextInput';
export { default as LongTextInput } from './LongTextInput';
export { default as UrlInput } from './UrlInput';
export { default as AutocompleteField } from './AutocompleteField';
export { default as RepeatableField } from './RepeatableField';
export { default as FieldSelector } from './FieldSelector';
export { default as ReadOnlyField } from './ReadOnlyField';
export { default as TagsInput } from './TagsInput';
export { default as ReviewCheckbox } from './ReviewCheckbox';