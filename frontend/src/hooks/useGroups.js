import { useFormData } from '../context/FormDataContext';

/**
 * useGroups
 * Returns research and operations groups from the shared FormDataContext cache.
 * Data is fetched once on app load — no per-component fetching.
 */
export function useGroups() {
  const { researchGroups, operationsGroups, loading, error } = useFormData();
  return { researchGroups, operationsGroups, loading, error };
}