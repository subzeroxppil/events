## Purpose

Defines what the lucky draw screens play and when — the spin bed, the win stinger, and the arcade chime that acknowledges a viewer entering the live page — so that the admin screen and every audience phone stay in step and no clip plays at the wrong moment.

## ADDED Requirements

### Requirement: Continuous spin audio

While the reel is turning the spin sound SHALL be audible for the whole spin, regardless of how long the spin is configured to last or how long the underlying audio clip is.

#### Scenario: Spin outlasts the audio clip

- **WHEN** a spin is configured to run longer than the remaining length of the spin audio clip
- **THEN** the clip repeats so that sound continues until the fade-out begins
- **AND** no part of the spin plays in silence before the fade-out

#### Scenario: Spin sound fades before the winner lands

- **WHEN** the spin passes its configured fade-out point
- **THEN** the spin sound fades to silence over the configured fade duration
- **AND** it stops repeating rather than restarting mid-fade

#### Scenario: Winner is announced

- **WHEN** the reel comes to rest on the winner
- **THEN** the spin sound is stopped and the celebration sounds play
- **AND** the spin sound's volume is restored so the next spin starts at full volume

### Requirement: Silent audio unlock on the live page

Mobile browsers only permit audio that a user gesture started, so the live page primes its clips when the viewer enters. That priming SHALL be inaudible.

#### Scenario: Viewer presses Enter

- **WHEN** a viewer presses the Enter button on the live page
- **THEN** the spin, celebration and applause clips are primed for later playback
- **AND** none of them is audible during priming
- **AND** each clip is left at its start position and full volume, ready to play normally

#### Scenario: Browser refuses to unlock audio

- **WHEN** priming is blocked by the browser
- **THEN** the page still enters
- **AND** the mute control remains available to the viewer

### Requirement: Arcade start chime

Entering the live page SHALL be acknowledged with a short retro arcade "game start" chime, so the viewer gets immediate confirmation that sound is working.

#### Scenario: Viewer enters with sound on

- **WHEN** a viewer presses Enter and audio was successfully unlocked
- **THEN** a short chime of no more than one second plays
- **AND** the chime is distinct from the celebration sound played when someone wins

#### Scenario: Viewer has muted the page

- **WHEN** a viewer presses Enter while the page is muted
- **THEN** no chime plays

### Requirement: Readable spin pacing

The reel SHALL turn slowly enough to read on both the admin screen and a phone, and the admin's pacing SHALL apply to every viewer.

#### Scenario: Admin spins with default settings

- **WHEN** an admin starts a spin without changing the animation settings
- **THEN** the reel takes noticeably longer than fifteen seconds to come to rest

#### Scenario: Viewers watch the same spin

- **WHEN** an admin spins while the draw is shared
- **THEN** every viewer's reel runs for the same duration and easing as the admin's
