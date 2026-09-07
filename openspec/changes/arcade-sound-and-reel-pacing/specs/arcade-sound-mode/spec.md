## Purpose

Describes the opt-in synthesised soundtrack for the lucky draw — how a screen is put into it, what it plays, and the guarantee that choosing it never changes what anyone else hears.

## ADDED Requirements

### Requirement: Opting a screen into the arcade soundtrack

A draw screen SHALL use the synthesised arcade soundtrack when, and only when, its own address asks for it.

#### Scenario: Screen is opened with the arcade sound requested

- **WHEN** either draw screen is opened with the arcade sound selected in its address
- **THEN** the draw's spin and win sounds are the synthesised ones
- **AND** the recorded clips are not played

#### Scenario: Screen is opened normally

- **WHEN** a draw screen is opened without that selection
- **THEN** it plays the recorded clips exactly as before

#### Scenario: Combined with a visual skin

- **WHEN** a screen selects both a visual skin and the arcade sound
- **THEN** both apply, and neither overrides the other

#### Scenario: One viewer's choice does not reach another

- **WHEN** an admin runs a draw with the arcade sound selected
- **THEN** viewers hear whatever their own address selects, not the admin's choice

### Requirement: The reel is audible for the whole spin and slows with it

The synthesised spin sound SHALL sound for as long as the reel turns, and SHALL slow down as the reel slows.

#### Scenario: A spin runs

- **WHEN** a spin starts
- **THEN** a repeating reel sound plays from the start of the spin
- **AND** its rate decreases over the spin, ending markedly slower than it began
- **AND** it stops when the reel comes to rest

#### Scenario: Spin duration is changed

- **WHEN** the configured spin duration changes
- **THEN** the reel sound still covers the whole spin and still finishes as the reel stops

### Requirement: A distinct win sound

The win SHALL be marked by a sound clearly different from the reel, and SHALL not distort.

#### Scenario: The reel lands on a winner

- **WHEN** the reel comes to rest
- **THEN** a short celebratory sound plays, no longer than about two seconds
- **AND** it does not clip or distort

### Requirement: The soundtrack respects the existing controls

The synthesised soundtrack SHALL obey the same mute and sound-enabled controls as the recorded clips, and SHALL never prevent a screen from being used.

#### Scenario: Viewer mutes the page

- **WHEN** a viewer mutes the live page
- **THEN** the synthesised sounds are silenced
- **AND** unmuting restores them

#### Scenario: Sounds are disabled in the draw settings

- **WHEN** sounds are disabled for the draw
- **THEN** no synthesised sound plays

#### Scenario: Audio is unavailable in the browser

- **WHEN** the browser cannot provide synthesised audio
- **THEN** the screen still loads and the draw still runs, silently
