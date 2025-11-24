/**
 * SectorMapHeader - Title and B2B/B2C toggle
 *
 * Responsibilities:
 * - Display page title and description
 * - Customer type toggle (B2B/B2C)
 * - Visual theming based on customer type
 */

import { CustomerType } from '../../types/sectorMap';

interface SectorMapHeaderProps {
  customerType: CustomerType;
  onCustomerTypeChange: (type: CustomerType) => void;
}

export function SectorMapHeader({ customerType, onCustomerTypeChange }: SectorMapHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sector Map</h1>
          <p className="text-gray-600 mt-1">
            Map your competitive landscape and ecosystem
          </p>
        </div>

        {/* Customer Type Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => onCustomerTypeChange('business')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              customerType === 'business'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            B2B
          </button>
          <button
            onClick={() => onCustomerTypeChange('consumer')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              customerType === 'consumer'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            B2C
          </button>
        </div>
      </div>
    </div>
  );
}
