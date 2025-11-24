/**
 * TargetCustomerCard - Display first target customer (Zone A)
 *
 * Responsibilities:
 * - Display target customer details in a card
 * - Edit button that opens modal
 * - Read-only display with clean typography
 */

import { FirstTarget, CustomerType } from '../../types/sectorMap';
import { Pencil } from 'lucide-react';

interface TargetCustomerCardProps {
  target: FirstTarget;
  customerType: CustomerType;
  onEdit: () => void;
}

export function TargetCustomerCard({ target, customerType, onEdit }: TargetCustomerCardProps) {
  const isEmpty = !target.description && !target.location && !target.companySize;

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-t-4 ${
      customerType === 'business' ? 'border-blue-500' : 'border-emerald-500'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          First Target Customer
        </h2>
        <button
          onClick={onEdit}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Edit target customer"
        >
          <Pencil className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      {isEmpty ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-3">No target customer defined yet</p>
          <button
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Define your first target →
          </button>
        </div>
      ) : (
        <dl className="space-y-3">
          {target.description && (
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Description
              </dt>
              <dd className="text-gray-900">{target.description}</dd>
            </div>
          )}

          {target.location && (
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Location
              </dt>
              <dd className="text-gray-900">{target.location}</dd>
            </div>
          )}

          {customerType === 'business' && target.companySize && (
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Company Size
              </dt>
              <dd className="text-gray-900">{target.companySize}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
