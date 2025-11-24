/**
 * SectorMapDashboard - Main container for the redesigned Sector Map
 *
 * Layout: 2-column grid with sticky target card on left, competitors/decision makers on right
 * Responsibilities:
 * - Overall page layout and grid structure
 * - Orchestrates child components
 * - Manages high-level state (activeTab, modals)
 */

import { useState } from 'react';
import { useSectorMap } from '../../contexts/SectorMapContext';
import { SectorMapHeader } from './SectorMapHeader';
import { TargetCustomerCard } from './TargetCustomerCard';
import { CompetitorGrid } from './CompetitorGrid';
import { DecisionMakerList } from './DecisionMakerList';
import { EditTargetModal } from './modals/EditTargetModal';
import { ManageCompetitorModal } from './modals/ManageCompetitorModal';
import { ManageDecisionMakerModal } from './modals/ManageDecisionMakerModal';
import { Competitor, DecisionMaker } from '../../types/sectorMap';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function SectorMapDashboard() {
  const {
    customerType,
    setCustomerType,
    firstTarget,
    updateFirstTarget,
    competitors,
    addCompetitor,
    updateCompetitor,
    deleteCompetitor,
    decisionMakers,
    addDecisionMaker,
    updateDecisionMaker,
    deleteDecisionMaker,
  } = useSectorMap();

  const [activeTab, setActiveTab] = useState<'competitors' | 'decision-makers'>('competitors');
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);

  // Modal states
  const [isEditTargetModalOpen, setIsEditTargetModalOpen] = useState(false);
  const [isCompetitorModalOpen, setIsCompetitorModalOpen] = useState(false);
  const [isDecisionMakerModalOpen, setIsDecisionMakerModalOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | undefined>(undefined);
  const [editingDecisionMaker, setEditingDecisionMaker] = useState<DecisionMaker | undefined>(undefined);

  // Target customer handlers
  const handleEditTarget = () => {
    setIsEditTargetModalOpen(true);
  };

  const handleSaveTarget = (target: typeof firstTarget) => {
    updateFirstTarget(target);
  };

  // Competitor handlers
  const handleAddCompetitor = () => {
    setEditingCompetitor(undefined);
    setIsCompetitorModalOpen(true);
  };

  const handleEditCompetitor = (id: string) => {
    const competitor = competitors.find(c => c.id === id);
    if (competitor) {
      setEditingCompetitor(competitor);
      setIsCompetitorModalOpen(true);
    }
  };

  const handleSaveCompetitor = (competitorData: Omit<Competitor, 'id' | 'created'>) => {
    if (editingCompetitor) {
      updateCompetitor(editingCompetitor.id, competitorData);
    } else {
      addCompetitor(
        competitorData.name,
        competitorData.description,
        competitorData.suppliers,
        competitorData.customers
      );
    }
  };

  const handleDeleteCompetitor = (id: string) => {
    if (confirm('Are you sure you want to delete this competitor?')) {
      deleteCompetitor(id);
    }
  };

  // Decision maker handlers
  const handleAddDecisionMaker = () => {
    setEditingDecisionMaker(undefined);
    setIsDecisionMakerModalOpen(true);
  };

  const handleEditDecisionMaker = (id: string) => {
    const dm = decisionMakers.find(d => d.id === id);
    if (dm) {
      setEditingDecisionMaker(dm);
      setIsDecisionMakerModalOpen(true);
    }
  };

  const handleSaveDecisionMaker = (dmData: Omit<DecisionMaker, 'id' | 'created'>) => {
    if (editingDecisionMaker) {
      updateDecisionMaker(editingDecisionMaker.id, dmData);
    } else {
      addDecisionMaker(dmData.role, dmData.influence, dmData.description);
    }
  };

  const handleDeleteDecisionMaker = (id: string) => {
    if (confirm('Are you sure you want to delete this decision maker?')) {
      deleteDecisionMaker(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Container */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <SectorMapHeader
          customerType={customerType}
          onCustomerTypeChange={setCustomerType}
        />

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          {/* Zone A: Target Customer (Left - Sticky) - Collapsible */}
          {!isLeftPanelCollapsed && (
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-6">
                <TargetCustomerCard
                  target={firstTarget}
                  customerType={customerType}
                  onEdit={handleEditTarget}
                />
              </div>
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
            className="hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-8 h-16 bg-white border border-gray-300 rounded-r-lg shadow-md hover:bg-gray-50 transition-colors"
            title={isLeftPanelCollapsed ? "Show target customer" : "Hide target customer"}
          >
            {isLeftPanelCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Zone B: Ecosystem (Right) */}
          <div className={isLeftPanelCollapsed ? "lg:col-span-3" : "lg:col-span-2"}>
            {/* Tab Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('competitors')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'competitors'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Competitors ({competitors.length})
              </button>
              {customerType === 'consumer' && (
                <button
                  onClick={() => setActiveTab('decision-makers')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'decision-makers'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Decision Makers ({decisionMakers.length})
                </button>
              )}
            </div>

            {/* Content Area */}
            {activeTab === 'competitors' ? (
              <CompetitorGrid
                competitors={competitors}
                onAdd={handleAddCompetitor}
                onEdit={handleEditCompetitor}
                onDelete={handleDeleteCompetitor}
              />
            ) : (
              <DecisionMakerList
                decisionMakers={decisionMakers}
                onAdd={handleAddDecisionMaker}
                onEdit={handleEditDecisionMaker}
                onDelete={handleDeleteDecisionMaker}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditTargetModal
        isOpen={isEditTargetModalOpen}
        target={firstTarget}
        customerType={customerType}
        onSave={handleSaveTarget}
        onClose={() => setIsEditTargetModalOpen(false)}
      />

      <ManageCompetitorModal
        isOpen={isCompetitorModalOpen}
        competitor={editingCompetitor}
        onSave={handleSaveCompetitor}
        onClose={() => {
          setIsCompetitorModalOpen(false);
          setEditingCompetitor(undefined);
        }}
      />

      <ManageDecisionMakerModal
        isOpen={isDecisionMakerModalOpen}
        decisionMaker={editingDecisionMaker}
        onSave={handleSaveDecisionMaker}
        onClose={() => {
          setIsDecisionMakerModalOpen(false);
          setEditingDecisionMaker(undefined);
        }}
      />
    </div>
  );
}
