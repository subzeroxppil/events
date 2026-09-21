## Purpose

Makes a lucky draw spin a scheduled event on a timeline every screen shares, rather than a message each screen acts on whenever it arrives, so a spin starts and lands at the same moment on the projector, every admin laptop and every viewer's phone.

## ADDED Requirements

### Requirement: Spins are scheduled against a shared start instant

A broadcast spin SHALL carry the server-time instant at which the animation is to begin. Every client SHALL begin its animation at that instant, expressed in its own estimate of server time, rather than at the moment the spin reached it.

The scheduled instant SHALL be far enough ahead of the broadcast that a client on a typical event network receives it before the instant arrives.

#### Scenario: Two clients with different delivery delays start together

- **WHEN** a spin is broadcast and one client receives it 80ms later while another receives it 420ms later
- **THEN** both clients begin the reel animation at the same server-time instant, within the accuracy of their clock-offset estimates
- **AND** both reels come to rest on the winner at the same moment

#### Scenario: Reel hands off to idle drift without jumping

- **WHEN** a spin animation completes
- **THEN** the reel's resting position matches the position the shared idle timeline expects at that instant
- **AND** the reel does not visibly jump when the idle drift resumes

### Requirement: Late arrivals catch up rather than restart

A client that receives a spin after its scheduled start instant has already passed SHALL seek to the position the animation has already reached and continue from there. It SHALL NOT begin the animation from the start.

A client that receives a spin whose animation has already finished SHALL NOT animate it, and SHALL instead settle on the resting position for that spin.

#### Scenario: Client receives a spin mid-flight

- **WHEN** a client receives a spin 900ms after its scheduled start, for a spin lasting 5000ms
- **THEN** the client renders the reel at the position corresponding to 900ms of elapsed animation
- **AND** the reel comes to rest on the winner at the same moment as every other client

#### Scenario: Client reconnects after the spin has finished

- **WHEN** a client's stream reconnects and it is delivered a spin whose duration has already elapsed
- **THEN** the client does not replay the animation
- **AND** the reel shows the resting position for that spin

### Requirement: Exactly one spin wins when several admins spin at once

When several admins trigger a spin at the same time, the system SHALL accept exactly one of them and reject the rest. The accepted spin SHALL be the one every screen animates.

A rejected admin SHALL discard the winner and reel it picked locally and SHALL animate the accepted spin instead, in the same way as any other participant.

A spin SHALL be rejected while another spin is still in flight, and SHALL be accepted once that spin's duration has elapsed.

#### Scenario: Two admins press Spin simultaneously

- **WHEN** two admins trigger a spin within the same lead interval
- **THEN** one spin is accepted and the other is rejected
- **AND** every screen, including both admins', animates the accepted spin
- **AND** exactly one winner is recorded

#### Scenario: An admin presses Spin while a spin is running

- **WHEN** an admin triggers a spin while another spin is still animating
- **THEN** the request is rejected
- **AND** no second spin is broadcast

#### Scenario: Spinning again after the previous spin has finished

- **WHEN** an admin triggers a spin after the previous spin's duration has fully elapsed
- **THEN** the spin is accepted and broadcast

### Requirement: Synchronisation applies only while the draw is live

The scheduled start, the catch-up behaviour and the single-winner claim SHALL apply only while the lucky draw's view-only link is enabled.

While the view-only link is disabled, a spin SHALL begin immediately on the triggering admin's screen with no scheduled lead, SHALL NOT be broadcast, and SHALL NOT be subject to the claim.

#### Scenario: Spinning with the view-only link disabled

- **WHEN** an admin triggers a spin and the view-only link is disabled
- **THEN** the reel begins animating immediately with no waiting period
- **AND** no spin is broadcast to any other screen

#### Scenario: Enabling the view-only link mid-event

- **WHEN** an admin enables the view-only link and then triggers a spin
- **THEN** that spin is scheduled, broadcast and subject to the claim
