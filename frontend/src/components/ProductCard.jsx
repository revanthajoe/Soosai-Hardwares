import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toMediaUrl } from '../services/media';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210';

const formatPrice = (price) => {
  if (!price) return 'Contact for price';
  if (isNaN(price)) return `₹${price}`; // e.g. "250 to 350" -> "₹250 to 350"
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(price);
};

function ProductCard({
  product,
  whatsappNumber = WHATSAPP_NUMBER,
  index = 0,
  isWishlisted = false,
  isCompared = false,
  canCompare = true,
  onToggleWishlist,
  onToggleCompare,
  onAddToCart,
  onOrderWhatsApp,
}) {
  const [qty, setQty] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const productId = product.id;

  const message = `Hello, I want to order:%0AProduct: ${product.name}%0AQuantity: ${qty} ${
    product.unit || 'piece'
  }%0APrice: ${formatPrice(product.price)}`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.5,
      },
    },
  };

  return (
    <motion.article
      className="product-card"
      variants={variants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -8 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-head">
        <Link to={`/products/${productId}`} className="product-link">
          <h3>{product.name}</h3>
          {product.nickname && <div className="nickname-badge">aka {product.nickname}</div>}
          {product.avgRating > 0 && (
            <div style={{ fontSize: '0.8rem', color: '#ffc107', marginTop: '0.2rem' }}>
              {'★'.repeat(Math.round(product.avgRating))}{'☆'.repeat(5 - Math.round(product.avgRating))}
              <span className="muted" style={{ marginLeft: '0.4rem', color: 'var(--text)', opacity: 0.6 }}>({product.reviewCount})</span>
            </div>
          )}
        </Link>
        <div className="product-actions">
          <button
            type="button"
            className={`icon-btn ${isWishlisted ? 'active' : ''}`}
            onClick={() => onToggleWishlist?.(product)}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-label="Toggle wishlist"
          >
            {isWishlisted ? '❤' : '♡'}
          </button>
          <button
            type="button"
            className={`icon-btn ${isCompared ? 'active' : ''}`}
            onClick={() => onToggleCompare?.(product)}
            disabled={!isCompared && !canCompare}
            title="Compare"
            aria-label="Toggle compare"
          >
            ⇄
          </button>
        </div>
      </div>
      <p className="meta">
        {product.brand || 'Generic'} • {product.category?.name || 'Uncategorized'}
      </p>
      {product.image ? (
        <motion.div
          className="product-image-wrapper"
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <img className="product-image" src={toMediaUrl(product.image)} alt={product.name} />
        </motion.div>
      ) : null}
      <p className="price">{formatPrice(product.price)}</p>
      <p className="description">{product.description}</p>
      <div className="qty-row">
        <label htmlFor={`qty-${productId}`}>Qty</label>
        <input
          id={`qty-${productId}`}
          type="number"
          min="1"
          value={qty}
          onChange={(event) => setQty(Number(event.target.value || 1))}
        />
      </div>
      <div className="card-actions">
        <button
          type="button"
          className="ghost"
          onClick={() => onAddToCart?.(product, qty)}
        >
          Add to Cart
        </button>
        <motion.button
          className="wa-btn"
          type="button"
          onClick={() => onOrderWhatsApp?.(product, qty)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Order on WhatsApp
        </motion.button>
      </div>
    </motion.article>
  );
}

export default ProductCard;
