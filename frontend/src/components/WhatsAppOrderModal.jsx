import { api } from '../services/api';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919842123380';

export default function WhatsAppOrderModal({ isOpen, onClose, items }) {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const customerName = form.customerName.value;
    const phone = form.phone.value;
    const address = form.address.value;

    let message = `*New Order from Soosai Hardwares Website*\n`;
    message += `Name: ${customerName}\n`;
    message += `Phone: ${phone}\n`;
    message += `Address: ${address}\n\n`;
    message += `*Items:*\n`;

    items.forEach((item) => {
      const qty = item.qty || 1;
      const name = item.name || item.product?.name || 'Item';
      message += `- ${name} (x${qty})\n`;
    });



    const num = WHATSAPP_NUMBER.startsWith('91') ? WHATSAPP_NUMBER : `91${WHATSAPP_NUMBER}`;
    const whatsappUrl = `https://wa.me/${num}?text=${encodeURIComponent(message)}`;

    api.incrementOrder().catch(console.error);

    window.open(whatsappUrl, '_blank');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <h2 style={{ marginBottom: '1rem' }}>Order Details</h2>
        <div style={{ marginBottom: '1rem' }}>
          <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
            {items.length} item{items.length !== 1 ? 's' : ''} selected
          </p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div>
            <label className="modal-label">Name *</label>
            <input name="customerName" type="text" required autoComplete="name" placeholder="Your full name" />
          </div>
          <div>
            <label className="modal-label">Phone Number *</label>
            <input name="phone" type="tel" required autoComplete="tel" placeholder="+91 98421 23380" />
          </div>
          <div>
            <label className="modal-label">Delivery Address *</label>
            <textarea name="address" required rows="3" autoComplete="street-address" placeholder="Your delivery address"></textarea>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
            <button type="button" className="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="wa-btn" style={{ flex: 1 }}>Continue to WhatsApp</button>
          </div>
        </form>
      </div>
    </div>
  );
}
