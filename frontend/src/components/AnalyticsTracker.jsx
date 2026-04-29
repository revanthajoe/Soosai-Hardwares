import { useEffect } from 'react';
import { api } from '../services/api';

function AnalyticsTracker() {
  useEffect(() => {
    if (!sessionStorage.getItem('soosai_visited')) {
      api.incrementVisit().catch(console.error);
      sessionStorage.setItem('soosai_visited', 'true');
    }
  }, []);

  return null;
}

export default AnalyticsTracker;
