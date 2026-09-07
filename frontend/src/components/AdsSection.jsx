import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../services/api';
import { toMediaUrl } from '../services/media';

const IMAGE_AUTOPLAY_MS = 15000;

function AdMedia({ ad, onVideoEnded }) {
  if (ad.mediaType === 'video') {
    return (
      <video
        src={toMediaUrl(ad.mediaUrl)}
        autoPlay
        muted
        playsInline
        onEnded={onVideoEnded}
      />
    );
  }

  return (
    <img
      src={toMediaUrl(ad.mediaUrl)}
      alt={ad.title || 'Store promotion'}
      loading="lazy"
      decoding="async"
    />
  );
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

  const activeAd = ads[activeIndex] || ads[0];

  const advance = () => {
    setActiveIndex((current) => (current + 1) % ads.length);
  };

  useEffect(() => {
    if (ads.length <= 1 || paused || activeAd?.mediaType === 'video') {
      return undefined;
    }

    intervalRef.current = setInterval(advance, IMAGE_AUTOPLAY_MS);

    return () => clearInterval(intervalRef.current);
  }, [ads.length, paused, activeIndex, activeAd?.mediaType]);

  if (ads.length === 0) {
    return null;
  }

  const media = (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeAd.id}
        className="promo-carousel-slide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <AdMedia ad={activeAd} onVideoEnded={ads.length > 1 ? advance : undefined} />
      </motion.div>
    </AnimatePresence>
  );

  return (
    <section
      className="promo-section"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="promo-carousel">
        {activeAd.linkUrl ? (
          <a href={activeAd.linkUrl} target="_blank" rel="noopener noreferrer">
            {media}
          </a>
        ) : (
          media
        )}
      </div>

      {ads.length > 1 ? (
        <div className="promo-dots">
          {ads.map((ad, index) => (
            <button
              key={ad.id}
              type="button"
              className={`promo-dot ${index === activeIndex ? 'active' : ''}`}
              aria-label={`Show promotion ${index + 1}`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default AdsSection;
