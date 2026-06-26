function Loader({ text = 'Loading...' }) {
  return (
    <div className="panel" style={{ textAlign: 'center', padding: '2rem' }}>
      <div className="loader-spinner"></div>
      <p className="muted" style={{ marginTop: '0.5rem' }}>{text}</p>
    </div>
  );
}

export default Loader;
