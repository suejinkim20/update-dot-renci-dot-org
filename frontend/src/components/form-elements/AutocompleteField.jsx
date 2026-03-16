// frontend/src/components/fields/AutocompleteField.jsx

import { useState, useCallback } from 'react';
import { Combobox, TextInput, useCombobox, Text, Stack } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

export default function AutocompleteField({
  label,
  error,
  helperText,
  required = false,
  placeholder = 'Search…',
  disabled = false,
  data = [],
  value,
  onChange,
  onBlur,
  name,
  ref,
}) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [search, setSearch] = useState(value?.name ?? '');

  const filtered = data.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase().trim()) ||
    item.slug?.toLowerCase().includes(search.toLowerCase().trim())
  );

  const handleSelect = useCallback(
    (itemSlug) => {
      const found = data.find((d) => d.slug === itemSlug);
      if (found) {
        onChange(found);
        setSearch(found.name);
      }
      combobox.closeDropdown();
    },
    [data, onChange, combobox]
  );

  const handleInputChange = (e) => {
    const val = e.currentTarget.value;
    setSearch(val);
    if (val === '') onChange(null);
    combobox.openDropdown();
    combobox.updateSelectedOptionIndex();
  };

  const options = filtered.map((item) => (
    <Combobox.Option value={item.slug} key={item.slug ?? item.id}>
      <Stack gap={0}>
        <Text size="sm" fw={500} lh={1.3}>{item.name}</Text>
        {item.slug && (
          <Text size="xs" c="dimmed" lh={1.2} ff="monospace">{item.slug}</Text>
        )}
      </Stack>
    </Combobox.Option>
  ));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Combobox store={combobox} onOptionSubmit={handleSelect} withinPortal={false}>
        <Combobox.Target>
          <TextInput
            ref={ref}
            name={name}
            value={search}
            onChange={handleInputChange}
            onBlur={() => { combobox.closeDropdown(); onBlur?.(); }}
            onFocus={() => combobox.openDropdown()}
            onClick={() => combobox.openDropdown()}
            label={label}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            error={error}
            withAsterisk={required}
            leftSection={<IconSearch size={15} stroke={1.5} />}
            styles={{
              label: { fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 },
              input: { fontSize: '0.9375rem', borderRadius: 6 },
              error: { marginTop: 4 },
            }}
          />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Options>
            {options.length > 0 ? options : <Combobox.Empty>No results found</Combobox.Empty>}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
      {helperText && !error && (
        <Text size="sm" c="dimmed" mt={2}>
          {helperText}
        </Text>
      )}
    </div>
  );
}