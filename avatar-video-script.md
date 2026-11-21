# Meta AI Avatar Video Script — Circuit Breaker Simulator

Saved Nov 21, 2026 from Robert's pasted script. His step: run it in Meta AI
with his photo.

## Production notes (verified against the script, not assumed)

- **Required caption (standing AI-video labeling rule, Nov 11):** the
  permanent bottom caption below is the label. Keep it on screen the whole
  video, exactly as written.
- **Duration check:** the spoken script is **242 words**. At a natural
  150 wpm that runs about **97 seconds**; at a slower 130 wpm about
  **112 seconds**. That is just over the 60–90 second target — trim roughly
  20–40 words, or deliver it briskly, to land inside 90 seconds.
  **A 90-second cut (205 words, ~82s at 150 wpm) is saved below** — the
  full original follows it unchanged.
- **Closing-frame URL is a placeholder:** `github.com/YOURUSERNAME/circuit-breaker-simulator`
  must become `github.com/Rionangelfire/circuit-breaker-simulator` (or the
  final repo name) once the repo exists. Do not record the closing frame
  until the repo is published, or drop the URL line for now.
- **Cutaway shots (3):** CLOSED → OPEN transition; fast-fail reroute to
  Fallback Cache; recovery OPEN → HALF-OPEN → CLOSED.

## Prompt for Meta AI

> Create an avatar video using my uploaded photo.
> The avatar should resemble me but must display a permanent caption at the bottom:
>
> "SIMULATION OF ROBERT BOSTICK - AI GENERATED AVATAR"
>
> Style:
>
> Professional software engineer demonstrating a Circuit Breaker Simulator dashboard.
>
> Duration:
>
> 60-90 seconds.
>
> Background:
>
> Modern cyber operations center with large monitoring screens showing network traffic, code, dashboards, and system status panels.
>
> Speaking directly to camera.

## Avatar Script — 90-second cut (205 words)

Hello, everyone. I'm Robert Bostick. What you're seeing is a simulation I built to demonstrate one of the most important resilience patterns in modern software architecture: the Circuit Breaker Pattern. This simulator is inspired by the Python library pybreaker, and it shows how applications protect themselves when downstream services begin failing. When the primary database is healthy, requests flow normally. But when repeated failures occur, the breaker records them and transitions from CLOSED to OPEN. At that point, requests stop hitting the failing database entirely. Instead, the system returns fallback responses from cache. This is called fast-fail behavior, and it prevents cascading failures across an application stack. After a configurable timeout, the breaker moves into HALF-OPEN, and a single probe request is allowed through. If the database has recovered, the circuit closes and normal operation resumes. If it fails again, the circuit reopens instantly. The simulator also includes real-time packet visualization, execution logs, state transition tracking, Python code mapping, metrics, and a historical timeline. The goal is to make an abstract architecture concept visual, interactive, and easier to understand. Whether you're studying distributed systems, Site Reliability Engineering, or backend development, circuit breakers are essential for building resilient applications. Thank you for checking out the project.

## Avatar Script — full original (242 words)

**Bottom Caption Throughout Entire Video**

```text
SIMULATION OF ROBERT BOSTICK - AI GENERATED AVATAR
```

---

Hello, everyone.

I'm Robert Bostick.

What you're seeing here is a simulation I built to help demonstrate one of the most important resilience patterns in modern software architecture:

the Circuit Breaker Pattern.

This simulator is inspired by the Python library pybreaker and visually demonstrates how applications protect themselves when downstream services begin failing.

When the primary database is healthy, requests flow normally.

However, when repeated failures occur, the circuit breaker records those failures and eventually transitions from a CLOSED state into an OPEN state.

At that point, requests stop hitting the failing database entirely.

Instead, the system immediately returns fallback responses from cache.

This is called fast-fail behavior and it prevents cascading failures throughout an application stack.

After a configurable timeout period, the breaker moves into a HALF-OPEN state.

A test request, sometimes called a probe request, is allowed through.

If the database has recovered, the circuit closes and normal operation resumes.

If it fails again, the circuit reopens instantly.

The simulator also includes:

real-time packet visualization,

execution logs,

state transition tracking,

Python code mapping,

performance metrics,

success rate monitoring,

and a historical timeline showing how the breaker changes state during failures and recovery.

The goal is to transform an abstract software architecture concept into something visual, interactive, and easier to understand.

Whether you're studying distributed systems, Site Reliability Engineering, cloud architecture, or backend development, circuit breakers are an essential technique for building resilient applications.

Thank you for checking out the project.

---

### Closing Frame

```text
Circuit Breaker Pattern Simulator
by Robert Bostick

Interactive Resilience Engineering Lab

GitHub:
github.com/YOURUSERNAME/circuit-breaker-simulator
```
