## Context

See proposal.md — Why.

The constraints that shape the approach, all of which already exist in the codebase:

- **The transport has irreducible jitter.** A spin travels admin → `POST /spin` → `liveSpin`/`liveSpinAt` on the draw row → `live-hub` poll (300ms interval, independent phase per server instance) → SSE → client. Total delivery is roughly 50–550ms and differs per viewer. Shrinking it does not make two viewers agree; only a deadline does.
- **Clock agreement already exists, but is weaker than it looks.** `use-live-draw.ts` estimates `clockOffsetRef` from the half round-trip of the snapshot fetch, and the idle drift is already computed from server time — which is why idle reels are already in step across devices. The spin animation is the one thing that isn't. The single-sample estimate is good enough for a drift measured in rows per second; it is not good enough to start an animation on, as the measurements below showed.
- **The payload is fully deterministic.** `SpinPayload` carries the reel, the winner index, the final target, the duration and the easing. Two clients given the same payload and the same elapsed time render the same frame. Nothing else needs to be synchronised.
- **`anchorForSpin` already assumes the fix.** It computes the resting anchor as `spinId + duration`. Making the animation actually start at a server-time instant closes the gap between that assumption and reality.

## Goals / Non-Goals

**Goals:**

- One shared timeline for the spin, derived from server time on every screen.
- Degrade gracefully rather than break: a client that misses the deadline still lands on the winner at the right moment.
- Leave the solo path (view-only link off) byte-for-byte unchanged in behaviour.
- One rendering implementation for the spin progress, shared by the admin and live hooks, so the two cannot drift.

**Non-Goals:**

- Reducing transport latency. No Redis, no `LISTEN/NOTIFY`, no shortening the 300ms poll. Those reduce jitter but never eliminate it, and the deadline makes them unnecessary.
- Changing authentication. `src/middleware.js` already guards `/admin/*` and `/api/admin/*`; this change neither adds to that nor depends on more.
- Syncing anything other than the spin and the winners list — explicitly not the settings panel, not participants (which never change mid-draw).
- Electing a presenter or a driver. Every admin remains a peer.

## Decisions

### The spin carries an explicit `startAt`, granted by the server

`SpinPayload` gains `startAt: number` — an epoch-ms server-time instant. The server sets it when it accepts the claim: `startAt = stampedAt + LEAD`, with `LEAD = 700`.

Every client schedules its animation for `startAt`, converting to local time via its own clock offset.

*Alternative considered: derive it as `spinId + LEAD` with `LEAD` as a shared client constant.* No new field, but the lead becomes a value the client and server must agree on forever, and changing it would desynchronise a mixed-version room during a rollout. An explicit field costs one JSON key and makes the lead a server-side decision.

*Why 700ms:* the 300ms poll plus a stamp write plus SSE delivery on an event Wi-Fi network. It is a constant, not a setting — a knob here would be a knob nobody can tune correctly without measuring the room.

### Animation progress is a pure function of server time

A single helper resolves the reel position:

```
elapsed  = serverNow - startAt
progress = clamp(elapsed / duration, 0, 1)
```

- `elapsed < 0` → not started; schedule a timer for the remainder and keep drifting idle.
- `0 ≤ elapsed < duration` → animate from this progress. A late client seeks in rather than starting at zero. During the early fast phase the reel is a motion blur, so the seek is not visible.
- `elapsed ≥ duration` → do not animate; settle on the resting position and run the completion path.

This replaces `const startTime = Date.now()` in `use-live-draw.ts:343` and is what closes the end-of-spin snap: the reel now genuinely rests where `anchorForSpin` says it does.

*Alternative considered: deadline only, with no catch-up.* Simpler, but any client that misses the deadline — a throttled background tab, a phone that reconnects mid-spin, a slow network — either shows nothing or starts a full spin that finishes out of step with the room. Catch-up costs a few lines and removes the whole failure class.

### The claim is optimistic concurrency on `liveSpinAt`

`POST /spin` becomes a claim rather than an unconditional write:

1. Read `liveSpin` and `liveSpinAt`.
2. Compute whether a spin is still in flight: `liveSpinAt + storedStartLead + storedDuration > now`, using the *stored* payload's timings, not the incoming one.
3. If in flight → `409`, with the in-flight `spinId` so the loser can wait for it on the stream rather than guessing.
4. Otherwise `updateMany` guarded on `liveSpinAt` still equalling the value read in step 1. A zero-row result means another admin claimed in between → `409`.
5. On success, return `{ spinId, startAt, serverNow }`.

*Alternative considered: a Postgres advisory lock.* Correct, but it introduces a lock that has to be released and whose lifetime has to outlive a serverless invocation. The row already carries an in-flight marker; the guarded update reuses it and is stateless.

*Alternative considered: no server claim, rely on clients disabling their Spin buttons when they see a spin on the stream.* That closes the common case but not the genuinely simultaneous one, which is exactly the case where a duplicate winner would be recorded. Both are used: the stream-driven disable is the fast path, the claim is the correctness guarantee.

### The triggering admin renders its own payload, scheduled — it does not wait for the echo

The admin that wins the claim already holds the payload. It schedules that payload at the returned `startAt` rather than waiting to receive it back over SSE.

*Alternative considered: full symmetry — the admin publishes and then renders only what comes back, so there is exactly one rendering path.* Architecturally cleaner, and it was tempting. Rejected because the echo adds the full poll interval on top of the lead, pushing `LEAD` to something like 1200ms and making the presenter's wait noticeably worse. The divergence risk it protects against is instead handled by both paths calling the same progress helper with the same payload object.

Consequence: the triggering admin will also receive its own spin on the stream and MUST ignore it. Both hooks keep a `lastSpinId` guard; the admin seeds its guard with the `spinId` the claim returned.

### The admin subscribes to the existing public stream

`/api/live/[luckydrawId]/stream` is reused as-is rather than adding an admin-scoped stream.

It already emits everything the admin needs — `init`, `spin`, `winners`, `offline` — and it is already gated on exactly the condition under which admin sync is wanted (`viewOnlyEnabled`). A separate admin stream would duplicate the hub wiring and be gated identically anyway.

(`src/middleware.js` does guard `/admin/*` and `/api/admin/*` on the session cookie, so the claim endpoint is authenticated. The stream is under `/api/live/*`, which is public by design — it is what the audience watches.)

### Mode is a branch at the top of `handleSpin`

```
viewOnlyEnabled = false          viewOnlyEnabled = true
────────────────────────         ──────────────────────────
pick winner locally              pick winner locally
animate NOW                      POST claim
POST winner at end               ├── 409 → discard, watch stream
                                 └── 200 → schedule at startAt
                                            animate
                                            POST winner at end
```

The solo branch is today's code path, untouched. Everything new lives on the synced branch, which means the change cannot regress a draw run by a single admin with the public link off.

### Winner recording stays at spin end, gated on having claimed

`handleSpinComplete` keeps its `POST /api/admin/luckydraw/[id]` call, but only runs it when this screen owns the spin — i.e. its `spinId` came from a claim this client won. Mirroring admins run the whole completion path (sounds, fireworks, overlay) and skip the write.

*Trade-off accepted:* a browser that crashes between the start and the end of a spin loses that winner. This is exactly today's behaviour; moving the write to claim time would fix it but would also commit a winner for a spin nobody saw, which is worse at an event.

### The clock estimate is multi-sample, from a route that does nothing else

Everything above rests on each screen knowing how far its clock is from the
server's. That number gets its own dedicated route, `/api/live/<id>/time`,
which touches no database and reads no params, probed five times at startup
with the *smallest* round trip kept and re-probed every two minutes.

The obvious cheaper design — one sample, folded in from a request the page was
making anyway — is what this change originally did, and measurement killed it.
Three screens on the same machine as the server, whose true offset is therefore
zero, revealed the same winner 665ms apart: the live page had taken its one
sample on a cold snapshot fetch and was 441ms out for the rest of its session.
A half-round-trip estimate assumes the trip out and the trip back took the same
time, and a single unlucky sample bakes that error in permanently. Keeping the
tightest of several samples bounds the error by the best round trip observed,
because a fast round trip has little room to be lopsided.

For the same reason the granted claim is deliberately *not* used as a clock
sample, despite carrying a `serverNow`. That handler reads its clock after a
database write, so the reading sits near the end of the request rather than at
its midpoint — a systematically biased sample that can still win on round-trip
time. Letting it in put the claiming admin 445ms behind the room it had just
scheduled.

### The winner is recorded after the reveal, not before it

`handleSpinComplete` shows the overlay, then writes the winner, and does not
await the write before revealing.

It used to await first. That was invisible while one screen ran the draw, and
became the single worst source of skew the moment other screens mirrored it:
they have no winner to write, so they reveal as soon as the reel lands, while
the claiming admin waits on the database. Measured against a cold remote
Postgres that wait was 6.2 seconds — the presenter's own screen last in the
room to show the name it had just drawn.

## Risks / Trade-offs

**Clock offset error on a client** → bounded by the best of several round trips rather than by one arbitrary one, and re-probed every two minutes so a device that sleeps or changes network recovers. Measured end-to-end at 86ms of spread across two admin screens and a viewer, down from 665ms with a single sample.

**`LEAD` too short on a bad network** → the catch-up path takes over; that client seeks in and still lands with the room. Worst case it degrades to today's behaviour for that one device rather than breaking.

**Backgrounded tabs throttle timers** → a scheduled start can fire late, or `requestAnimationFrame` can stall entirely. The progress helper reads server time on every frame rather than accumulating, so the reel snaps back to the correct position as soon as the tab is foregrounded, and the completion path is driven by elapsed time rather than frame count.

**Mixed versions during rollout** → an old client receiving a payload with `startAt` ignores the unknown key and starts on arrival (today's behaviour, unsynced). A new client receiving a payload without `startAt` must fall back to starting on arrival rather than treating a missing value as zero, which would make it settle instantly. Both directions degrade to "unsynced", never to "wrong".

**Two rendering paths for the admin's own spin** → mitigated by a shared progress helper and by the guard that makes the admin ignore its own echo. The alternative (full echo) was rejected for the latency cost; if the two paths do drift in future, folding the admin onto the echo remains available.

**`liveSpinAt` now means two things** — the broadcast bus stamp and the in-flight lock. They are consistent (a spin is in flight exactly while its stamp is recent), and disabling the view-only link already clears both fields, which correctly releases the lock.

## Migration Plan

No schema migration — `liveSpin` is already `Json?`.

Normal rollout. The mixed-version window is safe in both directions, as above. Rollback is a redeploy of the previous build: a stale `startAt` in a `liveSpin` row is an unknown key to the old code and is ignored.

Verification at deploy time is manual and cheap: open the admin page in two browsers plus the live page, enable the view-only link, and spin. The three reels should start and land together, and the winners list should update on all of them.
