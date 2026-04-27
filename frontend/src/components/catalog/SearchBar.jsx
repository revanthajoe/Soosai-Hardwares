function SearchBar({ value, onChange }) {
  return (
    <input
      type="search"
      className="search-input"
      placeholder="Search products"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export default SearchBar;
