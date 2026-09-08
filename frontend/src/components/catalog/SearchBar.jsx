function SearchBar({ value, onChange }) {
  return (
    <>
      <label htmlFor="product-search" className="sr-only">Search products</label>
      <input
        id="product-search"
        name="search"
        type="search"
        className="search-input"
        placeholder="Search products"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </>
  );
}

export default SearchBar;
