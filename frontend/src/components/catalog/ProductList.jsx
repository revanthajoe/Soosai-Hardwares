import ProductCard from '../ProductCard';
import { motion } from 'framer-motion';

function ProductList({ products, whatsappNumber }) {
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
        <ProductCard key={product.id} product={product} whatsappNumber={whatsappNumber} index={index} />
      ))}
    </motion.div>
  );
}

export default ProductList;
