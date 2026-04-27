/**
 * Performance Optimization Utilities
 * Utilities for optimizing website performance
 */

// Lazy load images with intersection observer
export function useLazyLoadImages() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

// Debounce function for handling frequent events
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for limiting function calls
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Prefetch data
export function prefetchData(url) {
  if ('fetch' in window) {
    fetch(url, { priority: 'low' });
  }
}

// Report Web Vitals
export function reportWebVitals(onPerfEntry) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
}

// Optimize images by reducing quality
export function optimizeImageUrl(url, width = 800, quality = 80) {
  if (url && url.includes('/media/')) {
    const params = `?w=${width}&q=${quality}`;
    return url.includes('?') ? url + '&' + params.slice(1) : url + params;
  }
  return url;
}
