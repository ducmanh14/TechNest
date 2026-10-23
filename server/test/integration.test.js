const { test } = require("node:test"),
  assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs"),
  path = require("node:path");
if (process.env.TECHNEST_TEST !== "1")
  throw new Error("Chạy bằng npm run test:integration để bảo vệ DB.");
const config = require("../src/config");
if (!config.db.database.endsWith("_test"))
  throw new Error("Chỉ dùng database test.");
const { pool } = require("../src/db");
const { createApp } = require("../src/app");
const jwt = require("jsonwebtoken");
test("TechNest HTTP + MySQL integration", { timeout: 120000 }, async (t) => {
  const app = createApp(),
    server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = "http://127.0.0.1:" + server.address().port;
  let admin = "",
    customer = "",
    other = "",
    product;
  const suffix = Date.now().toString(36);
  const owner = "qa_" + suffix,
    outsider = "qb_" + suffix;
  async function call(url, method = "GET", body, cookie = "", headers = {}) {
    const r = await fetch(base + "/api" + url, {
      method,
      headers: {
        Origin: config.origin,
        "X-TechNest-Client": "web",
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await r.json();
    return {
      status: r.status,
      data,
      cookie: r.headers.get("set-cookie")?.split(";")[0],
    };
  }
  const authBody = (name) => ({
    username: name,
    password: "TechNest@123",
    fullname: "QA student",
  });
  try {
    await t.test("new database has products; prices are strings", async () => {
      const r = await call("/products");
      assert.equal(r.status, 200);
      assert.ok(r.data.meta.total >= 24);
      assert.equal(typeof r.data.data[0].price, "string");
      product = r.data.data.find(
        (p) => p.stock >= 2 && p.sku.startsWith("TN-"),
      );
      assert.ok(product);
    });
    await t.test("register never grants admin role", async () => {
      assert.equal(
        (
          await call("/auth/register", "POST", {
            ...authBody(owner),
            role: "admin",
          })
        ).status,
        201,
      );
      assert.equal(
        (await call("/auth/register", "POST", authBody(outsider))).status,
        201,
      );
      const r = await call("/auth/login", "POST", authBody(owner));
      customer = r.cookie;
      assert.equal(r.data.data.role, "customer");
      other = (await call("/auth/login", "POST", authBody(outsider))).cookie;
      admin = (await call("/auth/login", "POST", authBody("admin"))).cookie;
    });
    await t.test("register duplicate and wrong password fail", async () => {
      assert.equal(
        (await call("/auth/register", "POST", authBody(owner))).status,
        409,
      );
      assert.equal(
        (
          await call("/auth/login", "POST", {
            username: owner,
            password: "wrongpass",
          })
        ).status,
        401,
      );
    });
    await t.test(
      "JWT cookie is HttpOnly, not returned as access token",
      async () => {
        const r = await fetch(base + "/api/auth/login", {
          method: "POST",
          headers: {
            Origin: config.origin,
            "X-TechNest-Client": "web",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(authBody(owner)),
        });
        assert.match(r.headers.get("set-cookie"), /HttpOnly/i);
        assert.equal((await r.json()).data.accessToken, undefined);
      },
    );
    await t.test(
      "CSRF rejects wrong origin, absent header and simple content type",
      async () => {
        assert.equal(
          (
            await call("/auth/login", "POST", authBody(owner), "", {
              Origin: "https://evil.invalid",
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await call("/auth/login", "POST", authBody(owner), "", {
              "X-TechNest-Client": "",
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await call("/auth/login", "POST", authBody(owner), "", {
              "Content-Type": "text/plain",
            })
          ).status,
          415,
        );
      },
    );
    await t.test("anonymous/customer cannot administer", async () => {
      assert.equal((await call("/admin/products")).status, 401);
      assert.equal(
        (await call("/admin/products", "GET", undefined, customer)).status,
        403,
      );
    });
    await t.test(
      "tampered, expired, wrong algorithm/issuer/audience and missing claim fail",
      async () => {
        const claims = jwt.decode(decodeURIComponent(customer.split("=")[1]));
        for (const token of [
          customer.slice(0, -1) + (customer.endsWith("a") ? "b" : "a"),
          "tn_access=" +
          jwt.sign(
            { ...claims, exp: Math.floor(Date.now() / 1000) - 1 },
            config.jwtSecret,
          ),
          "tn_access=" + jwt.sign({ ...claims, iss: "evil" }, config.jwtSecret),
          "tn_access=" + jwt.sign({ ...claims, aud: "evil" }, config.jwtSecret),
          "tn_access=" +
          jwt.sign({ ...claims, ver: undefined }, config.jwtSecret),
          "tn_access=" +
          jwt.sign(claims, config.jwtSecret, { algorithm: "HS384" }),
        ])
          assert.equal(
            (await call("/auth/me", "GET", undefined, token)).status,
            401,
          );
      },
    );
    await t.test(
      "search parameters and SQL text are treated as data",
      async () => {
        assert.equal(
          (await call("/products?q=" + encodeURIComponent("' OR 1=1 --"))).data
            .data.length,
          0,
        );
        assert.equal(
          (
            await call(
              "/products?sort=" + encodeURIComponent("price;DROP TABLE users"),
            )
          ).status,
          400,
        );
      },
    );
    await t.test("admin creates, edits and hides a product", async () => {
      const body = {
        category_id: product.category_id,
        brand_id: product.brand_id,
        sku: "QA-" + suffix,
        name: "QA product",
        description: "Test product",
        price: 120000,
        stock: 2,
        is_active: 1,
      };
      const r = await call("/admin/products", "POST", body, admin);
      assert.equal(r.status, 201);
      const id = r.data.data.id;
      assert.equal(
        (
          await call(
            "/admin/products/" + id,
            "PUT",
            { ...body, name: "QA edited", expected_stock: 2 },
            admin,
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await call(
            "/admin/products/" + id,
            "PUT",
            { ...body, expected_stock: 99 },
            admin,
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await call(
            "/admin/products/" + id + "/status",
            "PATCH",
            { is_active: 0 },
            admin,
          )
        ).status,
        200,
      );
      assert.equal((await call("/products/" + id)).status, 404);
    });
    if (
      fs.existsSync(
        path.resolve(__dirname, "../src/features/commerce/index.js"),
      )
    ) {
      await require("./commerce-cases")({
        t,
        call,
        admin,
        customer,
        other,
        product,
        pool,
        owner,
        suffix,
      });
    } else
      await t.test("foundation reports commerce not installed", async () =>
        assert.equal((await call("/health")).data.data.commerce, false),
      );
    await t.test(
      "logout invalidates all copied JWTs of same user",
      async () => {
        assert.equal(
          (await call("/auth/logout", "POST", {}, customer)).status,
          200,
        );
        assert.equal(
          (await call("/auth/me", "GET", undefined, customer)).status,
          401,
        );
      },
    );
  } finally {
    await new Promise((r) => server.close(r));
    await pool.end();
  }
});