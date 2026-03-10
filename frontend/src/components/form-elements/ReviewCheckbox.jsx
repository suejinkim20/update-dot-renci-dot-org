import { Checkbox } from '@mantine/core';

/**
 * ReviewCheckbox
 * A small checkbox rendered beside an eligible field.
 * Allows the submitter to opt-in to a review request for that specific field.
 *
 * NOT registered in React Hook Form — managed as local state in the parent form
 * and collected at submit time into a `reviewRequests: string[]` array.
 *
 * Props:
 *   fieldName  — the RHF field name this checkbox is associated with (e.g. "name")
 *   checked    — boolean, controlled by parent form state
 *   onChange   — (fieldName: string, checked: boolean) => void
 *
 * Usage:
 *   const [reviewRequests, setReviewRequests] = useState({});
 *   const handleReviewChange = (fieldName, checked) =>
 *     setReviewRequests((prev) => ({ ...prev, [fieldName]: checked }));
 *
 *   // Beside the name field:
 *   <ReviewCheckbox
 *     fieldName="name"
 *     checked={!!reviewRequests.name}
 *     onChange={handleReviewChange}
 *   />
 *
 *   // At submit time:
 *   const reviewRequestsList = Object.entries(reviewRequests)
 *     .filter(([, checked]) => checked)
 *     .map(([fieldName]) => fieldName);
 */
export default function ReviewCheckbox({ fieldName, checked, onChange }) {
  return (
    <Checkbox
      label="Request a review of this field"
      checked={checked}
      onChange={(e) => onChange(fieldName, e.currentTarget.checked)}
      size="xs"
      mt={6}
      styles={{
        label: {
          fontSize: '0.8rem',
          color: 'var(--mantine-color-dimmed)',
          cursor: 'pointer',
        },
      }}
    />
  );
}