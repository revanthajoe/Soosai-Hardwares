import ProductCard from '../ProductCard';
import { motion } from 'framer-motion';

function ProductList({
  products,
  whatsappNumber,
  wishlistIds = [],
  compareIds = [],
  canCompare = true,
  onToggleWishlist,
  onToggleCompare,
  onAddToCart,
  onOrderWhatsApp,
}) {
  if (!products.length) {
    return <p className="empty">No products found.</p>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      className="product-grid"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          whatsappNumber={whatsappNumber}
          index={index}
          isWishlisted={wishlistIds.includes(product.id)}
          isCompared={compareIds.includes(product.id)}
          canCompare={canCompare}
          onToggleWishlist={onToggleWishlist}
          onToggleCompare={onToggleCompare}
          onAddToCart={onAddToCart}
          onOrderWhatsApp={onOrderWhatsApp}
        />
      ))}
    </motion.div>
  );
}

export default ProductList;
