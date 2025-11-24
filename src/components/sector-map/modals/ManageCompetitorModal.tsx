/**
 * ManageCompetitorModal - Modal for adding/editing competitors
 *
 * Responsibilities:
 * - Form for competitor name, description
 * - Manage suppliers list (add/remove)
 * - Manage customers list (add/remove)
 * - Validation
 * - Save/Cancel actions
 */

import { useState, useEffect } from 'react';
import { Competitor } from '../../../types/sectorMap';
import { X, Plus } from 'lucide-react';

interface ManageCompetitorModalProps {
  isOpen: boolean;
  competitor?: Competitor; // undefined = add mode, defined = edit mode
  onSave: (competitor: Omit<Competitor, 'id' | 'created'>) => void;
  onClose: () => void;
}

export function ManageCompetitorModal({
  isOpen,
  competitor,
  onSave,
  onClose,
}: ManageCompetitorModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    suppliers: [] as string[],
    customers: [] as string[],
  });

  const [newSupplier, setNewSupplier] = useState('');
  const [newCustomer, setNewCustomer] = useState('');

  const isEditMode = !!competitor;

  // Reset form when modal opens or competitor changes
  useEffect(() => {
    if (isOpen) {
      if (competitor) {
        setFormData({
          name: competitor.name,
          description: competitor.description,
          suppliers: [...competitor.suppliers],
          customers: [...competitor.customers],
        });
      } else {
        setFormData({
          name: '',
          description: '',
          suppliers: [],
          customers: [],
        });
      }
      setNewSupplier('');
      setNewCustomer('');
    }
  }, [isOpen, competitor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const addSupplier = () => {
    if (newSupplier.trim()) {
      setFormData({ ...formData, suppliers: [...formData.suppliers, newSupplier.trim()] });
      setNewSupplier('');
    }
  };

  const removeSupplier = (index: number) => {
    setFormData({
      ...formData,
      suppliers: formData.suppliers.filter((_, i) => i !== index),
    });
  };

  const addCustomer = () => {
    if (newCustomer.trim()) {
      setFormData({ ...formData, customers: [...formData.customers, newCustomer.trim()] });
      setNewCustomer('');
    }
  };

  const removeCustomer = (index: number) => {
    setFormData({
      ...formData,
      customers: formData.customers.filter((_, i) => i !== index),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'Edit Competitor' : 'Add New Competitor'}
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
          <div className="p-6 space-y-5">
            {/* Competitor Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Competitor Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Acme Corp, CompetitorX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this competitor..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Suppliers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suppliers
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSupplier();
                    }
                  }}
                  placeholder="Add supplier name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addSupplier}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              {formData.suppliers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.suppliers.map((supplier, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      <span>{supplier}</span>
                      <button
                        type="button"
                        onClick={() => removeSupplier(index)}
                        className="p-0.5 hover:bg-blue-200 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No suppliers added yet</p>
              )}
            </div>

            {/* Customers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customers
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomer();
                    }
                  }}
                  placeholder="Add customer name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addCustomer}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              {formData.customers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.customers.map((customer, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      <span>{customer}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomer(index)}
                        className="p-0.5 hover:bg-green-200 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No customers added yet</p>
              )}
            </div>
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
              {isEditMode ? 'Save Changes' : 'Add Competitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
