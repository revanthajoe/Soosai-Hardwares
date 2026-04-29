function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="pagination">
      <button type="button" className="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Prev
      </button>
      {pages.map((item) => (
        <button
          type="button"
          key={item}
          className={`page-btn ${item === page ? 'active' : ''}`}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
      <button type="button" className="ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
}

export default Pagination;
