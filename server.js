require("dotenv").config();

const crypto = require("crypto");
const express = require("express");
const cookieParser = require("cookie-parser");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

const adminPassword = process.env.ADMIN_PASSWORD || "change-this-password";
const cookieSecret = process.env.COOKIE_SECRET || "change-this-cookie-secret";
const whatsappNumber = process.env.WHATSAPP_NUMBER || "";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(express.static("public"));

function sign(value) {
  return crypto.createHmac("sha256", cookieSecret).update(value).digest("hex");
}

function makeSessionToken() {
  const payload = `admin:${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

function isValidSessionToken(token) {
  if (!token || !token.includes(".")) return false;

  const lastDot = token.lastIndexOf(".");
  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const expected = sign(payload);

  if (signature.length !== expected.length) return false;

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function requireAdmin(req, res, next) {
  if (!isValidSessionToken(req.cookies.hf_admin)) {
    return res.status(401).json({ ok: false, error: "Admin login required" });
  }

  next();
}

async function initDb() {
  await pool.query(`
    create table if not exists fashion_products (
      id serial primary key,
      title text not null,
      price text,
      category text,
      image_url text,
      video_url text,
      description text,
      is_active boolean not null default true,
      sort_order integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
}

function cleanProductInput(body) {
  return {
    title: String(body.title || "").trim(),
    price: String(body.price || "").trim(),
    category: String(body.category || "").trim(),
    image_url: String(body.image_url || "").trim(),
    video_url: String(body.video_url || "").trim(),
    description: String(body.description || "").trim(),
    is_active: body.is_active !== false,
    sort_order: Number.parseInt(body.sort_order, 10) || 0,
  };
}

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("select 1");
    res.json({ ok: true, service: "hello-fashion-site" });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      `select id, title, price, category, image_url, video_url, description
       from fashion_products
       where is_active = true
       order by sort_order desc, id desc`
    );

    res.json({
      ok: true,
      whatsapp_number: whatsappNumber,
      products: result.rows,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/api/admin/login", (req, res) => {
  if (req.body.password !== adminPassword) {
    return res.status(401).json({ ok: false, error: "Wrong password" });
  }

  res.cookie("hf_admin", makeSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  res.clearCookie("hf_admin");
  res.json({ ok: true });
});

app.get("/api/admin/products", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `select *
       from fashion_products
       order by sort_order desc, id desc`
    );

    res.json({ ok: true, products: result.rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/api/admin/products", requireAdmin, async (req, res) => {
  const product = cleanProductInput(req.body);

  if (!product.title) {
    return res.status(400).json({ ok: false, error: "Product title is required" });
  }

  try {
    const result = await pool.query(
      `insert into fashion_products
       (title, price, category, image_url, video_url, description, is_active, sort_order)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning *`,
      [
        product.title,
        product.price,
        product.category,
        product.image_url,
        product.video_url,
        product.description,
        product.is_active,
        product.sort_order,
      ]
    );

    res.status(201).json({ ok: true, product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.put("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const product = cleanProductInput(req.body);

  if (!product.title) {
    return res.status(400).json({ ok: false, error: "Product title is required" });
  }

  try {
    const result = await pool.query(
      `update fashion_products
       set title = $1,
           price = $2,
           category = $3,
           image_url = $4,
           video_url = $5,
           description = $6,
           is_active = $7,
           sort_order = $8,
           updated_at = now()
       where id = $9
       returning *`,
      [
        product.title,
        product.price,
        product.category,
        product.image_url,
        product.video_url,
        product.description,
        product.is_active,
        product.sort_order,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Product not found" });
    }

    res.json({ ok: true, product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "delete from fashion_products where id = $1 returning id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Product not found" });
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Hello Fashion site running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Database setup failed:", error);
    process.exit(1);
  });
