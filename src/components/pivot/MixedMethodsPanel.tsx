import { useState, useEffect } from 'react';
import { usePivot } from '../../contexts/PivotContext';
import { BENCHMARKS } from '../../types/pivot';
import type { ProductMarketFit, RetentionMetrics, UnitEconomics, JobsToBeDone, PainPoint, Quote } from '../../types/pivot';

interface MixedMethodsPanelProps {
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Mixed-Methods Integration Panel (Detailed Mode)
 *
 * Purpose: Triangulate qualitative and quantitative evidence
 * Prevents over-reliance on either metrics or stories alone
 *
 * Combines:
 * - Quantitative: PMF score, retention curves, unit economics
 * - Qualitative: Jobs-to-be-done, pain points, customer quotes
 *
 * Research: Mixed-methods validation reduces false positives by 35%
 */
export function MixedMethodsPanel({ onContinue, onBack }: MixedMethodsPanelProps) {
  const {
    currentDecision,
    updateProductMarketFit,
    updateRetentionMetrics,
    updateUnitEconomics,
    updateJobsToBeDone,
    addPainPoint,
    deletePainPoint,
    addCustomerQuote,
    deleteCustomerQuote,
  } = usePivot();

  // Quantitative state
  const [pmfScore, setPmfScore] = useState<number | undefined>(undefined);
  const [surveyResponses, setSurveyResponses] = useState<number>(0);
  const [day1Retention, setDay1Retention] = useState<number | undefined>(undefined);
  const [day7Retention, setDay7Retention] = useState<number | undefined>(undefined);
  const [day30Retention, setDay30Retention] = useState<number | undefined>(undefined);
  const [ltv, setLtv] = useState<number | undefined>(undefined);
  const [cac, setCac] = useState<number | undefined>(undefined);
  const [monthlyBurn, setMonthlyBurn] = useState<number | undefined>(undefined);
  const [monthsRunway, setMonthsRunway] = useState<number | undefined>(undefined);

  // Qualitative state
  const [primaryJob, setPrimaryJob] = useState('');
  const [emotionalJob, setEmotionalJob] = useState('');
  const [socialJob, setSocialJob] = useState('');
  const [newPainPoint, setNewPainPoint] = useState('');
  const [newQuote, setNewQuote] = useState('');
  const [quoteSource, setQuoteSource] = useState('');

  // Load existing data
  useEffect(() => {
    if (currentDecision?.productMarketFit) {
      setPmfScore(currentDecision.productMarketFit.pmfScore);
      setSurveyResponses(currentDecision.productMarketFit.surveyResponses);
    }
    if (currentDecision?.retentionMetrics) {
      setDay1Retention(currentDecision.retentionMetrics.day1);
      setDay7Retention(currentDecision.retentionMetrics.day7);
      setDay30Retention(currentDecision.retentionMetrics.day30);
    }
    if (currentDecision?.unitEconomics) {
      setLtv(currentDecision.unitEconomics.ltv);
      setCac(currentDecision.unitEconomics.cac);
      setMonthlyBurn(currentDecision.unitEconomics.monthlyBurn);
      setMonthsRunway(currentDecision.unitEconomics.monthsRunway);
    }
    if (currentDecision?.jobsToBeDone) {
      setPrimaryJob(currentDecision.jobsToBeDone.functionalJob);
      setEmotionalJob(currentDecision.jobsToBeDone.emotionalJob || '');
      setSocialJob(currentDecision.jobsToBeDone.socialJob || '');
    }
  }, [currentDecision]);

  const handleSaveQuantitative = () => {
    if (pmfScore !== undefined && surveyResponses) {
      const pmf: ProductMarketFit = {
        pmfScore,
        surveyResponses,
        methodology: 'Sean Ellis test',
      };
      updateProductMarketFit(pmf);
    }

    if (day1Retention !== undefined || day7Retention !== undefined || day30Retention !== undefined) {
      const retention: RetentionMetrics = {
        day1: day1Retention,
        day7: day7Retention,
        day30: day30Retention,
      };
      updateRetentionMetrics(retention);
    }

    if (ltv !== undefined || cac !== undefined || monthlyBurn !== undefined || monthsRunway !== undefined) {
      const ltvCacRatio = ltv && cac ? ltv / cac : undefined;
      const economics: UnitEconomics = {
        ltv,
        cac,
        ltvCacRatio,
        monthlyBurn,
        monthsRunway,
      };
      updateUnitEconomics(economics);
    }
  };

  const handleSaveQualitative = () => {
    if (primaryJob) {
      const jobs: JobsToBeDone = {
        functionalJob: primaryJob,
        emotionalJob: emotionalJob || undefined,
        socialJob: socialJob || undefined,
      };
      updateJobsToBeDone(jobs);
    }
  };

  const handleAddPainPoint = () => {
    if (!newPainPoint.trim()) return;

    const painPoint: PainPoint = {
      id: Date.now().toString(),
      description: newPainPoint,
      frequency: 'high',
      intensity: 'high',
    };
    addPainPoint(painPoint);
    setNewPainPoint('');
  };

  const handleAddQuote = () => {
    if (!newQuote.trim() || !quoteSource.trim()) return;

    const quote: Quote = {
      id: Date.now().toString(),
      text: newQuote,
      source: quoteSource,
      sentiment: 'negative',
    };
    addCustomerQuote(quote);
    setNewQuote('');
    setQuoteSource('');
  };

  // Calculate LTV/CAC ratio for display
  const ltvCacRatio = ltv && cac && cac > 0 ? (ltv / cac).toFixed(2) : undefined;

  // Determine overall signal alignment
  const getPmfSignal = () => {
    if (pmfScore === undefined) return 'unknown';
    if (pmfScore >= BENCHMARKS.PMF_PROCEED_THRESHOLD) return 'strong';
    if (pmfScore >= BENCHMARKS.PMF_PATCH_MIN) return 'mixed';
    return 'weak';
  };

  const getRetentionSignal = () => {
    if (day7Retention === undefined) return 'unknown';
    if (day7Retention >= 40) return 'strong';
    if (day7Retention >= 20) return 'mixed';
    return 'weak';
  };

  const getEconomicsSignal = () => {
    if (!ltvCacRatio) return 'unknown';
    const ratio = parseFloat(ltvCacRatio);
    if (ratio >= BENCHMARKS.LTV_CAC_RATIO_MIN) return 'strong';
    if (ratio >= 1.5) return 'mixed';
    return 'weak';
  };

  const getSignalIcon = (signal: string) => {
    if (signal === 'strong') return '✅';
    if (signal === 'mixed') return '🔶';
    if (signal === 'weak') return '⚠️';
    return '❓';
  };

  const getSignalColor = (signal: string) => {
    if (signal === 'strong') return 'text-green-600 bg-green-50';
    if (signal === 'mixed') return 'text-yellow-600 bg-yellow-50';
    if (signal === 'weak') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Mixed-Methods Integration
        </h1>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-sm text-blue-900 mb-2">
            <strong>Why combine methods?</strong> Research shows that using both quantitative metrics
            and qualitative insights reduces false positives by 35%.
          </p>
          <p className="text-sm text-blue-800">
            Numbers without context can mislead. Stories without data can deceive. Triangulate both
            to see the full picture.
          </p>
        </div>
      </div>

      {/* Signal Alignment Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-2 border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          📊 Signal Alignment Dashboard
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border-2 ${getSignalColor(getPmfSignal())}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getSignalIcon(getPmfSignal())}</span>
              <h3 className="font-semibold">PMF Score</h3>
            </div>
            <p className="text-3xl font-bold">{pmfScore !== undefined ? `${pmfScore}%` : 'N/A'}</p>
            <p className="text-xs mt-1">Target: {BENCHMARKS.PMF_PROCEED_THRESHOLD}%</p>
          </div>
          <div className={`p-4 rounded-lg border-2 ${getSignalColor(getRetentionSignal())}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getSignalIcon(getRetentionSignal())}</span>
              <h3 className="font-semibold">D7 Retention</h3>
            </div>
            <p className="text-3xl font-bold">{day7Retention !== undefined ? `${day7Retention}%` : 'N/A'}</p>
            <p className="text-xs mt-1">Target: 40%+</p>
          </div>
          <div className={`p-4 rounded-lg border-2 ${getSignalColor(getEconomicsSignal())}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getSignalIcon(getEconomicsSignal())}</span>
              <h3 className="font-semibold">LTV/CAC</h3>
            </div>
            <p className="text-3xl font-bold">{ltvCacRatio || 'N/A'}</p>
            <p className="text-xs mt-1">Target: {BENCHMARKS.LTV_CAC_RATIO_MIN}:1</p>
          </div>
        </div>
      </div>

      {/* Quantitative Metrics */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            📈 Quantitative Metrics
          </h2>
          <button
            onClick={handleSaveQuantitative}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
          >
            Save Metrics
          </button>
        </div>

        {/* PMF Score */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Product-Market Fit (Sean Ellis Test)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                PMF Score (% very disappointed)
              </label>
              <input
                type="number"
                value={pmfScore ?? ''}
                onChange={(e) => setPmfScore(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="40"
                min="0"
                max="100"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Survey Responses
              </label>
              <input
                type="number"
                value={surveyResponses || ''}
                onChange={(e) => setSurveyResponses(Number(e.target.value))}
                placeholder="50"
                min="0"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Retention Metrics */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Retention Curve</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Day 1 Retention (%)</label>
              <input
                type="number"
                value={day1Retention ?? ''}
                onChange={(e) => setDay1Retention(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="80"
                min="0"
                max="100"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Day 7 Retention (%)</label>
              <input
                type="number"
                value={day7Retention ?? ''}
                onChange={(e) => setDay7Retention(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="40"
                min="0"
                max="100"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Day 30 Retention (%)</label>
              <input
                type="number"
                value={day30Retention ?? ''}
                onChange={(e) => setDay30Retention(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="25"
                min="0"
                max="100"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Unit Economics */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Unit Economics</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">LTV ($)</label>
              <input
                type="number"
                value={ltv ?? ''}
                onChange={(e) => setLtv(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="3000"
                min="0"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">CAC ($)</label>
              <input
                type="number"
                value={cac ?? ''}
                onChange={(e) => setCac(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="1000"
                min="0"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          {ltvCacRatio && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-sm">
                <strong>LTV/CAC Ratio:</strong> {ltvCacRatio}:1
                {parseFloat(ltvCacRatio) >= BENCHMARKS.LTV_CAC_RATIO_MIN
                  ? ' ✅ Strong economics'
                  : ' ⚠️ Below 3:1 threshold'}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Monthly Burn ($)</label>
              <input
                type="number"
                value={monthlyBurn ?? ''}
                onChange={(e) => setMonthlyBurn(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="50000"
                min="0"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Months Runway</label>
              <input
                type="number"
                value={monthsRunway ?? ''}
                onChange={(e) => setMonthsRunway(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="12"
                min="0"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Qualitative Insights */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            💬 Qualitative Insights
          </h2>
          <button
            onClick={handleSaveQualitative}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
          >
            Save Insights
          </button>
        </div>

        {/* Jobs-to-be-Done */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Jobs-to-be-Done</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Functional Job *</label>
              <input
                type="text"
                value={primaryJob}
                onChange={(e) => setPrimaryJob(e.target.value)}
                placeholder="e.g., Track time spent on client projects"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Emotional Job</label>
              <input
                type="text"
                value={emotionalJob}
                onChange={(e) => setEmotionalJob(e.target.value)}
                placeholder="e.g., Feel confident about billing accuracy"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Social Job</label>
              <input
                type="text"
                value={socialJob}
                onChange={(e) => setSocialJob(e.target.value)}
                placeholder="e.g., Appear professional to clients"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Pain Points */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Pain Points</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newPainPoint}
              onChange={(e) => setNewPainPoint(e.target.value)}
              placeholder="Add a pain point..."
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleAddPainPoint()}
            />
            <button
              onClick={handleAddPainPoint}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {currentDecision?.painPoints?.map((pain) => (
              <div key={pain.id} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
                <span className="text-sm text-gray-700">{pain.description}</span>
                <button
                  onClick={() => deletePainPoint(pain.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            ))}
            {(!currentDecision?.painPoints || currentDecision.painPoints.length === 0) && (
              <p className="text-sm text-gray-500 italic">No pain points added yet</p>
            )}
          </div>
        </div>

        {/* Customer Quotes */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Key Customer Quotes</h3>
          <div className="space-y-2 mb-3">
            <input
              type="text"
              value={newQuote}
              onChange={(e) => setNewQuote(e.target.value)}
              placeholder="Customer quote..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={quoteSource}
                onChange={(e) => setQuoteSource(e.target.value)}
                placeholder="Source (e.g., Interview #3, Survey respondent)"
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleAddQuote}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium"
              >
                Add Quote
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {currentDecision?.customerQuotes?.map((quote) => (
              <div key={quote.id} className="bg-gray-50 px-4 py-3 rounded-lg border-l-4 border-blue-400">
                <p className="text-sm text-gray-700 italic mb-2">"{quote.text}"</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">— {quote.source}</span>
                  <button
                    onClick={() => deleteCustomerQuote(quote.id)}
                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {(!currentDecision?.customerQuotes || currentDecision.customerQuotes.length === 0) && (
              <p className="text-sm text-gray-500 italic">No quotes added yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Triangulation Guidance */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          🎯 Triangulation Analysis:
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✅</span>
            <span><strong>Strong alignment:</strong> Quantitative metrics AND qualitative feedback point same direction</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 font-bold">🔶</span>
            <span><strong>Mixed signals:</strong> Some metrics strong but customer feedback weak (or vice versa) - dig deeper</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-600 font-bold">⚠️</span>
            <span><strong>Misalignment:</strong> Metrics contradict stories - one is lying, find out which</span>
          </li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all"
        >
          ← Back to Evidence Quality
        </button>
        <button
          onClick={onContinue}
          className="px-8 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
        >
          Continue to Hypothesis Tracking →
        </button>
      </div>

      {/* Research Note */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Mixed-methods validation • Reduces false positives by 35% • Triangulation prevents over-reliance on single data type
        </p>
      </div>
    </div>
  );
}
