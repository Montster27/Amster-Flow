/**
 * EditTargetModal - Modal for editing first target customer
 *
 * Responsibilities:
 * - Form for editing target customer details
 * - Validation
 * - Save/Cancel actions
 * - Adapts fields based on B2B vs B2C
 */

import { useState, useEffect } from 'react';
import { FirstTarget, CustomerType } from '../../../types/sectorMap';
import { X } from 'lucide-react';

interface EditTargetModalProps {
  isOpen: boolean;
  target: FirstTarget;
  customerType: CustomerType;
  onSave: (target: FirstTarget) => void;
  onClose: () => void;
}

export function EditTargetModal({
  isOpen,
  target,
  customerType,
  onSave,
  onClose,
}: EditTargetModalProps) {
  const [formData, setFormData] = useState<FirstTarget>(target);

  // Reset form when target changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(target);
    }
  }, [isOpen, target]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  const isB2B = customerType === 'business';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Edit First Target Customer
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description {!isB2B && <span className="text-red-500">*</span>}
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={isB2B ? "Describe your target business customer..." : "Describe your target consumer..."}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required={!isB2B}
              />
              <p className="mt-1 text-xs text-gray-500">
                {isB2B
                  ? "e.g., Mid-sized SaaS companies with 50-200 employees"
                  : "e.g., Tech-savvy millennials interested in productivity tools"
                }
              </p>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., San Francisco Bay Area, United States"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Company Size (B2B only) */}
            {isB2B && (
              <div>
                <label htmlFor="companySize" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Size
                </label>
                <input
                  id="companySize"
                  type="text"
                  value={formData.companySize || ''}
                  onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                  placeholder="e.g., 50-200 employees"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
