/**
 * CompetitorGrid - Grid container for competitor cards
 *
 * Responsibilities:
 * - Layout competitor cards in a responsive grid
 * - Show "Add New" card
 * - Empty state when no competitors
 * - Orchestrate edit/delete actions
 */

import { Competitor } from '../../types/sectorMap';
import { CompetitorCard } from './CompetitorCard';
import { Plus } from 'lucide-react';

interface CompetitorGridProps {
  competitors: Competitor[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CompetitorGrid({
  competitors,
  onAdd,
  onEdit,
  onDelete,
}: CompetitorGridProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Competitors ({competitors.length})
        </h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Competitor
        </button>
      </div>

      {/* Grid */}
      {competitors.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No competitors mapped yet
          </h3>
          <p className="text-gray-600 mb-4">
            Who are you fighting against? Add your first competitor to get started.
          </p>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add First Competitor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Competitor Cards */}
          {competitors.map((competitor) => (
            <CompetitorCard
              key={competitor.id}
              competitor={competitor}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}

          {/* Add New Card */}
          <button
            onClick={onAdd}
            className="bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all p-8 flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 min-h-[200px]"
          >
            <Plus className="w-12 h-12 mb-2" />
            <span className="font-medium">Add Competitor</span>
          </button>
        </div>
      )}
    </div>
  );
}
