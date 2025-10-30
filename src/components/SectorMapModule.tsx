import { useState } from 'react';
import { useSectorMapStore } from '../store/useSectorMapStore';
import { DecisionMaker } from '../types/sectorMap';

export const SectorMapModule = () => {
  const {
    customerType,
    firstTarget,
    competitors,
    decisionMakers,
    setCustomerType,
    updateFirstTarget,
    addCompetitor,
    updateCompetitor,
    deleteCompetitor,
    addSupplierToCompetitor,
    removeSupplierFromCompetitor,
    addCustomerToCompetitor,
    removeCustomerFromCompetitor,
    addDecisionMaker,
    deleteDecisionMaker,
  } = useSectorMapStore();

  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [newCompetitorDesc, setNewCompetitorDesc] = useState('');
  const [editingCompetitor, setEditingCompetitor] = useState<string | null>(null);
  const [newSupplier, setNewSupplier] = useState<Record<string, string>>({});
  const [newCustomer, setNewCustomer] = useState<Record<string, string>>({});

  const [newDMRole, setNewDMRole] = useState('');
  const [newDMInfluence, setNewDMInfluence] = useState<DecisionMaker['influence']>('decision-maker');
  const [newDMDesc, setNewDMDesc] = useState('');

  const handleAddCompetitor = () => {
    if (newCompetitorName.trim()) {
      addCompetitor(newCompetitorName.trim(), newCompetitorDesc.trim());
      setNewCompetitorName('');
      setNewCompetitorDesc('');
    }
  };

  const handleAddSupplier = (competitorId: string) => {
    const supplier = newSupplier[competitorId]?.trim();
    if (supplier) {
      addSupplierToCompetitor(competitorId, supplier);
      setNewSupplier({ ...newSupplier, [competitorId]: '' });
    }
  };

  const handleAddCustomer = (competitorId: string) => {
    const customer = newCustomer[competitorId]?.trim();
    if (customer) {
      addCustomerToCompetitor(competitorId, customer);
      setNewCustomer({ ...newCustomer, [competitorId]: '' });
    }
  };

  const handleAddDecisionMaker = () => {
    if (newDMRole.trim()) {
      addDecisionMaker(newDMRole.trim(), newDMInfluence, newDMDesc.trim());
      setNewDMRole('');
      setNewDMDesc('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Sector Map</h1>
        <p className="text-gray-600">
          Map your competitive landscape and understand the ecosystem around your target market.
        </p>
      </div>

      {/* Customer Type Toggle */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Customer Type</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setCustomerType('business')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              customerType === 'business'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            B2B (Business)
          </button>
          <button
            onClick={() => setCustomerType('consumer')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              customerType === 'consumer'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            B2C (Consumer)
          </button>
        </div>
      </div>

      {/* First Target */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">First Target Customer</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={firstTarget.description}
              onChange={(e) => updateFirstTarget({ description: e.target.value })}
              placeholder="Describe your first target customer in detail..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          {customerType === 'business' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Size
                </label>
                <input
                  type="text"
                  value={firstTarget.companySize || ''}
                  onChange={(e) => updateFirstTarget({ companySize: e.target.value })}
                  placeholder="e.g., 10-50 employees, $1M-$5M revenue"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location/Market
                </label>
                <input
                  type="text"
                  value={firstTarget.location || ''}
                  onChange={(e) => updateFirstTarget({ location: e.target.value })}
                  placeholder="e.g., San Francisco Bay Area, US tech startups"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Competitors */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Competitors & Market Players</h2>

        {/* Add Competitor */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-3">Add Competitor</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newCompetitorName}
              onChange={(e) => setNewCompetitorName(e.target.value)}
              placeholder="Competitor name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={newCompetitorDesc}
              onChange={(e) => setNewCompetitorDesc(e.target.value)}
              placeholder="What do they do? How are they positioned?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
            <button
              onClick={handleAddCompetitor}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              Add Competitor
            </button>
          </div>
        </div>

        {/* Competitor List */}
        <div className="space-y-4">
          {competitors.map((competitor) => (
            <div key={competitor.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  {editingCompetitor === competitor.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={competitor.name}
                        onChange={(e) => updateCompetitor(competitor.id, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <textarea
                        value={competitor.description}
                        onChange={(e) => updateCompetitor(competitor.id, { description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows={2}
                      />
                      <button
                        onClick={() => setEditingCompetitor(null)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold text-lg text-gray-800">{competitor.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{competitor.description}</p>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCompetitor(competitor.id)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCompetitor(competitor.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Suppliers */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2 text-sm">Suppliers</h4>
                  <div className="space-y-2">
                    {competitor.suppliers.map((supplier, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded text-sm">
                        <span>{supplier}</span>
                        <button
                          onClick={() => removeSupplierFromCompetitor(competitor.id, supplier)}
                          className="text-red-600 hover:text-red-700 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSupplier[competitor.id] || ''}
                        onChange={(e) => setNewSupplier({ ...newSupplier, [competitor.id]: e.target.value })}
                        placeholder="Add supplier"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSupplier(competitor.id)}
                      />
                      <button
                        onClick={() => handleAddSupplier(competitor.id)}
                        className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Customers */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2 text-sm">Their Customers</h4>
                  <div className="space-y-2">
                    {competitor.customers.map((customer, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded text-sm">
                        <span>{customer}</span>
                        <button
                          onClick={() => removeCustomerFromCompetitor(competitor.id, customer)}
                          className="text-red-600 hover:text-red-700 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCustomer[competitor.id] || ''}
                        onChange={(e) => setNewCustomer({ ...newCustomer, [competitor.id]: e.target.value })}
                        placeholder="Add customer"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCustomer(competitor.id)}
                      />
                      <button
                        onClick={() => handleAddCustomer(competitor.id)}
                        className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Makers (Consumer Only) */}
      {customerType === 'consumer' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Decision Dynamics</h2>
          <p className="text-gray-600 text-sm mb-4">
            Map out who makes the buying decision, who influences it, and who pays for it (if different).
          </p>

          {/* Add Decision Maker */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-3">Add Decision Maker / Influencer</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newDMRole}
                onChange={(e) => setNewDMRole(e.target.value)}
                placeholder="Role (e.g., Parent, Child, Teacher, Doctor)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />

              <select
                value={newDMInfluence}
                onChange={(e) => setNewDMInfluence(e.target.value as DecisionMaker['influence'])}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="decision-maker">Decision Maker (makes the final call)</option>
                <option value="influencer">Influencer (affects the decision)</option>
                <option value="payer">Payer (pays for someone else)</option>
              </select>

              <textarea
                value={newDMDesc}
                onChange={(e) => setNewDMDesc(e.target.value)}
                placeholder="Describe their role and motivation..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
              />

              <button
                onClick={handleAddDecisionMaker}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                Add
              </button>
            </div>
          </div>

          {/* Decision Maker List */}
          <div className="space-y-3">
            {decisionMakers.map((dm) => (
              <div key={dm.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-800">{dm.role}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          dm.influence === 'decision-maker'
                            ? 'bg-green-100 text-green-700'
                            : dm.influence === 'payer'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {dm.influence === 'decision-maker'
                          ? 'Decision Maker'
                          : dm.influence === 'payer'
                          ? 'Payer'
                          : 'Influencer'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{dm.description}</p>
                  </div>
                  <button
                    onClick={() => deleteDecisionMaker(dm.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
