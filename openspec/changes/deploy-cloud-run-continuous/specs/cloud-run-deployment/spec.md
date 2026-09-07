## Purpose

Describes how the events portal is built into a container image, configured with its secrets and public settings, and redeployed when the `master` branch changes — so that a push is the only action needed to ship, and no credential is stored in plaintext.

## ADDED Requirements

### Requirement: Continuous deployment from master

A push to the repository's `master` branch SHALL cause a new image to be built and rolled out, with no further manual action.

#### Scenario: Commit is pushed to master

- **WHEN** a commit lands on `master`
- **THEN** a build starts automatically
- **AND** on success the resulting image is deployed as a new revision serving all traffic

#### Scenario: Build fails

- **WHEN** a build fails
- **THEN** no new revision is deployed
- **AND** the previously deployed revision continues to serve traffic

#### Scenario: Commit is pushed to another branch

- **WHEN** a commit lands on a branch other than `master`
- **THEN** no deployment occurs

### Requirement: Secrets are never stored in plaintext

Database credentials and the JWT signing secret SHALL be held in a secret store and referenced by the service, never set as plaintext configuration on the service or committed to the repository.

#### Scenario: Service is configured

- **WHEN** the service's configuration is inspected
- **THEN** the database and JWT values appear as references to a secret store, not as literal values

#### Scenario: Repository is inspected

- **WHEN** the repository contents are inspected
- **THEN** no database credential or signing secret is present in any committed file

### Requirement: Public base URL matches the deployment

The application's public base URL SHALL be the URL at which the deployed service is actually reachable.

#### Scenario: Application builds a public link

- **WHEN** the running application constructs a link intended to be opened by a user, such as a share link for a view-only draw
- **THEN** that link points at the deployed service's own URL

#### Scenario: Local development is unaffected

- **WHEN** the application is run locally
- **THEN** it continues to use the base URL from the developer's local environment file, which the deployment does not modify

### Requirement: The build context excludes local artefacts

The image build SHALL NOT include the developer's local dependency or build directories.

#### Scenario: An image is built

- **WHEN** an image is built from the repository
- **THEN** locally installed dependencies and locally built output are excluded from the build context
- **AND** dependencies in the image are those resolved from the committed lockfile

### Requirement: The service listens where the platform expects

The container SHALL serve HTTP on the port the hosting platform assigns it.

#### Scenario: Platform starts the container

- **WHEN** the platform starts the container with an assigned port
- **THEN** the application accepts requests on that port
- **AND** the revision becomes healthy without manual intervention
