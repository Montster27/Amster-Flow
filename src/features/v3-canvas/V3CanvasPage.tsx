// PivotKit + QU&D — Redesign Canvas. The page that hosts the design canvas
// with all eight surfaces and the Tweaks panel.

import { useEffect, useState } from 'react';
import { DCArtboard, DCPostIt, DCSection, DesignCanvas } from './DesignCanvas';
import { TweakRadio, TweakSelect, TweakSection, TweaksPanel } from './TweaksPanel';
import type { DashView, Evaluator, Industry, Intensity, StackState } from './data';
import { OpeningEditorial, OpeningStrata } from './surfaces/SurfaceOpening';
import {
  DoorAEditorial, DoorAStrata, DoorBEditorial, DoorBStrata,
} from './surfaces/SurfaceDoors';
import { DashMid, DashTight } from './surfaces/SurfaceDashboard';
import { PitchMid, PitchTight } from './surfaces/SurfacePitch';
import { CompassCommit } from './surfaces/SurfaceCompass';
import { SectorMap } from './surfaces/SurfaceSector';
import { AssumptionTray, CrossLayerFlag } from './surfaces/SurfaceAssumptions';

const W = 1100;
const H = 760;

interface StageProps {
  children: React.ReactNode;
  w?: number;
  h?: number;
}

function Stage({ children, w = W, h = H }: StageProps) {
  return (
    <div style={{
      width: w, height: h, background: '#fff',
      overflow: 'hidden', position: 'relative', borderRadius: 2,
    }}>{children}</div>
  );
}

// Inject the design canvas's expected font links + base body styles.
function useCanvasFonts() {
  useEffect(() => {
    const head = document.head;
    const links: HTMLLinkElement[] = [];
    const make = (rel: string, href: string, attrs: Record<string, string> = {}) => {
      const el = document.createElement('link');
      el.rel = rel;
      el.href = href;
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      head.appendChild(el);
      links.push(el);
    };
    make('preconnect', 'https://fonts.googleapis.com');
    make('preconnect', 'https://fonts.gstatic.com', { crossorigin: '' });
    make(
      'stylesheet',
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&display=swap',
    );
    const prevBodyBg = document.body.style.background;
    const prevBodyColor = document.body.style.color;
    const prevHtmlBg = document.documentElement.style.background;
    document.body.style.background = '#1a1612';
    document.body.style.color = '#0b1220';
    document.documentElement.style.background = '#1a1612';
    return () => {
      for (const el of links) el.remove();
      document.body.style.background = prevBodyBg;
      document.body.style.color = prevBodyColor;
      document.documentElement.style.background = prevHtmlBg;
    };
  }, []);
}

export default function V3CanvasPage() {
  useCanvasFonts();

  const [industry, setIndustry] = useState<Industry>('software');
  const [state, setState] = useState<StackState>('midCPF');
  const [intensity, setIntensity] = useState<Intensity>('sharp');
  const [evaluator, setEvaluator] = useState<Evaluator>('investor');
  const [dashView, setDashView] = useState<DashView>('mid');

  const props = { industry, state, intensity, evaluator };

  return (
    <>
      <DesignCanvas>
        <DCSection
          id="opening"
          title="01 · Mentor-voice opening"
          subtitle="Before any UI. Sets the stakes, earns the right to prompt actively."
        >
          <DCArtboard id="o-editorial" label="★ Editorial paper (preferred)" width={W} height={H}>
            <Stage><OpeningEditorial intensity={intensity} /></Stage>
          </DCArtboard>
          <DCArtboard id="o-strata" label="Alt · Strata · dark voice" width={W} height={H}>
            <Stage><OpeningStrata intensity={intensity} /></Stage>
          </DCArtboard>
          <DCPostIt top={-30} left={-260} width={220} rotate={-3}>
            Three intensities of voice. Same closer. Closer is the contract — the rest is just persuasion.
          </DCPostIt>
        </DCSection>

        <DCSection
          id="doorA"
          title="02 · Door A · Guided start"
          subtitle="Linear. Begins at Customer Segment. Six foundation questions before the full stack reveals."
        >
          <DCArtboard id="a-editorial" label="★ Editorial · single question (preferred)" width={W} height={H}>
            <Stage><DoorAEditorial industry={industry} /></Stage>
          </DCArtboard>
          <DCArtboard id="a-strata" label="Alt · Strata · pressure-on-display" width={W} height={H}>
            <Stage><DoorAStrata industry={industry} /></Stage>
          </DCArtboard>
          <DCPostIt top={-30} left={-260} width={220} rotate={-2}>
            Source picker is always visible. The star count comes from how, not how well-written.
          </DCPostIt>
        </DCSection>

        <DCSection
          id="doorB"
          title="★ 03 · Door B · Snapshot dump (preferred model)"
          subtitle="All 16 layers. Fill what you know. Pick a source. Leave blanks where you don't."
        >
          <DCArtboard id="b-editorial" label="Editorial · clean rows" width={W} height={H}>
            <Stage><DoorBEditorial industry={industry} state={state} /></Stage>
          </DCArtboard>
          <DCArtboard id="b-strata" label="Alt · Strata · critical band tinted" width={W} height={H}>
            <Stage><DoorBStrata industry={industry} state={state} /></Stage>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="dash"
          title="★ 04 · Converged dashboard (preferred)"
          subtitle="Both doors land here. Stage gates as star thresholds. Voice surfaces only where pressure is. Toggle the view from Tweaks."
        >
          <DCArtboard
            id="d-toggle"
            label={dashView === 'tight' ? '★ Stack-health diagnostic (toggled)' : '★ 4×4 layer grid (toggled)'}
            width={W}
            height={H}
          >
            <Stage>
              {dashView === 'tight' ? <DashTight {...props} /> : <DashMid {...props} />}
            </Stage>
          </DCArtboard>
          <DCPostIt top={-30} left={-260} width={220} rotate={-2}>
            Stage gates are derived, not declared. Tier per layer ≥ threshold ⇒ pass. No extra rituals.
          </DCPostIt>
        </DCSection>

        <DCSection
          id="pitch"
          title="05 · Investor-pitch pressure-test"
          subtitle="Dashboard → narrative. Low-tier layers attract pushback in Monty's voice."
        >
          <DCArtboard id="p-mid" label="★ Mid · current beat + up-next (preferred)" width={W} height={H}>
            <Stage><PitchMid {...props} /></Stage>
          </DCArtboard>
          <DCArtboard id="p-tight" label="Alt · Tight · single-beat focus" width={W} height={H}>
            <Stage><PitchTight {...props} /></Stage>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="assumptions"
          title="06 · Assumption ingestion — channels 2 + 3"
          subtitle="Beyond direct authoring: spawned candidates from filled layers, and Monty's cross-layer derivations."
        >
          <DCArtboard id="as-tray" label="Channel 2 · Spawn tray" width={W} height={H}>
            <Stage><AssumptionTray industry={industry} /></Stage>
          </DCArtboard>
          <DCArtboard id="as-flag" label="Channel 3 · Cross-layer flag" width={W} height={H}>
            <Stage><CrossLayerFlag industry={industry} /></Stage>
          </DCArtboard>
          <DCPostIt top={-30} left={-260} width={220} rotate={-2}>
            Channel&nbsp;1 is direct authoring (every answer is an assumption). These are the other two ways assumptions enter the stack.
          </DCPostIt>
        </DCSection>

        <DCSection
          id="sector"
          title="07 · Sector map — L03"
          subtitle="Two-degree player landscape. Direct, adjacent, substitute, and do-nothing actors around the venture."
        >
          <DCArtboard id="s-map" label="Sector map · polar" width={W} height={H}>
            <Stage><SectorMap industry={industry} /></Stage>
          </DCArtboard>
          <DCPostIt top={-30} left={-260} width={220} rotate={-2}>
            Different from L04 Competitive Market: this is the broader ecosystem, not the head-to-head.
          </DCPostIt>
        </DCSection>

        <DCSection
          id="compass"
          title="★ 08 · Strategy Compass — L03b · the missing strategic-position layer"
          subtitle="Erin Scott's 2×2. Founder commits to TWO viable quadrants and runs them in parallel until one wins or both die."
        >
          <DCArtboard id="c-commit" label="★ Compass · two parallel-tested quadrants (preferred)" width={W} height={H}>
            <Stage><CompassCommit industry={industry} /></Stage>
          </DCArtboard>
          <DCPostIt top={-30} left={-260} width={240} rotate={-3}>
            The single biggest gap pre-build. The whole point is the divergence — one needle is just an arrow.
          </DCPostIt>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Venture">
          <TweakRadio<Industry>
            label="Industry variant"
            value={industry}
            onChange={setIndustry}
            options={[
              { value: 'software', label: 'Software · PetFinder' },
              { value: 'biotech',  label: 'Biotech · Refrane' },
            ]}
          />
          <TweakSelect<StackState>
            label="Stack state"
            value={state}
            onChange={setState}
            options={[
              { value: 'empty',   label: 'Empty (just started)' },
              { value: 'midCPF',  label: 'Mid CPF (most layers, weak sources)' },
              { value: 'nearPSF', label: 'Near PSF (interviews on critical layers)' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Dashboard">
          <TweakRadio<DashView>
            label="View"
            value={dashView}
            onChange={setDashView}
            options={[
              { value: 'mid',   label: '4×4 grid' },
              { value: 'tight', label: 'Stack health' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Voice">
          <TweakRadio<Intensity>
            label="Mentor intensity"
            value={intensity}
            onChange={setIntensity}
            options={[
              { value: 'direct', label: 'Direct' },
              { value: 'warmer', label: 'Warmer' },
              { value: 'sharp',  label: 'Sharp' },
            ]}
          />
          <TweakSelect<Evaluator>
            label="Pitch evaluator"
            value={evaluator}
            onChange={setEvaluator}
            options={[
              { value: 'investor', label: 'Investor' },
              { value: 'customer', label: 'Paying customer' },
              { value: 'grant',    label: 'Grant committee' },
              { value: 'advisor',  label: 'Academic advisor' },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}
