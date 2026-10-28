import imageCatalog from "../../../shared/product-images.json";

function normalizeName(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function categoryImage(name) {
  const key = normalizeName(name);
  return imageCatalog.products.find((image) =>
    image.categories.some((alias) => normalizeName(alias) === key)
  )?.path;
}

export default function CategoryStrip({
  categories,
  selectedCategory,
  onSelect,
}) {
  return (
    <section className="tn-category-section" aria-labelledby="tn-category-title">
      <div className="tn-category-heading">
        <span className="eyebrow">KHÁM PHÁ TECHNEST</span>
        <h2 id="tn-category-title">Mua sắm theo danh mục</h2>
      </div>
      <div className="tn-category-track" role="group" aria-label="Lọc theo danh mục">
        <button
          className="tn-category-button"
          type="button"
          aria-pressed={!selectedCategory}
          onClick={() => onSelect("")}
        >
          <span className="tn-category-circle tn-category-all" aria-hidden="true">TN</span>
          <span>Tất cả</span>
        </button>
        {categories.map((category) => {
          const image = categoryImage(category.name);
          return (
            <button
              className="tn-category-button"
              type="button"
              key={category.id}
              aria-pressed={String(category.id) === selectedCategory}
              onClick={() => onSelect(String(category.id))}
            >
              <span className="tn-category-circle">
                {image ? (
                  <img src={image} alt="" width="1254" height="1254" loading="lazy" />
                ) : (
                  <span className="tn-category-letter" aria-hidden="true">
                    {category.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </span>
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

