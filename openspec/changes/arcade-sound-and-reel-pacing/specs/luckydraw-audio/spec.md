## MODIFIED Requirements

### Requirement: Readable spin pacing

The reel SHALL turn slowly enough to read on both the admin screen and a phone, and the admin's pacing SHALL apply to every viewer. Slowing the reel SHALL be achieved by shortening the distance it travels rather than by lengthening the spin: the spin's duration is part of how the draw feels on stage and SHALL remain at its established length.

#### Scenario: Admin spins with default settings

- **WHEN** an admin starts a spin without changing the animation settings
- **THEN** the reel comes to rest after the draw's established spin length, not longer
- **AND** the names pass noticeably more slowly than they did before this requirement

#### Scenario: Viewers watch the same spin

- **WHEN** an admin spins while the draw is shared
- **THEN** every viewer's reel runs for the same duration, easing and distance as the admin's

#### Scenario: The reel is slowed further

- **WHEN** the reel needs to be slowed again in future
- **THEN** the distance it travels is reduced
- **AND** the spin's duration is left alone
