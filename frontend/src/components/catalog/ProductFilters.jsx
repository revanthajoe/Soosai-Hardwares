import SearchBar from './SearchBar';
import CategoryFilter from './CategoryFilter';

function ProductFilters({
  search, setSearch,
  category, setCategory, categories,
  brand, setBrand, brands,
  sortBy, setSortBy,
  onReset
}) {
  return (
    <div className="toolbar-controls" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <SearchBar value={search} onChange={setSearch} />
      <CategoryFilter categories={categories} value={category} onChange={setCategory} />
      
      <select className="filter-select" value={brand} onChange={(e) => setBrand(e.target.value)}>
        <option value="">All brands</option>
        {brands.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      
      <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="featured">Featured first</option>
        <option value="name-asc">Name: A to Z</option>
      </select>

      <button 
        type="button" 
        className="ghost" 
        onClick={onReset}
        style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
      >
        Reset Filters
      </button>
    </div>
  );
}

export default ProductFilters;
