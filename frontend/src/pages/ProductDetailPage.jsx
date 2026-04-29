import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
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
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
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

  const submitReview = async (event) => {
    event.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;

    try {
      const response = await api.createReview(id, {
        authorName: reviewName.trim(),
        rating: Number(reviewRating),
        comment: reviewComment.trim(),
      });
      
      const newReview = {
        id: response.data.id,
        name: response.data.authorName,
        rating: response.data.rating,
        comment: response.data.comment,
        createdAt: response.data.createdAt,
      };

      setReviews([newReview, ...reviews]);
      setReviewName('');
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    }
  };

  if (loading) return <div className="container page-gap"><Loader text="Loading product..." /></div>;
  if (error) return <div className="container page-gap"><Alert type="error">{error}</Alert></div>;
  if (!product) return <div className="container page-gap"><Alert type="error">Product not found.</Alert></div>;

  const message = `Hello, I want to order:\nProduct: ${product.name}\nQuantity: ${qty} ${
    product.unit || 'piece'
  }\nPrice: ${formatPrice(product.price)}`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

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

      <section className="panel">
        <div className="toolbar">
          <h2>Customer Reviews</h2>
        </div>
        <form className="review-form" onSubmit={submitReview}>
          <input
            type="text"
            placeholder="Your name"
            value={reviewName}
            onChange={(event) => setReviewName(event.target.value)}
            required
          />
          <select value={reviewRating} onChange={(event) => setReviewRating(event.target.value)}>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>{value} Stars</option>
            ))}
          </select>
          <textarea
            rows="3"
            placeholder="Share your experience"
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            required
          />
          <button type="submit" className="button-link">Submit Review</button>
        </form>

        {reviews.length ? (
          <div className="review-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
            {reviews.map((review) => (
              <div className="review-card" key={review.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e3e6e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#555' }}>
                    {(review.name || review.authorName || 'U')[0].toUpperCase()}
                  </div>
                  <strong style={{ fontSize: '1.1rem' }}>{review.name || review.authorName}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#FFA41C', fontSize: '1.2rem', letterSpacing: '2px' }}>
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </span>
                  <strong style={{ color: '#0F1111' }}>Excellent Product</strong>
                </div>
                <div style={{ color: '#c45500', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Verified Purchase</div>
                <p style={{ color: '#0F1111', lineHeight: '1.5' }}>{review.comment}</p>
                <div style={{ color: '#565959', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  Reviewed on {new Date(review.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ marginTop: '1rem' }}>Be the first to review this product.</p>
        )}
      </section>

      <WhatsAppOrderModal 
        isOpen={orderModalOpen} 
        onClose={() => setOrderModalOpen(false)} 
        items={[{ product, qty }]} 
      />
    </div>
  );
}

export default ProductDetailPage;
