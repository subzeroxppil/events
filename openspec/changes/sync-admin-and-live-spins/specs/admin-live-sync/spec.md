## Purpose

Lets the admin lucky draw page take part in the live draw instead of only driving it, so a second admin sees spins as they happen, sees an up-to-date winners list, and can tell at a glance whether the draw is running solo or in front of an audience.

## ADDED Requirements

### Requirement: An admin screen mirrors spins triggered elsewhere

While the view-only link is enabled, an admin lucky draw screen SHALL animate a spin triggered by any other admin, using the same reel, winner and timing as every other screen.

An admin screen SHALL NOT record a winner for a spin it did not trigger.

#### Scenario: A second admin sees the spin

- **WHEN** admin A triggers a spin and admin B has the same lucky draw open
- **THEN** admin B's reel animates the same spin, starting and landing at the same moments as admin A's
- **AND** admin B's screen shows the same winner

#### Scenario: Only the triggering admin records the winner

- **WHEN** a spin triggered by admin A completes on three admin screens
- **THEN** exactly one winner record is created
- **AND** it is created by the admin that triggered the spin

#### Scenario: Winner is recorded when the animation completes

- **WHEN** a spin the admin triggered finishes animating
- **THEN** the winner is recorded at that point, not when the spin was triggered

### Requirement: The Spin button reflects what the draw is doing

While the view-only link is enabled, the Spin control SHALL be unavailable and SHALL show a busy state from the moment an admin triggers a spin until that spin's animation begins.

An admin screen SHALL make its Spin control unavailable while a spin triggered anywhere is in flight, and SHALL restore it once that spin has completed.

#### Scenario: The triggering admin waits for the shared start

- **WHEN** an admin triggers a spin while the view-only link is enabled
- **THEN** the Spin control becomes unavailable and shows a busy indicator
- **AND** it stays that way until the reel begins animating

#### Scenario: A mirroring admin cannot spin over a running spin

- **WHEN** a spin triggered by another admin is animating
- **THEN** this admin's Spin control is unavailable
- **AND** it becomes available again once the spin has completed

### Requirement: Admins can tell which mode the draw is in

An admin lucky draw screen SHALL indicate whether the draw is in solo mode (view-only link disabled, spins immediate and local) or synced mode (view-only link enabled, spins shared across screens).

The indicator SHALL update when the view-only link is toggled, without requiring a page reload.

#### Scenario: Mode is visible before spinning

- **WHEN** an admin opens a lucky draw whose view-only link is enabled
- **THEN** the screen shows that the draw is in synced mode

#### Scenario: Toggling the view-only link updates the indicator

- **WHEN** an admin enables the view-only link
- **THEN** the indicator changes to synced mode without a reload

### Requirement: An admin screen joins a draw that goes live while it is open

An admin screen opened while the view-only link was disabled SHALL begin taking part in the synced draw once the link is enabled elsewhere, without requiring a reload.

#### Scenario: The link is enabled from another screen

- **WHEN** admin B has the lucky draw open with the view-only link disabled, and admin A enables it
- **THEN** admin B's screen moves to synced mode
- **AND** a spin admin A then triggers is mirrored on admin B's screen

### Requirement: The winners list stays current on every admin screen

An admin lucky draw screen SHALL reflect winner changes made elsewhere while it is open, without requiring a reload.

#### Scenario: Winners list updates on a mirroring admin screen

- **WHEN** admin A completes a spin and the winner is recorded
- **THEN** admin B's winners list shows that winner without a reload

#### Scenario: Removing a winner updates other admin screens

- **WHEN** admin A removes a winner
- **THEN** admin B's winners list no longer shows that winner, without a reload

### Requirement: Each admin keeps their own display settings

An admin's animation and display settings SHALL NOT be changed by another admin editing theirs.

A broadcast spin SHALL carry the settings of the admin that triggered it, so the spin itself looks and sounds the same on every screen regardless of each screen's own settings.

#### Scenario: One admin edits settings while another watches

- **WHEN** admin A changes the spin duration in their settings panel
- **THEN** admin B's settings panel is unchanged

#### Scenario: A spin uses the triggering admin's settings

- **WHEN** admin A triggers a spin with a spin duration different from admin B's setting
- **THEN** the reel on both screens animates for the duration admin A set
