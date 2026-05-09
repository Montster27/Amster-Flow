// Door B · Snapshot dump — the 16-layer dashboard with real persistence.
// Founder fills what they have, picks sources, leaves blanks. Stage gates
// update live as sources change.

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVenture, useLayerStack } from '../hooks/useVenture';
import { LayerRow } from '../components/LayerRow';
import { GateMeter, PageShell, VentureHeader } from '../components/atoms';
import { PK_LAYERS } from '../lib/layers';

const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';

export default function DoorBPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { venture, loading: vLoading, updateVenture } = useVenture(projectId);
  const {
    rows, stack, loading, error, gates, stage, stageBefore, filled, totalLayers, saveLayer,
  } = useLayerStack(projectId);

  // Mark door choice on first save if not already set.
  useEffect(() => {
    if (venture && !venture.door_choice && rows.some((r) => r.claim_text || r.source_value)) {
      void updateVenture({ door_choice: 'B' });
    }
  }, [venture, rows, updateVenture]);

  if (!projectId) {
    return <PageShell><div style={{ padding: 40 }}>Missing project id.</div></PageShell>;
  }
  if (loading || vLoading) {
    return <PageShell><div style={{ padding: 40 }}>Loading stack…</div></PageShell>;
  }
  if (error) {
    return <PageShell>
      <div role="alert" style={{ padding: 40, color: '#be123c' }}>Failed to load: {error}</div>
    </PageShell>;
  }

  // Detect downgrade event
  const downgraded =
    stageBefore && (
      stage === null
      || (stageBefore === 'bmv' && stage !== 'bmv')
      || (stageBefore === 'psf' && stage !== 'psf' && stage !== 'bmv')
      || (stageBefore === 'cpf' && stage === null)
    );

  return (
    <PageShell>
      <VentureHeader
        ventureName="Door B · Snapshot dump"
        industry={venture?.industry_variant}
        evaluator={venture?.evaluator}
        gates={gates}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 11, color: '#64748b',
              letterSpacing: '0.08em',
            }}>{filled}/{totalLayers} FILLED</span>
            <button
              type="button"
              onClick={() => navigate(`/v3/dashboard/${projectId}`)}
              style={{
                padding: '8px 14px', background: '#0b1220', color: '#fff',
                border: 'none', borderRadius: 6, fontSize: 12.5, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >Dashboard →</button>
          </div>
        }
      />

      <div style={{
        padding: '14px 28px', borderBottom: '1px solid #ece6d6',
        background: '#f4f1ea', display: 'flex', alignItems: 'center', gap: 18,
      }}>
        <div style={{
          fontFamily: FONT_SERIF, fontSize: 17, color: '#0b1220',
          lineHeight: 1.4, flex: 1, maxWidth: 720,
        }}>&ldquo;Fill in what you know. Leave blanks where you don&apos;t. Pick the source — that&apos;s the only honesty I need from you.&rdquo;</div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10.5, color: '#94a3b8',
          letterSpacing: '0.08em',
        }}>— MONTY</div>
      </div>

      {downgraded && (
        <div role="alert" style={{
          padding: '10px 28px', background: '#fff8eb', borderBottom: '1px solid #fde68a',
          color: '#92400e', fontSize: 13,
        }}>
          ⚠ Stage downgraded — {stageBefore?.toUpperCase()} requirements no longer met.
          That&apos;s the right behavior; the alternative is locking you into a stage you don&apos;t have evidence for.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 0, alignItems: 'stretch' }}>
        <div>
          {PK_LAYERS.map((L) => (
            <LayerRow
              key={L.id}
              layer={L}
              row={stack[L.id]}
              evaluator={venture?.evaluator ?? 'investor'}
              onSave={(patch) => saveLayer(L.id, patch)}
            />
          ))}
        </div>

        <aside style={{
          background: '#f4f1ea', borderLeft: '1px solid #ece6d6',
          padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 12,
          position: 'sticky', top: 64, alignSelf: 'flex-start',
          height: 'calc(100vh - 64px)', overflow: 'auto',
        }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: '#0b1220', fontWeight: 700,
          }}>Stage gates</div>
          {gates.map((g) => <GateMeter key={g.id} gate={g} />)}
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10, color: '#94a3b8',
            letterSpacing: '0.08em',
          }}>
            {stage ? `Current stage: ${stage.toUpperCase()}` : 'Pre-CPF · keep filling'}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
