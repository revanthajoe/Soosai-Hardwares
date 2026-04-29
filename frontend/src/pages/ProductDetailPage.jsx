import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import ReviewsSection from '../components/ReviewsSection';
import WhatsAppOrderModal from '../components/WhatsAppOrderModal';
import { toMediaUrl } from '../services/media';
import { loadJSON, saveJSON } from '../utils/storage';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210';
const WISHLIST_KEY = 'soosai:wishlist';
const CART_KEY = 'soosai:cart';

const formatPrice = (price) => {
  if (!price) return 'Contact for price';
  if (isNaN(price)) return `₹${price}`; // e.g. "250 to 350" -> "₹250 to 350"
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(price);
};

function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.getProductById(id);
        setProduct(response.data);
        
        try {
          const reviewsResponse = await api.getReviews(id);
          setReviews(reviewsResponse.data.reviews || []);
        } catch (reviewErr) {
          console.error('Failed to load reviews:', reviewErr);
          setReviews([]);
        }
      } catch (err) {
        setError(err.message || 'Failed to load product.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  useEffect(() => {
    setWishlistIds(loadJSON(WISHLIST_KEY, []));
    setCartItems(loadJSON(CART_KEY, []));
  }, []);

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

  const averageRating = reviews.length
    ? Math.round((reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length) * 10) / 10
    : 0;

  const toggleWishlist = () => {
    const next = isWishlisted
      ? wishlistIds.filter((item) => item !== product.id)
      : [...wishlistIds, product.id];
    setWishlistIds(next);
    saveJSON(WISHLIST_KEY, next);
  };

  const addToCart = () => {
    const current = [...cartItems];
    const index = current.findIndex((item) => item.id === product.id);
    if (index >= 0) {
      current[index] = {
        ...current[index],
        qty: current[index].qty + qty,
      };
    } else {
      current.push({ id: product.id, qty, product });
    }
    setCartItems(current);
    saveJSON(CART_KEY, current);
  };

  if (loading) return <div className="container page-gap"><Loader text="Loading product..." /></div>;
  if (error) return <div className="container page-gap"><Alert type="error">{error}</Alert></div>;
  if (!product) return <div className="container page-gap"><Alert type="error">Product not found.</Alert></div>;

  return (
    <div className="container page-gap">
      <section className="panel detail-layout">
        <div className="detail-media">
          {selectedImage ? (
            <img src={toMediaUrl(selectedImage)} alt={product.name} className="detail-image" />
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
                  <img src={toMediaUrl(item)} alt="thumb" />
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
          <p className="price">{formatPrice(product?.price)} / {product.unit || 'piece'}</p>
          <p className="description">{product.description || 'No description available.'}</p>
          <div className="rating-row">
            <span className="rating">★ {averageRating || 'New'}</span>
            <span className="muted">({reviews.length} reviews)</span>
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
            <button type="button" className="ghost" onClick={addToCart}>Add to Cart</button>
            <button
              type="button"
              className={`ghost ${isWishlisted ? 'active' : ''}`}
              onClick={toggleWishlist}
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

      <ReviewsSection targetId={product.id} title={`Reviews for ${product.name}`} />

      <WhatsAppOrderModal 
        isOpen={orderModalOpen} 
        onClose={() => setOrderModalOpen(false)} 
        items={[{ product, qty }]} 
      />
    </div>
  );
}

export default ProductDetailPage;
