# Product

## Register

product

## Users

Two distinct surfaces, one system:

**Admin Gapensi (panitia bimtek).** Staff of the local Gapensi chapter running construction-training events (Bimtek) for BUJK members. Works from a laptop during office hours. Jobs: build reusable question modules once, spin up an activity per event, control its phase (pretest open, posttest open, closed), distribute join links via WA/email, monitor who passed. Not a developer; needs predictable, forgiving tooling with no data-loss surprises.

**Peserta (BUJK staff).** Registers through a link received from the event organizer, often via WhatsApp. Mixed devices: some on phones, some on office laptops. Jobs per visit are singular and sequential: register, take the timed pretest, study materials, take the posttest until passing. Session identity lives in a cookie tied to a token link; losing the link means losing access, so every state screen must tell them what to do next and where to ask for help.

## Product Purpose

An exam-and-materials platform for Gapensi training events: admin assembles a module (MC questions, materials, timings, passing grades), opens an activity, and participants flow register -> pretest -> materials -> posttest (unlimited retries until pass). Success = participants never confused about where they are in the flow, and admins can run an event without training.

## Brand Personality

Authoritative, architectural, editorial. The composure of a national institution, not the decoration of a marketing site. Indonesian character expressed through restraint (a single red accent), not through red-white clichés. Visual reference: contemporary architecture studios and infrastructure organizations.

## Anti-references

From the project's taste document: SaaS gradient dashboards, glassmorphism, pill buttons, 24-32px rounded cards everywhere, icon-card overload, floating blobs, generic government portals, construction-template stock aesthetics, dashboard-style layouts where composition should lead.

## Design Principles

1. **One screen, one decision.** Every participant screen answers exactly one question: what do I do now? Exam screens show the exam; state screens show status and the next step, nothing else.
2. **Time and answers are sacred.** A timer running is a commitment. Autosave every answer, resume attempts on refresh, never silently start or restart a timed exam. Explicit action before any new attempt.
3. **Status is always legible.** Participants must always know which phase they are in (registered, pretest done, posttest passed) without asking the admin. Admins must see event health at a glance.
4. **Institutional composure over decoration.** Hierarchy, borders, whitespace, and typography do the work. If an element decorates rather than informs, remove it.
5. **Every dead end has an exit.** Invalid link, closed activity, failed attempt, expired session: each screen states what happened and what to do next (contact admin, retry, return to dashboard).

## Accessibility & Inclusion

WCAG 2.1 AA baseline. Contrast at least 4.5:1 for text, large touch targets on mobile (mixed phone/laptop usage), full keyboard operability for exams and forms, visible focus states, reduced-motion support, and exam timers that never rely on color alone.
