import { useFormData } from '../context/FormDataContext';

/**
 * usePeople
 * Returns people from the shared FormDataContext cache.
 * Data is fetched once on app load — no per-component fetching.
 */
export function usePeople() {
  const { people, loading, error } = useFormData();
  return { people, loading, error };
}