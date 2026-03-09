// frontend/src/context/FormDataContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';

const FormDataContext = createContext(null);

const VPN_ERROR_MESSAGE =
  "Unable to reach the data server. Please make sure you're connected to the VPN and try again.";

async function fetchJson(url) {
  const res = await fetch(url);
  if (res.status === 503) throw new Error(VPN_ERROR_MESSAGE);
  if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
  return res.json();
}

/**
 * FormDataProvider
 * Fetches people, groups, and organizations in parallel on mount.
 * Results are cached for the lifetime of the session — no re-fetching on form open.
 *
 * Wrap your app root with this provider:
 *   <FormDataProvider>
 *     <App />
 *   </FormDataProvider>
 */
export function FormDataProvider({ children }) {
  const [people, setPeople] = useState([]);
  const [projects, setProjects] = useState([]);
  const [researchGroups, setResearchGroups] = useState([]);
  const [operationsGroups, setOperationsGroups] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);

      try {
        const [peopleData, projectsData, groupsData, orgsData] = await Promise.all([
          fetchJson('/api/people'),
          fetchJson('/api/projects'),
          fetchJson('/api/groups'),
          fetchJson('/api/organizations'),
        ]);

        const byName = (a, b) => a.name.localeCompare(b.name);

        setPeople([...peopleData].sort(byName));
        setProjects(projectsData);
        setResearchGroups([...groupsData.researchGroups ?? []].sort(byName));
        setOperationsGroups([...groupsData.operationsGroups ?? []].sort(byName));
        setOrganizations([...orgsData].sort(byName));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []); // Runs once on mount — results cached for the session

  return (
    <FormDataContext.Provider
      value={{ people, projects, researchGroups, operationsGroups, organizations, loading, error }}
    >
      {children}
    </FormDataContext.Provider>
  );
}

export function useFormData() {
  const ctx = useContext(FormDataContext);
  if (!ctx) throw new Error('useFormData must be used within a FormDataProvider');
  return ctx;
}