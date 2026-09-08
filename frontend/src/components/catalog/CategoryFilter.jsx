function CategoryFilter({ categories, value, onChange }) {
  return (
    <>
      <label htmlFor="category-filter" className="sr-only">Category</label>
      <select id="category-filter" name="category" className="filter-select" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </>
  );
}

export default CategoryFilter;
