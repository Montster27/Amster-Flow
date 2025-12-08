import { useState, useRef, useEffect } from 'react';
import type { Organization, User } from '../../types/adminReports';

interface SegmentationFiltersProps {
  organizations: Organization[];
  users: User[];
  selectedOrganizations: string[];
  selectedUsers: string[];
  onOrganizationsChange: (ids: string[]) => void;
  onUsersChange: (ids: string[]) => void;
}

interface MultiSelectDropdownProps {
  label: string;
  options: Array<{ id: string; label: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  placeholder = 'All',
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const handleSelectAll = () => {
    onChange(options.map(o => o.id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const displayText = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? options.find(o => o.id === selected[0])?.label || '1 selected'
      : `${selected.length} selected`;

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-w-[180px] px-3 py-2 text-left bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
      >
        <span className={selected.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
          {displayText}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Select All / Clear All */}
          <div className="flex justify-between p-2 border-b border-gray-200 bg-gray-50">
            <button
              onClick={handleSelectAll}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Select All
            </button>
            <button
              onClick={handleClearAll}
              className="text-xs text-gray-600 hover:text-gray-700"
            >
              Clear All
            </button>
          </div>

          {/* Options list */}
          <div className="max-h-40 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-sm text-gray-500 text-center">No results</div>
            ) : (
              filteredOptions.map(option => (
                <label
                  key={option.id}
                  className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.id)}
                    onChange={() => handleToggle(option.id)}
                    className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 truncate">{option.label}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SegmentationFilters({
  organizations,
  users,
  selectedOrganizations,
  selectedUsers,
  onOrganizationsChange,
  onUsersChange,
}: SegmentationFiltersProps) {
  const orgOptions = organizations.map(o => ({ id: o.id, label: o.name }));
  const userOptions = users.map(u => ({
    id: u.id,
    label: u.fullName || u.email,
  }));

  return (
    <div className="flex flex-wrap gap-4">
      <MultiSelectDropdown
        label="Organizations"
        options={orgOptions}
        selected={selectedOrganizations}
        onChange={onOrganizationsChange}
        placeholder="All organizations"
      />
      <MultiSelectDropdown
        label="Users"
        options={userOptions}
        selected={selectedUsers}
        onChange={onUsersChange}
        placeholder="All users"
      />
    </div>
  );
}
