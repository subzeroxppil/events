# Self-Service Guide for Events Portal

Welcome! This guide walks you through running an event from start to finish — checking people in, running a lucky draw on the big screen, and letting everyone follow along on their own phones.

No technical knowledge needed. If you can fill in a form, you can do all of this.

**The portal lives here:** <https://pp-events-alfc5lzdla-as.a.run.app>

---

## [Contents](#contents)

1. [Events: create, check people in, spin to win, and see the numbers](#1-events)
2. [Lucky draw: pick winners and let the room watch](#2-lucky-draw)
3. [Access: letting a colleague into the portal](#3-access)

> **New here and just want to run a lucky draw?**
> A lucky draw picks its participants from an event's attendance list, so you'll need an event first. Start at [Section 1](#1-events), then come back to [Section 2](#2-lucky-draw).

---

## [1. Events](#1-events)

Everything starts with an event. An event holds the guest list — and that guest list is what a lucky draw later draws from.

### [1.1 Create an event](#11-create-an-event)

Sign in to the portal, and you'll land on the **Events** page. This is a list of everything that has been run before.

![The Events page, listing past events with a Create Event button](docs/images/events-list.png)

Click **Create Event** in the top right and fill in the form.

![The Create Event form](docs/images/create-event.png)

Here's what each field is for:

| Field | What to put |
| --- | --- |
| **Name of Event** | What people will see when they check in, e.g. *Annual Town Hall* |
| **Country** and **Location** | Where it's happening, e.g. *Singapore*, *Suntec Convention Hall 4* |
| **Start** and **End Date/Time** | When it runs |
| **Terms & Conditions** | Optional. Shown to attendees when they check in |

Then two questions worth understanding:

**"Do you need your attendees to be assigned into groups upon arrival?"**

If your event has team activities, the portal can put people into groups automatically as they arrive — no clipboards required.

- **Max group capacity** — fills one group completely before starting the next. Set the max to 3, and the first three arrivals go to Group 1, the next three to Group 2, and so on.
- **Round robin** — deals people out one at a time in a loop: Group 1 → 2 → 3 → back to 1.
- **No need** — everyone is simply checked in.

**"Does your event require a Spin & Win?"**

Choose **Yes** and every attendee gets one spin on a digital prize wheel, on their own phone, after they check in. You'll then be asked to list your prizes — for each one, enter the **brand**, a **description**, a **picture**, and the **quantity** available.

Add as many prizes as you like. The wheel is built from this list, and each prize runs out once its quantity is used up.

Click **Create Event** when you're done.

### [1.2 Check people in](#12-check-people-in)

Open your event and click **Check-in QR code** in the top right.

![The check-in QR code screen for an event](docs/images/checkin-qr.png)

Put this on a screen at the entrance, print it on a poster, or share the link — whatever suits your venue. There's a copy button next to the link if you'd rather send it out.

When someone scans it, they see this on their phone:

![The attendee check-in screen on a phone](docs/images/checkin-attendee.png)

They enter their **Corp Pass ID** (the first part of their email, so `johndoe` for `johndoe@paypal.com`) and tap **Check in**. That's it — they're on the list.

If you turned on grouping, their group number appears right away. If you turned on Spin & Win, they can go straight to the prize wheel.

> **Tip:** Attendees don't need an account or a password. Only organisers sign in.

### [1.3 See how it went](#13-see-how-it-went)

Open the event at any time — during or after — to see where things stand.

![An event page showing attendance, groups formed, and the attendee list](docs/images/event-detail.png)

At a glance you get:

- **Attendance** — how many people have checked in, updating as they arrive
- **Groups Formed** — how many groups exist, and which method was used
- **Overview** — every attendee, when they registered, and their group number

You can sort the list by registration time, and **Export** downloads the whole thing as a spreadsheet for reporting or follow-ups.

If your organisation's business-unit information is available, a breakdown chart appears here too, showing which parts of the business turned up.

---

## [2. Lucky draw](#2-lucky-draw)

A lucky draw picks random winners from the people who actually showed up. It's designed to be run live — on a projector, in front of a room — and everyone can follow along on their own phone.

> **Before you start:** you need an event with attendees, because that's where participants come from. If you haven't set one up yet, see [Section 1](#1-events) first.

### [2.1 Create the draw](#21-create-the-draw)

Click **Lucky Draw** in the top navigation, then **Create Lucky Draw**.

![The Lucky Draw page listing past draws](docs/images/luckydraw-list.png)

Give your draw a name and choose which event's attendees should take part.

![The Create Lucky Draw form, choosing which events supply the participants](docs/images/luckydraw-create.png)

Each event shows its attendee count, so you can see exactly how many people you're drawing from. **You can tick more than one event** — handy if your day had several sessions and you want everyone in the same draw.

Click create, and your draw is ready.

### [2.2 Run the draw](#22-run-the-draw)

Open your draw and you'll see the draw screen. Put this on the big screen.

![The lucky draw screen with the reel of names and the Spin button](docs/images/luckydraw-screen.png)

Press **SPIN**. The reel spins for about thirteen seconds, slows down, and lands on a winner, who's announced with sound and fireworks.

A few things worth knowing:

- **Nobody wins twice.** Once someone has won, they're excluded from later spins automatically.
- **Winners are saved.** Click **WINNERS** to see everyone who has won so far.
- **You can spin as many times as you like** — once per prize, usually.
- **Presentation clickers work.** If your remote sends a page-forward signal, it triggers a spin, so you can run the draw from the front of the room.

Click **SETTINGS** to adjust how the draw looks and feels — speed, colours, sound, and fireworks — if you'd like to fine-tune it before the event.

### [2.3 No big screen? Share a view-only link](#23-no-big-screen-share-a-view-only-link)

If your venue has no projector — or the screen is too small for a big room — everyone can watch the draw on their own phone instead.

On the draw screen, click **SHARE**.

![The Share panel showing the view-only toggle, a QR code, and the public link](docs/images/luckydraw-share.png)

Turn on **Enable view-only link**. You'll get a QR code and a link to share however you like — put the QR on a slide, drop the link in a group chat, or read it out.

Anyone who opens it watches the draw live. **They don't need an account and don't need to log in.**

> **Important:** the link shows nothing at all until you switch this toggle on. If people say the page isn't working, check the toggle first. Turning it back off drops everyone to a "not live yet" screen.

### [2.4 What people see on their phones](#24-what-people-see-on-their-phones)

When someone opens your link, they get a welcome screen showing how many people are in the draw and how many have already won.

![The view-only welcome screen on a phone](docs/images/live-welcome.png)

They tap **ENTER** once — this is what lets their phone play sound — and then they're watching.

![The live draw reel on a phone](docs/images/live-reel.png)

From then on it's completely hands-off:

- **Everyone sees the same reel, at the same position.** Whether someone joined an hour early or thirty seconds ago, and whatever size their screen is, the names line up.
- **The moment you press Spin, every phone spins.** Same names, same timing, same winner, same sounds.
- **No buttons, no refreshing.** They just watch for their own name.
- **There's a mute button** in the corner for anyone who'd rather watch in silence.

People watching can't spin, can't see the winner history, and can't change anything. It's watch-only.

> **Tip:** ask people to turn their volume up and keep the page open. If a phone locks, they just reopen the link and rejoin — they'll be back in step with the room automatically.

---

## [3. Access](#3-access)

The portal is invite-only. Anyone who needs to organise events has to be added first.

### [3.1 Add someone](#31-add-someone)

Click your **profile picture in the top right**, then **Admin Access**.

![The profile menu in the top right, with Admin Access](docs/images/admin-menu.png)

Type their email into the **Add new admin** box and click **Add**.

![The Admin Portal Access page with the add-admin box and the list of admins](docs/images/admin-access.png)

That's all you need to do. Once their email is on the list, they can go to the portal and create their own account with a password of their choosing.

### [3.2 What they can do](#32-what-they-can-do)

Anyone you add can create and manage events and run lucky draws — the same as you.

They **cannot** remove other admins, so there's no risk of someone accidentally locking the team out.

---

## [Quick answers](#quick-answers)

**Do attendees need an account?**
No. Only organisers sign in. Attendees just scan a QR code.

**Can I run a lucky draw without an event?**
No — participants come from an event's attendance list, so you need an event with people checked in. See [Section 1](#1-events).

**Can one draw cover several events?**
Yes. Tick as many events as you like when creating the draw.

**Can the same person win twice?**
No. Winners are removed from later spins automatically.

**Someone says the view-only link isn't working.**
Check that **Enable view-only link** is switched on in the Share panel. Until it is, the link shows nothing.

**Can I get the attendance list as a spreadsheet?**
Yes — open the event and click **Export**.

**Someone joined the live page late. Will they be out of sync?**
No. Late joiners land exactly where everyone else is.

---

*Have a question this guide doesn't answer? Speak to whoever gave you access to the portal.*
