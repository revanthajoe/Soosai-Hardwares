import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../services/api';
import { toMediaUrl } from '../services/media';

const AUTOPLAY_MS = 5000;

function AdMedia({ ad }) {
  if (ad.mediaType === 'video') {
    return (
      <video
        src={toMediaUrl(ad.mediaUrl)}
        autoPlay
        muted
        loop
        playsInline
      />
    );
  }

  return <img src={toMediaUrl(ad.mediaUrl)} alt={ad.title || 'Advertisement'} />;
}

function AdsSection() {
  const [ads, setAds] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getAds();
        setAds(res.data || []);
      } catch {
        // Ads are a non-critical homepage enhancement - fail silently
        setAds([]);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (ads.length <= 1 || paused) {
      return undefined;
    }

    intervalRef.current = setInterval(() => {
      setActiveIndex((current) => (current + 1) % ads.length);
    }, AUTOPLAY_MS);

    return () => clearInterval(intervalRef.current);
  }, [ads.length, paused]);

  if (ads.length === 0) {
    return null;
  }

  const activeAd = ads[activeIndex] || ads[0];

  const media = (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeAd.id}
        className="ads-carousel-slide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <AdMedia ad={activeAd} />
      </motion.div>
    </AnimatePresence>
  );

  return (
    <section
      className="ads-section"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="ads-carousel">
        {activeAd.linkUrl ? (
          <a href={activeAd.linkUrl} target="_blank" rel="noopener noreferrer">
            {media}
          </a>
        ) : (
          media
        )}
      </div>

      {ads.length > 1 ? (
        <div className="ads-dots">
          {ads.map((ad, index) => (
            <button
              key={ad.id}
              type="button"
              className={`ads-dot ${index === activeIndex ? 'active' : ''}`}
              aria-label={`Show advertisement ${index + 1}`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default AdsSection;
