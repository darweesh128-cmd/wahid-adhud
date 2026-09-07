# Wahid · The Adhud

Wallet-level mutual aid. No account. No KYC. Five USDT on TRC-20.

You may be fine today. Someone else is not.

**Cursor / Cloud Agent:** See [CONTINUITY.md](./CONTINUITY.md) for session resume context (no secrets).

## The example

The House page shows **the total** and **the gifts moving**.

- Center of the graph is the running USDT total this round.
- Each pulse is **5 USDT** leaving an Adhud toward the House.
- Clusters are the countries members can serve from.
- Target: **1,000,000 USDT**. At one million, aid lands with one Adhud.

## Join

1. Open your exchange (Binance, etc.) and choose **Withdraw USDT**.
2. Select network **TRC-20 (Tron)** and send **5 USDT** to the House address below.
3. Enter your payout wallet and the country you can serve from on the site.
4. You are an Adhud. Your desk is your wallet.

**Warning:** wrong network = lost funds. Send exactly **5 USDT** on **TRC-20**.

House TRC-20: `TVmEo3Mn6dJfAWgk8KUF7rEvcdbdegmDER`

## Stack

TanStack Start, React 19, Tailwind v4, Postgres (Neon in production, PGLite in preview).

Auth is off. Identity is the wallet. Rows are unowned.

## Run

```bash
npm install
npm run dev
```

```bash
npm run typecheck
npm run build
```

## License

Source belongs to the House. Use it to strengthen the arm.
