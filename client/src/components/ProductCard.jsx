import { Link } from "react-router-dom";
import { money } from "../services/api";

export default function ProductCard({ product }) {
  const available = Number(product.stock) > 0;
  return (
    <Link
      to={"/products/" + product.id}
      className="product panel tn-product-card"
      title={product.name}
    >
      <div className="product-image">
        <img
          src={product.image_path}
          alt={product.name}
          width="1254"
          height="1254"
          loading="lazy"
        />
        <span className={"badge tn-stock-badge" + (available ? "" : " is-out")}>
          {available ? "Còn hàng" : "Hết hàng"}
        </span>
      </div>
      <div className="product-info">
        <small>{product.category_name} / {product.brand_name}</small>
        <h3>{product.name}</h3>
        <strong>{money(product.price)}</strong>
        <span className="product-cta tn-product-link">
          Xem chi tiết <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}

