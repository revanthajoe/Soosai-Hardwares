import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toMediaUrl } from '../services/media';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(price || 0);

const getStockLabel = (stock) => {
  if (stock <= 0) return { label: 'Out of Stock', cls: 'badge out' };
  if (stock <= 5) return { label: 'Low Stock', cls: 'badge low' };
  return { label: 'In Stock', cls: 'badge in' };
};

function ProductCard({ product, whatsappNumber = WHATSAPP_NUMBER, index = 0 }) {
  const [qty, setQty] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const stockInfo = useMemo(() => getStockLabel(product.stock), [product.stock]);
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
        </Link>
        <motion.span
          className={stockInfo.cls}
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {stockInfo.label}
        </motion.span>
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
      <p className="description">{product.description || 'No description available.'}</p>
      <p className="stock">Available Units: {product.stock}</p>
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
      <motion.a
        className="wa-btn"
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Order on WhatsApp
      </motion.a>
    </motion.article>
  );
}

export default ProductCard;
