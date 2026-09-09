# Promotion queue — @adudadid

English-first posts for **https://www.adhud.xyz**.

**Live publisher:** `node scripts/x-publish.mjs` (post + reply). Copy-only: `node scripts/promotion-posts.mjs`.

**Rules (CONTINUITY):**
- Account: **@adudadid** only
- Never @Tarkou78 or Outlook-linked accounts
- Voice: mutual solidarity, trust, brotherhood — not fundraising / scam vibes
- Global audience (not Arabic-country lead)
- Do not ask Mohamad for per-post approval once credentials are live

---

## Ready to post (rotate)

### Post A — Hook
```
You may be fine today.
Someone else is not.

Open your account — $1 membership.
Become ʿAḍīd.

Do not join to take.
Join because you are someone's arm.

https://www.adhud.xyz
```

### Post B — One line
```
$1. One username. One desk. Mutual solidarity — not a pitch.

Open account → https://www.adhud.xyz
```

### Post C — Network
```
The map is live: members, countries, the House total.

See who stands as whose arm → https://www.adhud.xyz/network
```

### Post D — Trust
```
No KYC circus. Pick a username. Pay $1. Get your member desk.

Trust first → https://www.adhud.xyz
```

### Post E — Send to three
```
Send this to three people. Do not explain.

The words work alone.

https://www.adhud.xyz
```

---

## Cadence

| Day (UTC) | Post | Command |
|-----------|------|---------|
| Mon | A | `node scripts/x-publish.mjs post --key a` |
| Wed | C | `node scripts/x-publish.mjs post --key c` |
| Fri | E | `node scripts/x-publish.mjs post --key e` |
| Sat | B | `node scripts/x-publish.mjs post --key b` |
| Sun | D | `node scripts/x-publish.mjs post --key d` |

Dry-run (no credentials needed): add `--dry-run`.

---

## Comments / replies

1. `node scripts/x-publish.mjs mentions` — list unreplied mentions (needs API tokens **or** Grok Bot X connector for the read).
2. Draft a short English solidarity reply (no USDT lead, no spam).
3. `node scripts/x-publish.mjs reply --to TWEET_ID --text "..."` 

Do **not** auto-reply a generic CTA to every mention.

---

## After card checkout is live

Add to posts: *"Card / Apple Pay / Google Pay at checkout."*  
Do **not** lead with crypto or USDT in X copy.

---

## Blocked channels

| Channel | Status |
|---------|--------|
| X @adudadid | Publisher reactivated in repo — **live post blocked until X API user tokens + Hotmail unlock** |
| TikTok | TECH_BLOCK |
| Reddit | Account creation in progress |
