import { useEffect } from 'react';
import { api } from '../services/api';
import { safeGetItem, safeSetItem } from '../utils/storage';

const VISIT_KEY = 'soosai_visited';

function AnalyticsTracker() {
  useEffect(() => {
    // Guarded: sessionStorage throws outright when a browser blocks storage,
    // and this only runs when the key is unset - i.e. on a first visit, which
    // made it crash precisely the load it was meant to measure.
    const storage = typeof window === 'undefined' ? null : window.sessionStorage;
    if (!storage) return;

    if (!safeGetItem(storage, VISIT_KEY)) {
      api.incrementVisit().catch(console.error);
      safeSetItem(storage, VISIT_KEY, 'true');
    }
  }, []);

  return null;
}

export default AnalyticsTracker;
