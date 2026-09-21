# How the lucky draw stays in sync

When the host presses **Spin**, the reel has to start and land at the same moment on every screen in the room — the projector, the other organisers' laptops, and every phone on the view-only link.

This is how that works.

> Looking for how to *run* an event? That's [guide.md](guide.md). This file is about the machinery underneath.

---

## The problem

A spin doesn't travel instantly, and — this is the part that matters — it doesn't take the *same* time to reach everyone.

```
 admin presses Spin
   │
   ├─ POST /spin ─────────────▶ write liveSpin on the draw row
   │                                      │
   │                             live-hub polls every 300ms
   │                             (each server instance on its own beat)
   │                                      │
   │                                      ├─ SSE ──▶ 📺 projector   ~80ms
   │                                      ├─ SSE ──▶ 💻 admin B     ~300ms
   │                                      └─ SSE ──▶ 📱 phone       ~550ms
```

Delivery lands somewhere between 50ms and 550ms, and it's a **different** number for each screen. So "start as soon as this reaches you" guarantees the room is out of step.

Making the pipe faster doesn't fix it. Even a perfect push still has jitter. The fix isn't speed — it's agreeing on a **time**.

---

## The fix: everyone starts at an appointed moment

The spin doesn't say *"go now"*. It says *"go at 14:32:05.700"*.

```
  claim         everyone has it        THE MOMENT
  granted       in hand                (all screens start together)
    │                                       │
    ▼                                       ▼
    ├───────────── 700ms lead ──────────────┤
    │                                       │
    │   📺 got it here ──────── waits ──────┤ ▶ spin
    │   💻 got it here ─────── waits ───────┤ ▶ spin
    │   📱 got it ──────────── waits ───────┤ ▶ spin
```

The lead is **700ms** — comfortably more than the slowest realistic delivery, so every screen is holding the spin before its moment arrives, and they all begin together.

The cost is that the host's own screen waits 700ms after their click. That's why the button shows **STARTING…** and goes disabled for that beat: the pause is deliberate, and saying so stops it reading as lag.

### What if a screen gets it late anyway?

It doesn't restart from zero — it **joins where the room already is**:

```
 appointed moment                         reel lands
     │                                        │
     ▼                                        ▼
     ├─────────────── 13s spin ───────────────┤
     │                                        │
     │        📱 arrives late (900ms in)      │
     │             └─ skips to 900ms ─────────┤ ▶ lands with everyone
```

Because the first moments of a spin are a blur, skipping into it isn't visible — and the thing the room actually watches for, the **landing**, is still shared.

If a screen gets the spin after it has already finished (a reconnect, say), it doesn't replay it at all — it just settles where the reel came to rest.

---

## Two modes

Everything above only applies when the **view-only link is on**. With it off, the draw assumes one organiser at one screen and behaves exactly as it always has.

```
 ┌── Link OFF ─── "Solo" ────────┐   ┌── Link ON ─── "Live · synced" ──┐
 │                               │   │                                 │
 │  spin starts instantly        │   │  claim → 700ms lead → all go    │
 │  nothing broadcast            │   │  broadcast to every screen      │
 │  no waiting                   │   │  other admins mirror it         │
 │                               │   │  winners list stays current     │
 └───────────────────────────────┘   └─────────────────────────────────┘
```

The badge under the Spin button always says which mode you're in. Flipping the link flips the mode immediately — no reload, on every admin screen that has the draw open.

---

## Two people press Spin at once

Any organiser can press Spin. So two can press within the same 700ms window — and each of their browsers has *already picked a different winner* before the click even leaves the laptop.

Exactly one must win, or the draw banks two winners for a spin the room only saw once.

```
  💻 admin A ──┐  "I pick Alice"
               ├──▶ server: first write wins
  💻 admin B ──┘  "I pick Bob"
                       │
                       ├─ A wins  → 200, Alice's spin runs everywhere
                       └─ B loses → 409, B throws away Bob and
                                          watches A's spin like anyone else
```

The server decides by writing the spin **only if** the row still looks the way it did a moment ago. If another admin slipped in between, nothing is written and that admin gets a polite refusal.

There's a second, softer guard in front of it: the moment any screen sees a spin start, its own Spin button greys out. That covers everything except a genuine dead heat — and the server covers that.

**Only the admin who won the claim records the winner.** Mirroring screens run the whole celebration — sounds, confetti, the overlay — and write nothing.

---

## Agreeing what time it is

All of this rests on each screen knowing how far its own clock is from the server's. Get that wrong by 400ms and that screen is 400ms out of step all event — the exact thing the appointment was meant to prevent.

The naive way is to ask once and assume the reply took as long coming back as it did going out:

```
  ask ────────▶ server
                  │  ← reads its clock here
  reply ◀─────────┘

  assumption: the clock was read exactly halfway through the round trip
```

That assumption breaks whenever the trip is lopsided — a cold server, a slow first load, a phone whose upload is worse than its download. And one unlucky reading gets baked in for the whole session.

So instead: ask **five times** and keep the answer from the **fastest** round trip. A fast round trip has little room to be lopsided, so it's the one most likely to be honest. Re-checked every couple of minutes, in case the device sleeps or changes network.

It asks a route that does nothing but read the clock — no database, no lookups — because any work the server does is indistinguishable from network delay and would poison the estimate.

> Measured effect: three screens revealing the same winner went from **665ms apart** to **86ms apart**.

---

## Three things that are easy to get wrong

**Don't time the clock off a request that does real work.** The spin claim replies with the server's time, which looks convenient — but it reads that clock *after* writing to the database, so the reading sits near the end of the request rather than the middle. It's a biased sample even when it looks fast, and trusting it put the host's screen half a second behind the room it had just scheduled.

**Don't make the reveal wait for the database.** The winner is saved after the overlay appears, not before. Mirroring screens have nothing to save, so they reveal the instant the reel lands; if the host's screen waited for the write first, it would be the *last* screen in the room to show the name it just drew — measured at 6 seconds against a cold database.

---

**Don't let a new arrival speak for everyone.** The fan-out keeps track of which spins have already gone out. That marker has to be *per viewer*: when it was shared, someone opening the page in the moment between a spin being written and the next poll would move the shared marker past that spin, and the poll would then decide it was old news — so every phone already watching missed it entirely. One arrival, and the room sees nothing.

## Where it lives

| File | What it does |
| --- | --- |
| `src/lib/luckydraw-live.ts` | The spin payload, the 700ms lead, and the one function that answers "where should the reel be right now?" |
| `src/lib/clock-sync.ts` | Working out how far this device's clock is from the server's |
| `src/app/api/live/[id]/time/route.ts` | Replies with the server clock and nothing else |
| `src/app/api/admin/luckydraw/[id]/spin/route.ts` | The claim: grants one spin, refuses the rest, sets the appointed moment |
| `src/lib/live-hub.ts` | Watches the draw row and fans spins out to everyone listening |
| `src/app/api/live/[id]/stream/route.ts` | The live feed every screen subscribes to |
| `src/app/live/[id]/use-live-draw.ts` | The public view-only page |
| `src/app/admin/luckydraw/[id]/use-admin-draw.ts` | The admin screen — claims spins, and mirrors other admins' |

Both the admin screen and the public page resolve the reel through the **same** function, so the two can't quietly drift apart.

---

## Rolling it out

Nothing to migrate — the appointed moment rides along inside the existing spin record.

During a deploy, old and new code coexist safely in both directions: an old screen ignores the appointment and starts on arrival (unsynced, exactly as before), and a new screen given a spin with no appointment does the same. Either way the fallback is "not synced" — never "wrong".
