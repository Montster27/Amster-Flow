/**
 * CompetitorCard - Individual competitor display card
 *
 * Responsibilities:
 * - Display competitor name, description
 * - Show suppliers and customers as chips/tags
 * - Edit/Delete menu
 * - Empty states for suppliers/customers
 */

import { Competitor } from '../../types/sectorMap';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface CompetitorCardProps {
  competitor: Competitor;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CompetitorCard({ competitor, onEdit, onDelete }: CompetitorCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex-1">
            {competitor.name}
          </h3>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => {
                    onEdit(competitor.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(competitor.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        {competitor.description ? (
          <p className="text-gray-600 text-sm">{competitor.description}</p>
        ) : (
          <p className="text-gray-400 text-sm italic">No description</p>
        )}
      </div>

      {/* Card Footer - Suppliers & Customers */}
      <div className="p-4 bg-gray-50 rounded-b-lg border-t border-gray-100">
        {/* Suppliers */}
        <div className="mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
            Suppliers
          </label>
          {competitor.suppliers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {competitor.suppliers.map((supplier, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {supplier}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No suppliers added</p>
          )}
        </div>

        {/* Customers */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
            Customers
          </label>
          {competitor.customers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {competitor.customers.map((customer, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm"
                >
                  {customer}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No customers added</p>
          )}
        </div>
      </div>
    </div>
  );
}
