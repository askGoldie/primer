# Primer Cost Comparison Calculator

Drop in a headcount and the SaaS tool the prospect currently pays for. The tables below spit out 3-year and 5-year savings against Primer's one-time $5,000 license.

---

## The formula (copy this into a spreadsheet cell)

```
Primer total cost (any horizon)   = 5000
SaaS total cost (N years)         = headcount * monthly_per_seat * 12 * N
Savings (N years)                 = SaaS total - 5000
Break-even month                  = 5000 / (headcount * monthly_per_seat)
```

That's it. No implementation fees, no renewal uplift, no per-admin add-ons. Primer is a one-time $5,000 for the source code.

---

## Per-seat prices we use as the benchmark

Public list prices, mid-2025. If your prospect has a custom deal, plug in their number instead.

| Tool                       | Typical per-user per month | Annual minimum | Notes                                                 |
| -------------------------- | -------------------------- | -------------- | ----------------------------------------------------- |
| Lattice (Performance core) | $11                        | Often $4K      | Add-ons for OKRs, engagement, and comp push to $20+   |
| 15Five (Perform tier)      | $10                        | None published | Focus Pro bundle reaches $16                          |
| Culture Amp (Perform)      | $9-$12                     | Custom quoted  | Typically sold bundled with Engage; effective $18-$24 |
| BambooHR + Performance     | $6 HR base + $5 perf       | Yes            | Performance is an add-on; HR base required            |
| Workday HCM (Perf module)  | $100+/mo all-in            | Six figures    | Not comparable at SMB; used for large-org framing     |

For the rest of this document I use **$15/user/month** as a blended "real-world" average, because prospects almost always buy an add-on or two and the effective rate lands there. Swap in the actual number when you know it.

---

## Savings tables at $15/user/month

### 50 employees

| Horizon | SaaS cost | Primer cost | Savings    |
| ------- | --------- | ----------- | ---------- |
| 1 year  | $9,000    | $5,000      | **$4,000** |
| 3 years | $27,000   | $5,000      | $22,000    |
| 5 years | $45,000   | $5,000      | $40,000    |

Break-even: **month 7**.

### 100 employees

| Horizon | SaaS cost | Primer cost | Savings |
| ------- | --------- | ----------- | ------- |
| 1 year  | $18,000   | $5,000      | $13,000 |
| 3 years | $54,000   | $5,000      | $49,000 |
| 5 years | $90,000   | $5,000      | $85,000 |

Break-even: **month 4**.

### 250 employees

| Horizon | SaaS cost | Primer cost | Savings  |
| ------- | --------- | ----------- | -------- |
| 1 year  | $45,000   | $5,000      | $40,000  |
| 3 years | $135,000  | $5,000      | $130,000 |
| 5 years | $225,000  | $5,000      | $220,000 |

Break-even: **week 8**.

### 500 employees

| Horizon | SaaS cost | Primer cost | Savings  |
| ------- | --------- | ----------- | -------- |
| 1 year  | $90,000   | $5,000      | $85,000  |
| 3 years | $270,000  | $5,000      | $265,000 |
| 5 years | $450,000  | $5,000      | $445,000 |

Break-even: **week 4**.

### 1,000 employees

| Horizon | SaaS cost | Primer cost | Savings  |
| ------- | --------- | ----------- | -------- |
| 1 year  | $180,000  | $5,000      | $175,000 |
| 3 years | $540,000  | $5,000      | $535,000 |
| 5 years | $900,000  | $5,000      | $895,000 |

Break-even: **week 2**.

---

## What the spreadsheet version should look like

Make a tab with these columns so affiliates can rebrand and share it:

```
A: Headcount
B: Current tool (dropdown: Lattice, 15Five, Culture Amp, BambooHR, Workday, Other)
C: Per-user per month rate (auto-fills from B, editable)
D: Year 1 SaaS cost        =A*C*12
E: Year 3 SaaS cost        =A*C*36
F: Year 5 SaaS cost        =A*C*60
G: Primer cost (fixed)     =5000
H: 3-year savings          =E-G
I: 5-year savings          =F-G
J: Break-even (months)     =G/(A*C)
```

Put a big cell at the top in 36pt type: `=TEXT(I2,"$#,##0")` so the five-year savings hits the prospect in the face when they open the file.

---

## Things to include in the second tab (optional, but it sells)

1. **Implementation cost line.** Lattice and Culture Amp typically bill $3K-$8K for onboarding. Primer ships as a zip and a Docker command. Add that delta to the year-1 column.
2. **Renewal uplift.** SaaS contracts commonly renew at 7-10% annual uplift. A five-year cell at 8% compounding is brutal.
3. **Headcount growth.** Many prospects will double in three years. Primer's price does not move; the SaaS line does. Model a growth slider at 0%, 15%, 30% CAGR.
4. **Seat-waste factor.** Industry benchmark: 20-30% of paid performance-tool seats log in less than once a quarter. Show the "cost per active user" comparison.

---

## Sales note

The calculator closes deals the moment a buyer sees the five-year number. Lead with the five-year column, not the year-one. Year one shows a win. Year five shows an obvious error in judgment if they keep paying the SaaS bill.
