import { useState } from 'react';
import type { DateRange, DateRangePreset } from '../../types/adminReports';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const presets: Array<{ key: DateRangePreset; label: string }> = [
  { key: 'last7days', label: 'Last 7 days' },
  { key: 'last30days', label: 'Last 30 days' },
  { key: 'last90days', label: 'Last 90 days' },
  { key: 'thisMonth', label: 'This month' },
  { key: 'thisYear', label: 'This year' },
  { key: 'allTime', label: 'All time' },
];

function getPresetRange(preset: DateRangePreset): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { startDate: today, endDate: today };
    case 'last7days':
      return {
        startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: today,
      };
    case 'last30days':
      return {
        startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: today,
      };
    case 'last90days':
      return {
        startDate: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
        endDate: today,
      };
    case 'thisMonth':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: today,
      };
    case 'thisQuarter': {
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      return {
        startDate: new Date(now.getFullYear(), quarterStart, 1),
        endDate: today,
      };
    }
    case 'thisYear':
      return {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: today,
      };
    case 'allTime':
    default:
      return { startDate: null, endDate: null };
  }
}

function formatDateForInput(date: Date | null): string {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [activePreset, setActivePreset] = useState<DateRangePreset | null>(
    value.startDate === null && value.endDate === null ? 'allTime' : null
  );

  const handlePresetClick = (preset: DateRangePreset) => {
    setActivePreset(preset);
    onChange(getPresetRange(preset));
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActivePreset(null);
    const date = e.target.value ? new Date(e.target.value) : null;
    onChange({ ...value, startDate: date });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActivePreset(null);
    const date = e.target.value ? new Date(e.target.value) : null;
    onChange({ ...value, endDate: date });
  };

  const handleClear = () => {
    setActivePreset('allTime');
    onChange({ startDate: null, endDate: null });
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Date Range</label>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map(preset => (
          <button
            key={preset.key}
            onClick={() => handlePresetClick(preset.key)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              activePreset === preset.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={formatDateForInput(value.startDate)}
          onChange={handleStartDateChange}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Start date"
        />
        <span className="text-gray-500">to</span>
        <input
          type="date"
          value={formatDateForInput(value.endDate)}
          onChange={handleEndDateChange}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="End date"
        />
        {(value.startDate || value.endDate) && (
          <button
            onClick={handleClear}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
