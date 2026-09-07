## Purpose

Defines the single refresh a lucky draw screen performs when a browser tab first opens it, so that a screen arrived at cold — from a QR scan, a pasted link, or a restored tab — starts from a clean load without ever reloading in a loop.

## ADDED Requirements

### Requirement: One reload per tab per draw

A draw screen SHALL reload itself exactly once the first time a tab opens a given draw, and SHALL NOT reload again for that draw in that tab.

#### Scenario: Tab opens a draw for the first time

- **WHEN** a tab loads a draw screen it has not previously loaded in this session
- **THEN** the page reloads once
- **AND** the reloaded page does not reload again

#### Scenario: Navigating back to the same draw in the same tab

- **WHEN** the tab returns to a draw screen it has already reloaded in this session
- **THEN** the page does not reload

#### Scenario: Opening a different draw in the same tab

- **WHEN** the tab opens a draw screen for a different draw
- **THEN** that draw reloads once on its own account

#### Scenario: A new tab opens a previously seen draw

- **WHEN** a fresh tab opens a draw that another tab has already reloaded
- **THEN** it reloads once, because the record does not outlive the tab that made it

### Requirement: Reload must never loop

The record that a reload has happened SHALL be written before the reload is triggered, and no reload SHALL occur if that record cannot be written.

#### Scenario: Session storage is unavailable

- **WHEN** the browser refuses to persist the record, for example in a privacy mode or with site data blocked
- **THEN** the page does not reload at all
- **AND** it renders and functions normally

### Requirement: Applies to the admin draw screens

The admin draw screen SHALL perform this reload on the same terms as the public view-only page.

#### Scenario: Admin opens the draw screen cold

- **WHEN** an admin opens a draw screen in a tab that has not loaded that draw this session
- **THEN** the screen reloads once before the draw is run

#### Scenario: Admin skins share the behaviour

- **WHEN** an admin opens any draw screen skin that shares the common draw behaviour
- **THEN** the reload happens identically regardless of which skin was opened
