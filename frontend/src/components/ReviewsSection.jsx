import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function ReviewsSection({ targetId = 'shop', title = 'Customer Reviews' }) {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ authorName: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchReviews = async () => {
    try {
      const res = await api.getReviews(targetId);
      setReviews(res.data.reviews || []);
      setAverageRating(res.data.averageRating || 0);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [targetId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.createReview(targetId, form);
      setSuccess('Review submitted successfully!');
      setForm({ authorName: '', rating: 5, comment: '' });
      fetchReviews();
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} style={{ color: i < rating ? '#ffc107' : '#e4e5e9', fontSize: '1.2rem' }}>★</span>
    ));
  };

  return (
    <section className="panel" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>{title}</h2>
        {averageRating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{averageRating}</span>
            <div>{renderStars(Math.round(averageRating))}</div>
            <span className="muted">({reviews.length})</span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="review-list" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '1rem' }}>
          {loading ? (
            <p className="muted">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="muted">No reviews yet. Be the first to leave one!</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{rev.authorName}</strong>
                  <div>{renderStars(rev.rating)}</div>
                </div>
                {rev.comment && <p style={{ margin: '0.5rem 0', opacity: 0.9 }}>{rev.comment}</p>}
                <small className="muted">{new Date(rev.createdAt).toLocaleDateString()}</small>
              </div>
            ))
          )}
        </div>

        <div className="review-form-container" style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px' }}>
          <h3>Write a Review</h3>
          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success" style={{ background: '#d8fbe8', color: '#0d6b43', padding: '0.65rem 0.8rem', borderRadius: '10px', marginBottom: '1rem' }}>{success}</div>}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label>Your Name</label>
              <input 
                required 
                value={form.authorName} 
                onChange={e => setForm({...form, authorName: e.target.value})} 
                placeholder="John Doe"
              />
            </div>
            <div>
              <label>Rating</label>
              <select 
                value={form.rating} 
                onChange={e => setForm({...form, rating: Number(e.target.value)})}
              >
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Very Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Poor</option>
                <option value="1">1 - Terrible</option>
              </select>
            </div>
            <div>
              <label>Comment (Optional)</label>
              <textarea 
                rows="3" 
                value={form.comment} 
                onChange={e => setForm({...form, comment: e.target.value})} 
                placeholder="What did you like or dislike?"
              ></textarea>
            </div>
            <button type="submit" disabled={submitting} className="button-link">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
