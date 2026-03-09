import { useFormData } from '../context/FormDataContext';

/**
 * useOrganizations
 * Returns organizations from the shared FormDataContext cache.
 * Data is fetched once on app load — no per-component fetching.
 */
export function useOrganizations() {
  const { organizations, loading, error } = useFormData();
  return { organizations, loading, error };
}