import ProductCard from "../components/ProductCard";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api, money } from "../services/api";
export function Catalog() {
  const [params, setParams] = useSearchParams(),
    [result, setResult] = useState(null),
    [error, setError] = useState(""),
    [cats, setCats] = useState([]),
    [brands, setBrands] = useState([]);
  const query = params.toString();
  useEffect(() => {
    api("/categories")
      .then((r) => setCats(r.data))
      .catch(() => { });
    api("/brands")
      .then((r) => setBrands(r.data))
      .catch(() => { });
  }, []);
  useEffect(() => {
    let live = true;
    setResult(null);
    setError("");
    api("/products?" + query)
      .then((r) => {
        if (live) setResult(r);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [query]);
  function search(e) {
    e.preventDefault();
    const p = new URLSearchParams(new FormData(e.currentTarget));
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    p.set("page", "1");
    setParams(p);
  }
  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">TECHNEST / CÔNG NGHỆ MỖI NGÀY</span>
          <h1>
            Nâng cấp góc làm việc.
            <br />
            Mở thêm trải nghiệm.
          </h1>
          <p>Laptop, điện thoại và phụ kiện cho những điều bạn muốn làm.</p>
          <a className="button" href="#products">
            Khám phá sản phẩm ↓
          </a>
        </div>
        <img
          src="/images/products/01-laptop.png"
          alt="Laptop màu bạc — ảnh minh họa TechNest"
        />
      </section>
      <section id="products">
        <div className="section-head">
          <div>
            <span className="eyebrow">CHỌN THỨ BẠN CẦN</span>
            <h2>Sản phẩm công nghệ</h2>
          </div>
          <span>{result?.meta.total ?? "…"} sản phẩm</span>
        </div>
        <form className="filters panel" key={query} onSubmit={search}>
          <input
            aria-label="Tìm sản phẩm"
            name="q"
            placeholder="Tìm laptop, điện thoại…"
            defaultValue={params.get("q") || ""}
            maxLength={100}
          />
          <select
            aria-label="Danh mục"
            name="category"
            defaultValue={params.get("category") || ""}
          >
            <option value="">Mọi danh mục</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Thương hiệu"
            name="brand"
            defaultValue={params.get("brand") || ""}
          >
            <option value="">Mọi thương hiệu</option>
            {brands.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            name="minPrice"
            aria-label="Giá từ"
            type="number"
            min="0"
            max="100000000"
            placeholder="Giá từ"
            defaultValue={params.get("minPrice") || ""}
          />
          <input
            name="maxPrice"
            aria-label="Giá đến"
            type="number"
            min="0"
            max="100000000"
            placeholder="Giá đến"
            defaultValue={params.get("maxPrice") || ""}
          />
          <select
            aria-label="Sắp xếp"
            name="sort"
            defaultValue={params.get("sort") || "newest"}
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
          </select>
          <button>Tìm</button>
        </form>
        {error ? (
          <p className="notice error" role="alert">
            {error}
          </p>
        ) : !result ? (
          <p>Đang tải sản phẩm…</p>
        ) : result.data.length === 0 ? (
          <p className="notice">Chưa có sản phẩm phù hợp.</p>
        ) : (
          <div className="grid">
            {result.data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
        {result && result.meta.totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: result.meta.totalPages }, (_, i) => (
              <button
                key={i}
                className={
                  Number(params.get("page") || 1) === i + 1 ? "" : "secondary"
                }
                onClick={() => {
                  const p = new URLSearchParams(params);
                  p.set("page", i + 1);
                  setParams(p);
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
export function Detail({ commerce = false }) {
  const { id } = useParams(),
    [p, setP] = useState(null),
    [error, setError] = useState(""),
    [qty, setQty] = useState(1),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    setP(null);
    setError("");
    api("/products/" + id)
      .then((r) => {
        if (live) setP(r.data);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [id]);
  async function add() {
    setNotice("");
    setBusy(true);
    try {
      await api("/cart/items", {
        method: "POST",
        body: { product_id: p.id, quantity: Number(qty) },
      });
      setNotice("Đã thêm vào giỏ hàng.");
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (error) return <p className="notice error">{error}</p>;
  if (!p) return <p>Đang tải…</p>;
  let specs = p.specs_json;
  try {
    if (typeof specs === "string") specs = JSON.parse(specs);
  } catch {
    specs = {};
  }
  return (
    <>
      <Link to="/">← Tiếp tục khám phá</Link>
      <div className="detail panel">
        <div className="detail-image">
          <img src={p.image_path} alt={p.name} />
        </div>
        <div>
          <span className="eyebrow">
            {p.category_name} / {p.sku}
          </span>
          <h1>{p.name}</h1>
          <p className="price">{money(p.price)}</p>
          <p>{p.description}</p>
          <p>Còn {p.stock} sản phẩm</p>
          <dl>
            {Object.entries(specs || {}).map(([k, v]) => (
              <div key={k}>
                <dt>{k.replaceAll("_", " ")}</dt>
                <dd>{String(v)}</dd>
              </div>
            ))}
          </dl>
          {commerce ? (
            <div className="actions">
              <input
                aria-label="Số lượng"
                type="number"
                min="1"
                max={Math.min(p.stock, 99)}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
              <button onClick={add} disabled={busy || p.stock < 1}>
                {busy ? "Đang thêm…" : "Thêm vào giỏ"}
              </button>
              <Link to="/cart">Mở giỏ →</Link>
            </div>
          ) : (
            <p className="notice">
              Khung Người 1 đã sẵn sàng. Thêm module Người 2 để dùng giỏ và đặt
              hàng.
            </p>
          )}
          {notice && (
            <p role="status" className="notice">
              {notice}
            </p>
          )}
        </div>
      </div>
    </>
  );
}