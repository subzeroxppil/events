## Purpose

Describes what a visitor sees on the public landing page — the pitch, the live check-in figure, and the route into the admin portal — and how the page behaves while that figure is still loading or fails to arrive.

## ADDED Requirements

### Requirement: Landing page presentation

The landing page SHALL present the product and offer a single clear route into the admin portal, using the same visual palette as the rest of the application.

#### Scenario: Visitor arrives

- **WHEN** a visitor opens the site root
- **THEN** they see a headline, a supporting line, a primary action leading to the admin portal, and the feature summaries
- **AND** the page's accent colours match those used by the rest of the application

#### Scenario: Visitor on a phone

- **WHEN** the page is viewed at a narrow viewport
- **THEN** all content remains readable and reachable without horizontal scrolling
- **AND** the primary action stays within reach without zooming

#### Scenario: Visitor on a desktop

- **WHEN** the page is viewed at a wide viewport
- **THEN** content is constrained to a readable measure rather than stretching to the full window width

### Requirement: Check-in total

The landing page SHALL show the total number of check-ins recorded across all events, and SHALL remain usable whether or not that figure arrives.

#### Scenario: Total is still loading

- **WHEN** the check-in total has been requested but not yet returned
- **THEN** a placeholder occupies the space the figure will fill
- **AND** the rest of the page is fully rendered and interactive

#### Scenario: Total arrives

- **WHEN** the check-in total is returned
- **THEN** it replaces the placeholder
- **AND** it animates up to its value rather than appearing abruptly

#### Scenario: Request fails

- **WHEN** the check-in total cannot be retrieved
- **THEN** the rest of the page still renders and the primary action still works
- **AND** no error is shown in place of the whole page
