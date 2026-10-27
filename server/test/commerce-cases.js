const assert = require("node:assert/strict"),
  crypto = require("node:crypto");
module.exports = async ({
  t,
  call,
  admin,
  customer,
  other,
  product,
  pool,
  owner,
  suffix,
}) => {
  let cart, order, request;
  const [[buyer]] = await pool.execute(
    "SELECT id FROM users WHERE username=?",
    [owner],
  );
  const [[before]] = await pool.execute(
    "SELECT stock FROM products WHERE id=?",
    [product.id],
  );
  await t.test(
    "cart rejects invalid quantity and prevents another user editing it",
    async () => {
      for (const quantity of [0, -1, 1.5, 100])
        assert.equal(
          (
            await call(
              "/cart/items",
              "POST",
              { product_id: product.id, quantity },
              customer,
            )
          ).status,
          400,
        );
      const r = await call(
        "/cart/items",
        "POST",
        { product_id: product.id, quantity: 1 },
        customer,
      );
      assert.equal(r.status, 201);
      cart = r.data.data;
      assert.equal(
        (
          await call(
            "/cart/items/" + cart.items[0].id,
            "PUT",
             { quantity: 1 },
            other,
          )
        ).status,
        404,
      );
    },
  );
  await t.test("checkout uses database price and exact snapshots", async () => {
    request = {
      recipient_name: "QA customer",
      phone: "0901234567",
      shipping_address: "123 Test street, Ho Chi Minh City",
      payment_method: "COD",
      checkout_key: crypto.randomUUID(),
      cart_signature: cart.cart_signature,
      total_amount: "1",
    };
    const r = await call("/orders", "POST", request, customer);
    assert.equal(r.status, 201);
    order = r.data.data;
    assert.equal(Number(order.total_amount), Number(product.price) + 30000);
    assert.equal(order.items[0].product_name, product.name);
    assert.equal(
      (await call("/cart", "GET", undefined, customer)).data.data.items.length,
      0,
    );
    const [[p]] = await pool.execute("SELECT stock FROM products WHERE id=?", [
      product.id,
    ]);
    assert.equal(p.stock, before.stock - 1);
  });
  await t.test(
    "checkout retry with empty cart returns same order; changed body conflicts",
    async () => {
      const r = await call("/orders", "POST", request, customer);
      assert.equal(r.status, 200);
      assert.equal(r.data.data.id, order.id);
      assert.equal(
        (
          await call(
            "/orders",
            "POST",
            { ...request, phone: "0909876543" },
            customer,
          )
        ).status,
        409,
      );
    },
     );
  await t.test("order ownership is enforced", async () => {
    assert.equal(
      (await call("/orders/" + order.id, "GET", undefined, other)).status,
      404,
    );
    assert.equal(
      (await call("/orders/" + order.id + "/cancel", "POST", {}, other)).status,
      404,
    );
  });
  await t.test("cancel twice restores stock exactly once", async () => {
    assert.equal(
      (await call("/orders/" + order.id + "/cancel", "POST", {}, customer))
        .status,
      200,
    );
    assert.equal(
      (await call("/orders/" + order.id + "/cancel", "POST", {}, customer))
        .status,
      200,
    );
    const [[p]] = await pool.execute("SELECT stock FROM products WHERE id=?", [
      product.id,
    ]);
    assert.equal(p.stock, before.stock);
  });
  await t.test(
    "price change invalidates old cart quote without creating an order",
    async () => {
      cart = (
        await call(
          "/cart/items",
          "POST",
          { product_id: product.id, quantity: 1 },
          customer,
        )
      ).data.data;
      await pool.execute("UPDATE products SET price=price+1000 WHERE id=?", [
        product.id,
      ]);
      assert.equal(
        (
          await call(
            "/orders",
            "POST",
            {
              ...request,
              checkout_key: crypto.randomUUID(),
              cart_signature: cart.cart_signature,
               },
            customer,
          )
        ).status,
        409,
      );
      await pool.execute("UPDATE products SET price=? WHERE id=?", [
        product.price,
        product.id,
      ]);
    },
  );
  await t.test(
    "failure after stock update rolls back order, items, stock and cart",
    async () => {
      const { checkout } = require("../src/features/commerce/service");
      cart = (await call("/cart", "GET", undefined, customer)).data.data;
      const key = crypto.randomUUID(),
        conn = await pool.getConnection();
      await conn.query(
        `CREATE TRIGGER qa_force_insert_failure BEFORE INSERT ON order_items
         FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='QA injected failure'`,
      );
      conn.release();
      try {
        await assert.rejects(
          checkout(buyer.id, {
            ...request,
            checkout_key: key,
            cart_signature: cart.cart_signature,
          }),
        );
      } finally {
        await pool.query("DROP TRIGGER qa_force_insert_failure");
      }
      const [[n]] = await pool.execute(
        "SELECT COUNT(*) n FROM orders WHERE checkout_key=?",
        [key],
      );
      assert.equal(Number(n.n), 0);
      const [[p]] = await pool.execute(
        "SELECT stock FROM products WHERE id=?",
        [product.id],
      );
      assert.equal(p.stock, before.stock);
      assert.equal(
        (await call("/cart", "GET", undefined, customer)).data.data.items
          .length,
        1,
      );
        },
  );
  let lastId;
  await t.test(
    "two customers compete for last unit; only one order succeeds",
    async () => {
      const body = {
        category_id: product.category_id,
        brand_id: product.brand_id,
        sku: "LAST-" + suffix,
        name: "Last unit",
        description: "QA last item",
        price: 1000,
        stock: 1,
        is_active: 1,
      };
      lastId = (await call("/admin/products", "POST", body, admin)).data.data
        .id;
      for (const cookie of [customer, other]) {
        const c = (await call("/cart", "GET", undefined, cookie)).data.data;
        for (const i of c.items)
          await call("/cart/items/" + i.id, "DELETE", {}, cookie);
        await call(
          "/cart/items",
          "POST",
          { product_id: lastId, quantity: 1 },
          cookie,
        );
      }
      const quotes = await Promise.all(
        [customer, other].map((cookie) =>
          call("/cart", "GET", undefined, cookie),
        ),
      );
      const results = await Promise.all(
        [customer, other].map((cookie, i) =>
          call(
            "/orders",
            "POST",
            {
              ...request,
              checkout_key: crypto.randomUUID(),
              cart_signature: quotes[i].data.data.cart_signature,
            },
            cookie,
          ),
        ),
      );
      assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
      order = results.find((r) => r.status === 201).data.data;
       const [[p]] = await pool.execute(
        "SELECT stock FROM products WHERE id=?",
        [lastId],
      );
      assert.equal(p.stock, 0);
    },
  );
  await t.test(
    "admin transitions are ordered and delivered records COD as paid",
    async () => {
      assert.equal(
        (
          await call(
            "/admin/orders/" + order.id + "/status",
            "PATCH",
            { status: "delivered" },
            admin,
          )
        ).status,
        409,
      );
      for (const status of ["confirmed", "shipping", "delivered"]) {
        const r = await call(
          "/admin/orders/" + order.id + "/status",
          "PATCH",
          { status },
          admin,
        );
        assert.equal(r.status, 200);
        if (status === "delivered") {
          assert.equal(r.data.data.payment_status, "paid");
          assert.ok(r.data.data.delivered_at);
        }
      }
      assert.equal(
        (
          await call(
            "/admin/orders/" + order.id + "/status",
            "PATCH",
            { status: "cancelled" },
            admin,
          )
        ).status,
        409,
      );
    },
  );
};