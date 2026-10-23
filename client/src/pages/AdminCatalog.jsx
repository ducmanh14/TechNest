import { useEffect, useState } from "react";
import { api, money } from "../services/api";
const blank = {
  category_id: "",
  brand_id: "",
  sku: "",
  name: "",
  description: "",
  specs_json: "{}",
  price: 0,
  stock: 0,
  is_active: 1,
  image_path: "/images/laptop.svg",
};
export default function AdminCatalog() {
  const [products, setProducts] = useState([]),
    [cats, setCats] = useState([]),
    [brands, setBrands] = useState([]),
    [form, setForm] = useState({ ...blank }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [tab, setTab] = useState("products"),
    [lookup, setLookup] = useState({ name: "", id: null, is_active: 1 }),
    [notice, setNotice] = useState("");
  async function load(page = meta.page) {
    const [ps, cs, bs] = await Promise.all([
      api("/admin/products?limit=20&page=" + page),
      api("/admin/categories"),
      api("/admin/brands"),
    ]);
    setProducts(ps.data);
    setMeta(ps.meta);
    setCats(cs.data);
    setBrands(bs.data);
  }
  useEffect(() => {
    load(1).catch((e) => setError(e.message));
  }, []);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (tab === "products") {
        await api("/admin/products" + (form.id ? "/" + form.id : ""), {
          method: form.id ? "PUT" : "POST",
          body: form,
        });
        setForm({ ...blank });
      } else {
        await api("/admin/" + tab + (lookup.id ? "/" + lookup.id : ""), {
          method: lookup.id ? "PUT" : "POST",
          body: lookup,
        });
        setLookup({ name: "", id: null, is_active: 1 });
      }
      await load();
      setNotice("Đã lưu dữ liệu.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function edit(p) {
    setForm({
      ...p,
      specs_json:
        typeof p.specs_json === "string"
          ? p.specs_json
          : JSON.stringify(p.specs_json || {}, null, 2),
      expected_stock: p.stock,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const input = (key, label, type = "text") => (
    <label>
      {label}
      <input
        required
        type={type}
        value={form[key]}
        min={type === "number" ? 0 : undefined}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </label>
  );
  const items = tab === "categories" ? cats : brands;
  return (
    <>
      <span className="eyebrow">QUẢN TRỊ TECHNEST</span>
      <h1>Quản lý catalog</h1>
      <div className="actions">
        {[
          ["products", "Sản phẩm"],
          ["categories", "Danh mục"],
          ["brands", "Thương hiệu"],
        ].map(([v, l]) => (
          <button
            key={v}
            className={tab === v ? "" : "secondary"}
            onClick={() => {
              setTab(v);
              setError("");
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <form className="panel admin-form" onSubmit={save}>
        {tab === "products" ? (
          <>
            <h2>{form.id ? "Sửa sản phẩm #" + form.id : "Thêm sản phẩm"}</h2>
            <div className="form-grid">
              {input("name", "Tên sản phẩm")}
              {input("sku", "SKU")}
              <label>
                Danh mục
                <select
                  required
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                >
                  <option value="">Chọn danh mục</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {!c.is_active ? " (ẩn)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Thương hiệu
                <select
                  required
                  value={form.brand_id}
                  onChange={(e) =>
                    setForm({ ...form, brand_id: e.target.value })
                  }
                >
                  <option value="">Chọn thương hiệu</option>
                  {brands.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              {input("price", "Giá VND", "number")}
              {input("stock", "Tồn kho", "number")}
              <label>
                Ảnh
                <select
                  value={form.image_path}
                  onChange={(e) =>
                    setForm({ ...form, image_path: e.target.value })
                  }
                >
                  {["laptop", "phone", "headphones"].map((x) => (
                    <option key={x} value={"/images/" + x + ".svg"}>
                      {x}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Trạng thái
                <select
                  value={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: Number(e.target.value) })
                  }
                >
                  <option value="1">Đang bán</option>
                  <option value="0">Ẩn</option>
                </select>
              </label>
            </div>
            <label>
              Mô tả
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>
            <label>
              Thông số dạng JSON
              <textarea
                value={form.specs_json}
                onChange={(e) =>
                  setForm({ ...form, specs_json: e.target.value })
                }
              />
            </label>
          </>
        ) : (
          <>
            <h2>
              {lookup.id ? "Sửa" : "Thêm"}{" "}
              {tab === "categories" ? "danh mục" : "thương hiệu"}
            </h2>
            <label>
              Tên
              <input
                required
                minLength={2}
                value={lookup.name}
                onChange={(e) => setLookup({ ...lookup, name: e.target.value })}
              />
            </label>
            <label>
              Trạng thái
              <select
                value={lookup.is_active}
                onChange={(e) =>
                  setLookup({ ...lookup, is_active: Number(e.target.value) })
                }
              >
                <option value="1">Hiển thị</option>
                <option value="0">Ẩn</option>
              </select>
            </label>
          </>
        )}
        <div className="actions">
          <button disabled={busy}>{busy ? "Đang lưu…" : "Lưu"}</button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setForm({ ...blank });
              setLookup({ name: "", id: null, is_active: 1 });
            }}
          >
            Tạo mới
          </button>
        </div>
      </form>
      <div className="table-wrap panel">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              {tab === "products" && (
                <>
                  <th>Giá</th>
                  <th>Tồn</th>
                </>
              )}
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {(tab === "products" ? products : items).map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                {tab === "products" && (
                  <>
                    <td>{money(p.price)}</td>
                    <td>{p.stock}</td>
                  </>
                )}
                <td>{p.is_active ? "Hiển thị" : "Ẩn"}</td>
                <td>
                  <button
                    className="secondary"
                    onClick={() =>
                      tab === "products" ? edit(p) : setLookup({ ...p })
                    }
                  >
                    Sửa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tab === "products" && (
        <div className="actions">
          <button
            disabled={meta.page <= 1}
            onClick={() =>
              load(meta.page - 1).catch((e) => setError(e.message))
            }
          >
            Trang trước
          </button>
          <span>
            {meta.page}/{Math.max(meta.totalPages, 1)}
          </span>
          <button
            disabled={meta.page >= meta.totalPages}
            onClick={() =>
              load(meta.page + 1).catch((e) => setError(e.message))
            }
          >
            Trang sau
          </button>
        </div>
      )}
    </>
  );
}