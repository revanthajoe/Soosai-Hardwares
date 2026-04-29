import { useState } from 'react';
import { api } from '../services/api';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919842123380';

export default function WhatsAppOrderModal({ isOpen, onClose, items }) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    // Generate message
    let message = `*New Order Details*\n`;
    message += `Name: ${customerName}\n`;
    message += `Phone: ${phone}\n`;
    message += `Address: ${address}\n\n`;
    message += `*Items:*\n`;

    let total = 0;
    items.forEach((item) => {
      const price = item.price || item.product?.price || 0;
      const qty = item.qty || 1;
      const name = item.name || item.product?.name || 'Item';
      const itemTotal = price * qty;
      total += itemTotal;
      message += `- ${name} (x${qty}) = ₹${itemTotal.toFixed(2)}\n`;
    });

    message += `\n*Total Estimate: ₹${total.toFixed(2)}*`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    // Track analytics
    api.incrementOrder().catch(console.error);

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="modal-content" style={{
        background: '#fff', padding: '2rem', borderRadius: '8px',
        width: '100%', maxWidth: '400px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <h2 style={{ marginBottom: '1rem', color: '#1a1a1a' }}>Order Details</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', color: '#555' }}>Name *</label>
            <input 
              type="text" 
              required 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', color: '#555' }}>Phone Number *</label>
            <input 
              type="tel" 
              required 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', color: '#555' }}>Delivery Address *</label>
            <textarea 
              required 
              rows="3"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} 
            ></textarea>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="button-link" style={{ flex: 1 }}>Continue to WhatsApp</button>
          </div>
        </form>
      </div>
    </div>
  );
}
