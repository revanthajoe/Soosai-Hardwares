function CategoryFilter({ categories, value, onChange }) {
  return (
    <select className="filter-select" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">All categories</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}

export default CategoryFilter;
