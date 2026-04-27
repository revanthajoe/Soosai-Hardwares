import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import { toMediaUrl } from '../services/media';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(price || 0);

function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const stockLabel = useMemo(() => {
    if (!product) return '';
    if (product.stock <= 0) return 'Out of Stock';
    if (product.stock <= 5) return 'Low Stock';
    return 'In Stock';
  }, [product]);

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
        {product.image ? (
          <img src={toMediaUrl(product.image)} alt={product.name} className="detail-image" />
        ) : null}

        <div>
          <h1>{product.name}</h1>
          <p className="meta">{product.brand || 'Generic'} • {product.category?.name}</p>
          <p className="price">{formatPrice(product.price)} / {product.unit || 'piece'}</p>
          <p className="stock">Stock: {product.stock} ({stockLabel})</p>
          <p className="description">{product.description || 'No description available.'}</p>

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

          <a className="wa-btn large" href={whatsappUrl} target="_blank" rel="noreferrer">
            Order on WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}

export default ProductDetailPage;
