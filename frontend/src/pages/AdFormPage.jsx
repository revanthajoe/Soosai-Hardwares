import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import Alert from '../components/common/Alert';

const emptyForm = {
  title: '',
  linkUrl: '',
  isActive: true,
};

const guessMediaTypeFromUrl = (url) => {
  const ext = (url.split('?')[0].split('.').pop() || '').toLowerCase();
  if (['mp4', 'webm', 'mov', 'm4v'].includes(ext)) return 'video';
  if (ext === 'gif') return 'gif';
  return 'image';
};

function AdFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = useMemo(() => Boolean(id), [id]);

  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mediaMode, setMediaMode] = useState('upload'); // 'upload' | 'url'
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaTypeOverride, setMediaTypeOverride] = useState('image');

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;

      try {
        const res = await api.getAdminAds();
        const item = (res.data || []).find((ad) => String(ad.id) === String(id));
        if (item) {
          setForm({
            title: item.title || '',
            linkUrl: item.linkUrl || '',
            isActive: Boolean(item.isActive),
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to load form data.');
      }
    };

    void load();
  }, [id, isEdit]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleMediaUrlChange = (value) => {
    setMediaUrl(value);
    setMediaTypeOverride(guessMediaTypeFromUrl(value));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (!isEdit && mediaMode === 'upload' && !file) {
      setError('Please select an image, GIF, or video for the advertisement.');
      setLoading(false);
      return;
    }

    if (!isEdit && mediaMode === 'url' && !mediaUrl.trim()) {
      setError('Please paste a media URL for the advertisement.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('linkUrl', form.linkUrl);
    formData.append('isActive', form.isActive);

    if (mediaMode === 'upload' && file) {
      formData.append('media', file);
    } else if (mediaMode === 'url' && mediaUrl.trim()) {
      formData.append('mediaUrl', mediaUrl.trim());
      formData.append('mediaType', mediaTypeOverride);
    }

    try {
      if (isEdit) {
        await api.updateAd(id, formData);
      } else {
        await api.createAd(formData);
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Advertisement save failed.');
    } finally {
      setLoading(false);
    }
  };

  const isVideo = file && file.type.startsWith('video/');

  return (
    <div className="container page-gap">
      <section className="panel">
        <div className="toolbar">
          <h1>{isEdit ? 'Edit Advertisement' : 'Add Advertisement'}</h1>
          <Link className="button-link ghost-link" to="/admin/dashboard">
            Back to Dashboard
          </Link>
        </div>

        <form className="mobile-form" onSubmit={handleSubmit}>
          <label htmlFor="title">Title (optional)</label>
          <input
            id="title"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="e.g. Monsoon Paint Offer"
          />

          <label htmlFor="linkUrl">Link URL (optional)</label>
          <input
            id="linkUrl"
            value={form.linkUrl}
            onChange={(e) => updateField('linkUrl', e.target.value)}
            placeholder="https://..."
          />

          <label>Advertisement Media</label>
          <div className="tabs" style={{ marginBottom: '0.75rem' }}>
            <button type="button" onClick={() => setMediaMode('upload')} className={mediaMode === 'upload' ? 'active' : ''}>Upload File</button>
            <button type="button" onClick={() => setMediaMode('url')} className={mediaMode === 'url' ? 'active' : ''}>Paste URL</button>
          </div>

          {mediaMode === 'upload' ? (
            <div
              className={`drop-zone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('media').click()}
              style={{
                border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border-color)'}`,
                borderRadius: '12px',
                padding: '2rem 1rem',
                textAlign: 'center',
                backgroundColor: isDragging ? 'var(--accent-light)' : 'var(--bg-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {file ? (
                <div style={{ color: 'var(--accent)', fontWeight: '600' }}>
                  {isVideo ? '🎬' : '📁'} {file.name}
                </div>
              ) : (
                <div style={{ color: 'var(--text)', opacity: 0.7 }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</div>
                  Drag &amp; drop an image, GIF, or video here, or click to browse
                  <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    Max 15MB (image/GIF) or 100MB (video)
                  </div>
                </div>
              )}
              <input
                id="media"
                type="file"
                accept="image/*,video/mp4,video/webm"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="inline-inputs">
              <div style={{ flex: 2 }}>
                <label htmlFor="mediaUrl">Media URL</label>
                <input
                  id="mediaUrl"
                  value={mediaUrl}
                  onChange={(e) => handleMediaUrlChange(e.target.value)}
                  placeholder="https://example.com/promo.mp4"
                />
                <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem' }}>
                  Links to media hosted elsewhere (skips cloud storage).
                </p>
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="mediaTypeOverride">Media Type</label>
                <select
                  id="mediaTypeOverride"
                  value={mediaTypeOverride}
                  onChange={(e) => setMediaTypeOverride(e.target.value)}
                >
                  <option value="image">Image</option>
                  <option value="gif">GIF</option>
                  <option value="video">Video</option>
                </select>
              </div>
            </div>
          )}

          <label className="check-row" htmlFor="isActive">
            <input
              id="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => updateField('isActive', e.target.checked)}
            />
            Active (visible on homepage)
          </label>

          <button className="big-button" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Advertisement'}
          </button>
        </form>

        {error ? <Alert type="error">{error}</Alert> : null}
      </section>
    </div>
  );
}

export default AdFormPage;
