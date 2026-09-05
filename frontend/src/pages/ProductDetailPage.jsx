import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import ReviewsSection from '../components/ReviewsSection';
import WhatsAppOrderModal from '../components/WhatsAppOrderModal';
import { toMediaUrl } from '../services/media';
import { useShoppingLists } from '../hooks/useShoppingLists';

function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const { wishlistIds, toggleWishlist, addToCart } = useShoppingLists();
  const [selectedImage, setSelectedImage] = useState('');
  // Populated by ReviewsSection below, which already fetches this list — the
  // page used to fetch it a second time purely to show the average.
  const [reviewStats, setReviewStats] = useState({ count: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.getProductById(id);
        setProduct(response.data);
      } catch (err) {
        setError(err.message || 'Failed to load product.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  // Dynamic SEO metadata
  useEffect(() => {
    if (!product) return;

    const originalTitle = document.title;
    document.title = `${product.name} | Soosai Hardwares`;

    // Update or create meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    const descText = product.description
      ? `${product.name} — ${product.description.substring(0, 140)}. View details and order via WhatsApp at Soosai Hardwares.`
      : `${product.name} from Soosai Hardwares. View product details and contact us on WhatsApp for availability and ordering.`;
    metaDesc.setAttribute('content', descText);

    // Canonical URL for this product, so the SPA doesn't report every route as
    // the homepage canonical from index.html.
    let canonical = document.querySelector('link[rel="canonical"]');
    const originalCanonical = canonical ? canonical.getAttribute('href') : '';
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}/products/${product.id}`);

    // Product structured data for rich results.
    const ldScript = document.createElement('script');
    ldScript.type = 'application/ld+json';
    ldScript.dataset.productSchema = 'true';
    ldScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description || undefined,
      image: product.image || undefined,
      sku: String(product.id),
      brand: { '@type': 'Brand', name: product.brand || 'Generic' },
      category: product.category?.name || undefined,
      offers: {
        '@type': 'Offer',
        availability: 'https://schema.org/InStock',
        priceCurrency: 'INR',
        url: `${window.location.origin}/products/${product.id}`,
        seller: { '@type': 'Organization', name: 'Soosai Hardwares' },
      },
    });
    document.head.appendChild(ldScript);

    return () => {
      document.title = originalTitle;
      if (metaDesc) metaDesc.setAttribute('content', originalDesc);
      if (canonical) canonical.setAttribute('href', originalCanonical);
      ldScript.remove();
    };
  }, [product]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const images = [];

    if (product.image) images.push(product.image);

    const extra = product.gallery || product.images || product.imageGallery || [];
    if (Array.isArray(extra)) {
      images.push(...extra);
    } else if (typeof extra === 'string') {
      images.push(...extra.split(',').map((item) => item.trim()).filter(Boolean));
    }

    return Array.from(new Set(images));
  }, [product]);

  useEffect(() => {
    if (!galleryImages.length) {
      setSelectedImage('');
      return;
    }
    setSelectedImage((current) => current || galleryImages[0]);
  }, [galleryImages]);

  const isWishlisted = wishlistIds.includes(product?.id);

  if (loading) return <div className="container page-gap"><Loader text="Loading product..." /></div>;
  if (error) return <div className="container page-gap"><Alert type="error">{error}</Alert></div>;
  if (!product) return <div className="container page-gap"><Alert type="error">Product not found.</Alert></div>;

  return (
    <div className="container page-gap">
      <section className="panel detail-layout">
        <div className="detail-media">
          {selectedImage ? (
            <img
              src={toMediaUrl(selectedImage)}
              alt={product.name}
              className="detail-image"
              decoding="async"
              width="800"
              height="800"
            />
          ) : null}
          {galleryImages.length > 1 ? (
            <div className="thumb-row">
              {galleryImages.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={`thumb ${item === selectedImage ? 'active' : ''}`}
                  onClick={() => setSelectedImage(item)}
                >
                  <img src={toMediaUrl(item)} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <h1>
            {product.name}
            {product.nickname && <span className="nickname-badge" style={{ marginLeft: '0.5rem', verticalAlign: 'middle', fontSize: '1rem' }}>aka {product.nickname}</span>}
          </h1>
          <p className="meta">{product.brand || 'Generic'} • {product.category?.name}</p>

          <p className="description">{product.description || 'No description available.'}</p>
          <div className="rating-row">
            <span className="rating">★ {reviewStats.averageRating || 'New'}</span>
            <span className="muted">({reviewStats.count} reviews)</span>
          </div>

          <div className="qty-row large">
            <label htmlFor="detail-qty">Quantity</label>
            <input
              id="detail-qty"
              type="number"
              min="1"
              value={qty}
              onChange={(event) => setQty(Number(event.target.value || 1))}
            />
          </div>

          <div className="detail-actions">
            <button type="button" className="ghost" onClick={() => addToCart(product, qty)}>Add to Cart</button>
            <button
              type="button"
              className={`ghost ${isWishlisted ? 'active' : ''}`}
              onClick={() => toggleWishlist(product)}
            >
              {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
            </button>
          </div>

          <button 
            className="wa-btn large" 
            type="button"
            onClick={() => setOrderModalOpen(true)}
          >
            Order on WhatsApp
          </button>
        </div>
      </section>

      <ReviewsSection
        targetId={product.id}
        title={`Reviews for ${product.name}`}
        onStatsChange={setReviewStats}
      />

      <WhatsAppOrderModal 
        isOpen={orderModalOpen} 
        onClose={() => setOrderModalOpen(false)} 
        items={[{ product, qty }]} 
      />
    </div>
  );
}

export default ProductDetailPage;
