# Persona: Individual Contributor

## Derek Solís

**Title:** Senior Software Engineer  
**Company tenure:** 3 years  
**Direct reports:** None  
**System role:** `participant`  
**Node type:** `individual`  
**Reports to:** Engineering Manager (Priya)

---

## Who He Is

Derek is a senior engineer on Priya's platform team. He has been at the company long enough to have context but not so long that he has stopped noticing the friction. He cares about doing good work. He is skeptical of performance management processes because in his experience they produce paperwork, not clarity.

His first reaction to Primer was typical: another system he'll have to update for someone else's benefit. That perception changed when he went through the threshold calibration for his own metrics. The act of writing down what "optimized" looked like for his two primary metrics — and having Priya push back on his description of "content" — produced more clarity about his own job than anything had in three years.

He is a contributor in the framework, not a manager of it. He owns his own node, creates his own goals, records his own performance data, and can file inquiries when he has a stake.

---

## What He Does in Primer

- Proposes or co-authors 2–4 metrics for his individual node (code quality indicators, on-call response, documentation ownership, contribution to platform reliability)
- Writes threshold descriptions for each tier with Priya's input
- Assigns weights and submits to Priya for review and approval
- Records performance data on his metrics according to their configured cadences (some weekly, some monthly)
- Creates self-directed goals — developmental goals (learning Rust for a platform migration), operational goals (reduce P2 incident contribution by 30%), compliance goals (complete security certification)
- Tracks goal progress and updates status as work advances
- Files a peer inquiry if a peer engineer's work pattern is directly and measurably affecting one of his metrics (rare, but structurally available)
- Submits his metrics for Priya's review at cycle end

---

## What He Cares About

- **Clarity about what is expected.** Derek's central professional frustration is ambiguity about what "doing well" means. The threshold calibration forces Priya to say explicitly what each level looks like. For the first time, Derek has a written description of what "optimized" means for his function — and it was co-authored, not handed down.
- **Autonomy over his own goals.** He can create self-directed developmental goals that are not assigned from above. His goal to learn Rust is his goal — origin = `self_created`. It may relate to a platform migration goal cascaded from James, in which case `goal_dependency_type` = `supports` and the chain is visible.
- **His data being his data.** Performance logs are immutable records of actual measurements. They are not narratives constructed at review time. Derek trusts that the data reflects what actually happened.
- **Not being evaluated against someone else's framework.** The weighting system means Derek had input on which of his metrics matter most right now. He weighted code quality highest because the team is in a refactoring phase. Priya approved that. It is a documented, shared statement.

---

## Pain Without the System

- His performance review happens once a year and is largely based on his manager's memory of the last few months. The recency bias is severe.
- He has no visibility into how his performance reads from above. He does not know if his manager's assessment matches the VP's impression of his team.
- His goals live in Jira, in a personal Notion doc, and in a conversation he had with Priya six months ago. None of them are connected to the company's strategic direction.
- He has never been asked what "good" looks like for his role. He has been told what the metrics are.

---

## What Primer Resolves for Him

The threshold calibration gives Derek a documented, co-authored definition of his operational states. He stops trying to guess what "good" means in this quarter's context and starts working against a shared definition.

The performance log gives him an honest record. When his cycle-end review happens, the data is there — not reconstructed from memory, not filtered through a narrative. The trend is visible.

The goals system gives him a place to document his own developmental direction alongside the cascaded operational goals. Everything is in one place and connected.

---

## Edge Cases

- Derek's `participant` role means he can submit metrics for Priya's review but cannot approve anyone else's metrics. He cannot capture snapshots. He cannot manage visibility.
- He can file a peer inquiry against another individual in the same team (same parent node), but the inquiry must cite his affected metric. He cannot file frivolously — the affected metric requirement means he must show a stake.
- He cannot edit a performance log entry after it is submitted. Errors are flagged to Priya.
- Until he is placed in the hierarchy (a node created for him, `user_id` set to his ID), he cannot operate in the framework. His initial state after joining may be a pending `placement_request`.
