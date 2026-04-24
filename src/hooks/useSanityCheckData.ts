import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useSanityCheckStore, type SanityContact } from '../features/sanitycheck/sanityCheckStore';
import { captureException } from '../lib/sentry';

type QuickCheckRow = {
  segments?: Array<{
    segmentId: number;
    segmentName: string;
    isBeachhead: boolean;
    contacts?: string[];
  }>;
};

/**
 * Loads Sanity Check state for a project. Seeds from Quick Check's beachhead
 * contacts on first visit and then autosaves to `project_sanity_check`.
 */
export function useSanityCheckData(projectId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingQuickCheck, setMissingQuickCheck] = useState(false);
  const { user } = useAuth();
  const { contacts, acknowledgedLatentWarning, completed, importData, exportData, reset } =
    useSanityCheckStore();
  const initialLoadRef = useRef(false);
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        reset();
        initialLoadRef.current = false;
        setLoading(true);
        setError(null);
        setMissingQuickCheck(false);

        const { data: row, error: rowErr } = await (supabase as any)
          .from('project_sanity_check')
          .select('*')
          .eq('project_id', projectId)
          .maybeSingle();

        if (rowErr) throw rowErr;

        if (row) {
          importData({
            contacts: (row.contacts || []) as SanityContact[],
            acknowledgedLatentWarning: !!row.acknowledged_latent_warning,
            completed: !!row.completed,
          });
          initialLoadRef.current = true;
          return;
        }

        // No sanity check row yet — seed from Quick Check's beachhead contacts
        const { data: qcData, error: qcErr } = await (supabase as any)
          .from('project_quick_check')
          .select('segments')
          .eq('project_id', projectId)
          .maybeSingle();

        if (qcErr) throw qcErr;

        const qc = qcData as QuickCheckRow | null;
        const beachhead = qc?.segments?.find((s) => s.isBeachhead);
        if (!beachhead) {
          setMissingQuickCheck(true);
          initialLoadRef.current = true;
          return;
        }

        const namedContacts = (beachhead.contacts ?? ['', '', '']).slice(0, 3);
        while (namedContacts.length < 3) namedContacts.push('');

        const seeded: SanityContact[] = namedContacts.map((name, index) => ({
          index,
          name: name.trim(),
          status: 'not_started',
          hasProblem: null,
          isSolving: null,
          notes: '',
          interviewedAt: null,
        }));

        importData({
          contacts: seeded,
          acknowledgedLatentWarning: false,
          completed: false,
        });
        initialLoadRef.current = true;
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Error loading Sanity Check data');
        captureException(e, { extra: { projectId, context: 'useSanityCheckData load' } });
        setError('Failed to load Sanity Check data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectId, importData, reset]);

  useEffect(() => {
    if (!projectId || !user || loading || !initialLoadRef.current || missingQuickCheck) return;

    const save = async () => {
      if (isSavingRef.current) return;
      try {
        isSavingRef.current = true;
        const current = exportData();
        await (supabase as any)
          .from('project_sanity_check')
          .upsert(
            {
              project_id: projectId,
              contacts: current.contacts,
              acknowledged_latent_warning: current.acknowledgedLatentWarning,
              completed: current.completed,
              updated_by: user.id,
            },
            { onConflict: 'project_id' }
          );
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Error saving Sanity Check data');
        captureException(e, { extra: { projectId, context: 'useSanityCheckData save' } });
      } finally {
        isSavingRef.current = false;
      }
    };

    const timeoutId = setTimeout(save, 1000);
    return () => clearTimeout(timeoutId);
  }, [projectId, user, contacts, acknowledgedLatentWarning, completed, loading, exportData, missingQuickCheck]);

  return { loading, error, missingQuickCheck };
}
