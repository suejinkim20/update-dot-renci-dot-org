// frontend/src/hooks/useProjects.js
import { useFormData } from '../context/FormDataContext';

/**
 * useProjects
 * Returns projects from the shared FormDataContext cache.
 * Data is fetched once on app load — no per-component fetching.
 */
export function useProjects() {
  const { projects, loading, error } = useFormData();
  return { projects, loading, error };
}