# Hello Fashion Website

This is a small Railway-ready website for `hellofashion.co.in`.

## What It Includes

- Customer website at `/`
- Admin panel at `/admin.html`
- Product add/edit/delete
- Image URL and video URL support
- WhatsApp order button
- PostgreSQL storage through Railway `DATABASE_URL`

## Required Railway Variables

Set these in Railway project variables:

```text
DATABASE_URL=your Railway PostgreSQL URL
ADMIN_PASSWORD=choose-a-strong-password
COOKIE_SECRET=choose-a-long-random-secret
WHATSAPP_NUMBER=91XXXXXXXXXX
NODE_ENV=production
```

`WHATSAPP_NUMBER` should include country code and no plus sign.

## Deploy Steps

1. Push this folder to GitHub.
2. Create a Railway project from the GitHub repo.
3. Add Railway PostgreSQL.
4. Set the variables above.
5. Deploy.
6. Open Railway's generated URL and test `/admin.html`.
7. Add your custom domain `hellofashion.co.in` in Railway.
8. Copy the DNS record Railway gives you into GoDaddy DNS.

## Admin Use

Open:

```text
https://hellofashion.co.in/admin.html
```

Login with `ADMIN_PASSWORD`, then add products using image/video URLs.
