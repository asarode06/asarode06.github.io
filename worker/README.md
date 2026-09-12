# Contact form backend

The Trade modal's form posts here. GitHub Pages serves static files and nothing else, so the
form needs an endpoint somewhere off-site; this is a Cloudflare Worker that validates the
submission and relays it into a Discord or Slack channel.

It is deployed **separately** from the site. Pushing to `main` does not touch it, and it only
needs redeploying when `index.js` or `wrangler.toml` changes.

## What it costs

Nothing. Cloudflare's Workers free plan is 100,000 requests a day; a contact form will never
come close. No card is required to sign up.

## Setting it up (once)

1. **Make the webhook.**

   *Discord:* pick the channel the messages should land in → Edit Channel → Integrations →
   Webhooks → New Webhook → Copy Webhook URL.

   *Slack:* api.slack.com/apps → Create New App → From scratch → Incoming Webhooks → toggle on →
   Add New Webhook to Workspace → pick a channel → copy the URL.

   The Worker tells the two apart by the URL, so nothing in the code needs changing either way.

2. **Deploy the Worker.** From this folder:

   ```
   npx wrangler login          # opens the browser once, links your Cloudflare account
   npx wrangler deploy
   ```

   The last line of the output is the Worker's URL, something like
   `https://catan-portfolio-contact.<your-subdomain>.workers.dev`.

3. **Give it the webhook.**

   ```
   npx wrangler secret put WEBHOOK_URL
   ```

   Paste the URL from step 1 when it asks. It is stored encrypted by Cloudflare and is never
   written to this repo.

4. **Point the site at it.** Put the Worker URL from step 2 into `CONTACT_ENDPOINT` in
   `src/data.js`, replacing the `REPLACE_ME` placeholder. Until that is done the Trade modal
   shows a fallback paragraph and the plain contact links instead of the form.

## Checking it works

```
npx wrangler tail
```

streams the live log while you submit the form from the site. A relay failure logs the status
and body Discord or Slack sent back.

To test without deploying, `npx wrangler dev` runs it on `localhost:8787`; point
`CONTACT_ENDPOINT` there temporarily and add that origin to `ALLOWED_ORIGINS`.

## What it rejects

- Anything whose `Origin` is not in `ALLOWED_ORIGINS` (403, before the body is read).
- Bodies over 16KB, or malformed JSON.
- A missing or malformed name, email, or message.
- Bots, two ways: a `website` field that is hidden from people but filled in by form-stuffers,
  and a submission that arrives less than 2.5s after the form was rendered. Both get a normal
  success response and are silently dropped, because a bot that learns which check caught it is
  a bot that gets past that check next time.

Every field is length-capped and stripped of control characters before it reaches the channel,
and Discord mentions are disabled in the payload, so nothing a stranger types can ping anyone.

## If abuse ever becomes real

The traps above stop bulk form-stuffers, not someone deliberately hammering the endpoint by hand.
If that ever happens, the next step is a Cloudflare Rate Limiting rule on the Worker's route
(free tier includes one) or a Turnstile widget on the form. Neither is worth adding pre-emptively.
