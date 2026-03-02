# ZeroBank

<img width="1024" height="1536" alt="image" src="https://github.com/user-attachments/assets/5eca5ed6-d389-4036-ab0c-7d392ba6424c" />

> A crypto-native shorting infrastructure for meme markets.
>
> x:https://x.com/ZeroBankDapp

## Why ZeroBank

Meme is attention economy.

As long-time meme players, we all know the inevitable outcome of every meme:

> **When attention disappears, the price goes to zero.**

However, the current meme ecosystem only supports:

- Launch
- Pump
- Exit via liquidity drain

What’s missing is a **native way to short memes**, especially **from day one**.

**ZeroBank exists to solve this problem.**

---

## What Is ZeroBank

**ZeroBank** is a meme-focused shorting launchpad and liquidity protocol that enables:

- Immediate short liquidity at token launch
- Permissionless meme shorting
- On-chain risk management
- Crypto-native vault-based design

ZeroBank treats _going to zero_ not as a failure, but as a **tradable market outcome**.

---

## Core Design Principles

- Crypto-native, not exchange-dependent
- Permissionless and composable
- Built for extreme volatility
- Designed around meme lifecycle decay

---

## System Architecture

### 1. Liquidity Vault (ERC-4626)

To enable shorting immediately after launch, ZeroBank pre-allocates part of the meme token supply into a vault.

The vault:

- Holds meme tokens (for borrowing)
- Accepts BNB as collateral
- Issues vault shares following ERC-4626

We adopt **ERC-4626** for standardization, security, and composability.

Reference:
https://docs.openzeppelin.com/contracts/4.x/erc4626

---

### 2. Shorting Mechanism

Shorting flow:

1. User deposits **BNB** as collateral into ZeroBank
2. User borrows **meme tokens** from the vault
3. Borrowed meme tokens are sold on the open market
4. A meme-denominated debt position is created

Position exposure:

- Short meme
- Long BNB

---

### 3. Closing a Short Position

To close a position:

1. User buys meme tokens from the market
2. Repays the borrowed meme tokens
3. Withdraws remaining BNB collateral

#### PnL Logic

- Meme price ↓ → Profit
- Meme price ↑ → Loss

This mirrors traditional short selling but is fully on-chain and permissionless.

---

### 4. Health Factor & Liquidation

ZeroBank uses a **Health Factor** model to manage risk.

#### Health Factor Formula

- When `Health Factor >= 0.9`
  - Position becomes liquidatable
  - Liquidators can repay debt and receive collateral at a discount

This ensures system solvency during high volatility.

---

### 5. Circuit Breaker & Bad Debt Prevention

**Objective:** Prevent undercollateralized positions (`Health Factor > 1`).

#### Circuit Breaker Rules

- Monitor price changes per minute
- If price movement exceeds **10% within 1 minute**:
  - Pause same-direction trading
  - Resume after **10 seconds**

This mechanism:

- Gives liquidators time to act
- Reduces oracle manipulation risk
- Limits cascading liquidations

---

## Why ZeroBank Matters

- Meme markets are asymmetric by nature
- Attention decay is predictable but untradable today
- ZeroBank enables:
  - Two-sided markets
  - Better price discovery
  - Sustainable meme ecosystems

**Not every meme deserves to pump forever.  
But every meme deserves a short.**

---

## Summary

- Meme shorting infrastructure
- ERC-4626 vault architecture
- Native liquidation engine
- Volatility-aware circuit breaker
- Built for the reality of meme markets

> Every meme ends at zero.  
> ZeroBank lets you trade it.

---

## Disclaimer

ZeroBank is experimental software.  
Meme markets are highly volatile and risky.  
Use at your own risk.
