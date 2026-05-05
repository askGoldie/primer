# Primer Objection Handling Playbook

Ten objections, tested responses. Each one is short enough to drop into an email as-is. Change the buyer's name and send.

---

### 1. "We're not a dev shop. We can't maintain source code."

You don't have to touch the source code to run Primer. Deployment is one Docker command, and updates are optional. Most customers never open the codebase. They just like that they could if they had to. Owning the code is insurance against a vendor failing, changing hands, or raising prices on renewal. It's not a homework assignment.

---

### 2. "Five thousand dollars feels suspiciously cheap. What's the catch?"

There isn't one. The price reflects a deliberate choice: DavidPM makes money by selling a finished product, not by renting access to it. At $5K per legal entity, the math only works for us if customers rarely need support, which is why the product ships as a working system rather than a platform you have to assemble. If a $30K-a-year SaaS contract looks more credible to your finance team, that's a them problem, not a product problem.

---

### 3. "What happens if DavidPM goes out of business?"

Your Primer deployment keeps running. It has no dependency on our infrastructure, no license checks, no telemetry, no phone-home. You own the source code, the database, and the entire runtime. If we disappeared tonight, the only thing you'd lose is future updates, and you'd still have the code to build them yourself or hire anyone to do it.

---

### 4. "We already pay for Lattice. Why would we switch?"

Don't switch. Run Primer alongside Lattice for one team as a pilot. In 90 days you'll have a direct comparison: one team using a platform they chose together, one team using a platform HR bought for them. The five-year cost difference is between $100K and $400K depending on your headcount. Primer is cheap enough to run the experiment without asking a CFO for permission.

---

### 5. "My security team will never approve a new vendor."

They don't need to. Primer isn't a vendor relationship after the moment of purchase. You receive a zip file, deploy it inside your own environment, and DavidPM has no ongoing access to your systems or your data. There's nothing to approve because there's nothing to monitor. Your security team reviews the deployment the same way they'd review any internal application.

---

### 6. "We need SOC 2 and HIPAA compliance."

Primer runs inside whatever compliance envelope you already have. If your infrastructure is SOC 2 Type II, Primer inherits that posture because it's just another application in your stack. HIPAA is the same: we never see PHI because we never see your data at all, so no Business Associate Agreement is needed. Your compliance scope doesn't grow when you deploy Primer; it stays exactly where it already was.

---

### 7. "What about updates and security patches?"

You pull updates when your team decides to, not when we push them. Every release is published as a diff against the source you already own. Your team reviews it, merges it, and deploys on your schedule. If you never pull another update, the version you have today keeps working indefinitely. Most customers pull updates once or twice a year; some never do.

---

### 8. "How do we migrate our data from [existing tool]?"

Most performance data doesn't migrate, and that's a feature. The reviews and ratings from your old system were built on metrics the team never agreed on, so importing them would carry the same garbage into a new home. Primer's onboarding has leaders propose fresh metrics and managers approve them, which takes about two hours per team. Historical goals and org charts can be imported from a CSV if you want them; most customers skip it and start clean.

---

### 9. "Our HR team already picked a different tool."

That's a good reason to run Primer as a consultant-led or ops-led pilot on one function, separate from the HR rollout. Primer is cheap enough to buy without an HR budget line and different enough from a review tool that it doesn't conflict with one. Once one team has 90 days of data, the conversation with HR stops being "which tool?" and starts being "why is the ops team getting better numbers?"

---

### 10. "I need to think about it."

Of course. One request: open the cost calculator before you decide. Plug in your headcount, keep your current SaaS tool selected, and look at the five-year number. If that number feels acceptable, stay where you are. If it feels like a mistake, the $5K purchase is the answer to the mistake. Either way, the decision gets easier once the number is on the screen.

---

## Use notes

Every response above does three things in order: acknowledge the concern, answer it with a concrete mechanism, reframe the decision. That structure is what makes them land in cold email. Don't rewrite them to sound more "personal"; the brevity is doing the work.
