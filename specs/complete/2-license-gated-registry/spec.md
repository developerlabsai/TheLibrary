# Feature Specification: License-Gated Registry & CLI Distribution Platform

**Feature Branch**: `2-license-gated-registry`
**Created**: 2026-03-19
**Status**: Draft
**Input**: User description: "Build a license server, registry API, and CLI distribution system for TheLibrary/SpecKit deployer. Enables developers to install speckit globally via npm, and supports licensing out skills, agents, templates, and packages to clients with full access control and revocation."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Developer Installs SpecKit CLI Globally (Priority: P1)

A developer on the team wants to use SpecKit across multiple projects. They install the CLI tool globally from npm so they can run `speckit` commands from any directory on their machine without per-project setup.

**Why this priority**: Without global CLI access, no other feature in this spec is usable. This is the foundational delivery mechanism for everything else.

**Independent Test**: Can be fully tested by running `npm install -g @devlabs/speckit-deployer` on a clean machine and verifying `speckit --version` returns the correct version. Delivers immediate value: developers can deploy assets into any project.

**Acceptance Scenarios**:

1. **Given** a developer with Node.js installed, **When** they run `npm install -g @devlabs/speckit-deployer`, **Then** the `speckit` command is available globally in their terminal and `speckit --version` displays the installed version.
2. **Given** the CLI is installed globally, **When** the developer runs `speckit list`, **Then** they see all available community/free assets without needing a license key.
3. **Given** the CLI is installed globally, **When** the developer runs `speckit deploy ./my-project --agents research-agent`, **Then** free community agents deploy successfully without authentication.

---

### User Story 2 - Developer Authenticates with License Key (Priority: P1)

A developer working for a licensed client needs to access premium assets. They authenticate the CLI with their organization's license key so that deploy commands can fetch gated content from the registry.

**Why this priority**: Authentication is the gateway to the entire licensing model. Without it, there is no distinction between free and paid tiers.

**Independent Test**: Can be fully tested by running `speckit login`, entering a valid API key, and verifying the key is stored locally. A subsequent `speckit license status` confirms the active subscription and entitled assets.

**Acceptance Scenarios**:

1. **Given** a developer with a valid license key, **When** they run `speckit login` and provide their key, **Then** the key is stored securely in a local configuration file and a success confirmation is displayed.
2. **Given** a developer with an invalid or expired key, **When** they run `speckit login`, **Then** they receive a clear error message indicating the key is not valid and no key is stored.
3. **Given** an authenticated developer, **When** they run `speckit license status`, **Then** they see their organization name, subscription tier (Pro/Enterprise), expiration date, and a list of entitled asset categories.
4. **Given** an authenticated developer, **When** they run `speckit logout`, **Then** the stored key is removed from local configuration and a confirmation is displayed.

---

### User Story 3 - Developer Deploys Licensed Assets (Priority: P2)

A developer at a licensed organization wants to deploy premium agents, skills, or templates into their project. The CLI validates their license, fetches the asset from the registry, and deploys it -- just like a free asset but with an authentication check first.

**Why this priority**: This is the core value proposition of the licensing model. Gated distribution enables the business model.

**Independent Test**: Can be fully tested by authenticating with a Pro-tier key, running `speckit deploy ./project --agents premium-research-agent`, and verifying the agent files are written to the target project.

**Acceptance Scenarios**:

1. **Given** a developer authenticated with a Pro-tier license, **When** they run `speckit deploy ./project --skills premium-skill`, **Then** the skill is fetched from the registry and deployed into the project.
2. **Given** an unauthenticated developer, **When** they attempt to deploy a premium asset, **Then** they receive a message stating the asset requires a license and instructions to run `speckit login`.
3. **Given** a developer whose license has expired, **When** they attempt to deploy a premium asset, **Then** they receive a message that their license has expired and are directed to contact sales for renewal.
4. **Given** a developer with a Pro-tier license, **When** they attempt to deploy an Enterprise-only asset, **Then** they receive a message indicating the asset requires an Enterprise subscription and see upgrade instructions.
5. **Given** a developer with a valid Pro-tier license but the requested asset is not in their entitled asset list, **When** they attempt to deploy that asset, **Then** they receive a message listing the asset as not included in their subscription and instructions to contact sales to add it.

---

### User Story 4 - Admin Issues and Revokes License Keys (Priority: P2)

An administrator at Dev Labs needs to provision a license key for a new client and later revoke it when the client's subscription ends. They manage keys through the license server so that access is controlled centrally.

**Why this priority**: Key management is essential for the business to operate. Without issuance and revocation, there is no access control.

**Independent Test**: Can be fully tested by issuing a key via the admin interface, verifying a developer can authenticate with it, then revoking the key and verifying the developer is denied access on their next deploy attempt.

**Acceptance Scenarios**:

1. **Given** an administrator with access to the license server, **When** they create a new license key for a client with a Pro tier, **Then** a unique API key is generated and associated with the client's organization, tier, and entitled assets.
2. **Given** an active license key, **When** the administrator revokes it, **Then** any developer using that key is denied access to premium assets on their next CLI command that contacts the registry.
3. **Given** an administrator viewing the license dashboard, **When** they look up a client, **Then** they see the client's active keys, tier, entitled assets, last activity timestamp, and usage count.

---

### User Story 5 - Enterprise Client Uses Stub-Based Premium Assets (Priority: P3)

An enterprise client has deployed premium skills that use thin-stub deployment. The stubs reference the registry at runtime, enabling instant revocation -- when the license is revoked, the stubs stop resolving and the premium content is no longer available.

**Why this priority**: Stub-based deployment is the strongest revocation mechanism but only needed for highest-value proprietary assets. Pro-tier gated distribution covers most cases.

**Independent Test**: Can be fully tested by deploying a stub-based skill, verifying it resolves content at runtime, then revoking the license key and verifying the stub returns a license-expired message instead of content.

**Acceptance Scenarios**:

1. **Given** an enterprise-licensed developer, **When** they deploy a premium stub-based skill, **Then** a lightweight stub file is placed in the project that references the registry for content resolution.
2. **Given** a deployed stub with an active license, **When** the stub is invoked at runtime, **Then** the full skill content is fetched from the registry, cached locally with a configurable time-to-live, and used as if it were a locally deployed file.
3. **Given** a deployed stub whose license has been revoked, **When** the stub is invoked at runtime, **Then** the system returns a clear message that the license is no longer active and the cached content is not served past its TTL expiry.
4. **Given** a deployed stub with an active license but no network connectivity, **When** the stub is invoked, **Then** the cached content is served if the cache has not expired, otherwise a connectivity error is displayed.

---

### User Story 6 - Developer Audits Licensed Assets in a Project (Priority: P3)

A developer or admin wants to understand which licensed assets are deployed in a project, their license status, and whether any licenses have expired. They run an audit command to get a full report.

**Why this priority**: Auditing supports compliance and troubleshooting but is not required for core deployment functionality.

**Independent Test**: Can be fully tested by deploying a mix of free and licensed assets into a project, running `speckit audit`, and verifying the report accurately categorizes each asset by type, license tier, and current status.

**Acceptance Scenarios**:

1. **Given** a project with deployed assets, **When** a developer runs `speckit audit`, **Then** they see a report listing every deployed asset with its name, type (agent/skill/template/package), license tier (free/pro/enterprise), and current license status (active/expired/revoked).
2. **Given** a project with no deployed assets, **When** a developer runs `speckit audit`, **Then** they see a message indicating no SpecKit assets are deployed in the project.
3. **Given** a project with expired licensed assets, **When** a developer runs `speckit audit`, **Then** expired assets are flagged with a warning and a suggestion to renew or remove them.

---

### Edge Cases

- What happens when a developer tries to deploy while offline? Free assets should deploy from the local library; licensed assets should fail with a clear offline message.
- What happens when a license key is revoked mid-deployment? The current deploy operation should complete for any assets already fetched, but subsequent fetches in the same operation should fail gracefully with a revocation notice.
- What happens when two developers on the same team use different license keys? Each developer authenticates independently; the CLI uses the locally stored key regardless of other team members.
- What happens when the registry server is down? Free assets deploy from local library. Licensed assets fail with a service-unavailable message and a suggestion to retry later.
- What happens when a cached stub expires and the developer is offline? The stub should display a message that cached content has expired and network access is required to refresh.
- What happens when an asset is both in the local free library and the premium registry? The premium version takes precedence for authenticated users; free version is used for unauthenticated users.

## Requirements _(mandatory)_

### Functional Requirements

**CLI Distribution**

- **FR-001**: System MUST provide a globally installable CLI package via npm that exposes the `speckit` command.
- **FR-002**: System MUST compile TypeScript source to JavaScript with proper shebang headers for cross-platform execution.
- **FR-003**: System MUST bundle the dashboard frontend assets alongside the CLI package so `speckit dashboard` works after global install.

**Authentication**

- **FR-004**: System MUST provide a `speckit login` command that accepts a license key and stores it in a local configuration file in the user's home directory.
- **FR-005**: System MUST provide a `speckit logout` command that removes the stored license key.
- **FR-006**: System MUST validate the license key against the license server on login and reject invalid or expired keys with a clear error message.
- **FR-007**: System MUST provide a `speckit license status` command that displays the current license tier, organization, expiration, and entitled assets.

**License Server**

- **FR-008**: System MUST provide an API for creating license keys associated with an organization, subscription tier, and set of entitled assets.
- **FR-009**: System MUST provide an API for revoking license keys so that revoked keys are rejected on all subsequent requests.
- **FR-010**: System MUST support three subscription tiers: Free (no key required), Pro (gated distribution), and Enterprise (stub-based deployment with instant revocation).
- **FR-011**: System MUST record usage metadata (last activity timestamp, total deploy count) for each license key.
- **FR-024**: System MUST require per-admin account authentication (individual credentials with login/session management) for all admin operations (key creation, revocation, client lookup).
- **FR-025**: System MUST log which admin performed each key management action for audit trail purposes.

**Registry API**

- **FR-012**: System MUST provide a registry API endpoint that serves asset content (skills, agents, templates, packages) to authenticated requests, defaulting to the latest version unless a specific version is requested.
- **FR-026**: System MUST support optional version pinning on deploy commands (e.g., `--version 1.2.0`) so clients can request a specific asset version from the registry.
- **FR-013**: System MUST reject registry requests from expired, revoked, or insufficient-tier license keys, or when the requested asset is not in the key's entitled asset list, with appropriate error codes and messages.
- **FR-014**: System MUST tag each asset in the registry with its required license tier (free, pro, enterprise).

**Gated Distribution**

- **FR-015**: System MUST allow all existing deploy commands to work without a license key for free-tier assets.
- **FR-016**: System MUST block deployment of pro or enterprise assets when no valid license key is configured, the key lacks the required tier, or the specific asset is not in the key's entitled asset list.
- **FR-017**: System MUST fetch pro-tier assets from the registry API and deploy them into the target project using the same file structure as local assets.

**Stub-Based Deployment**

- **FR-018**: System MUST support deploying enterprise assets as thin stubs that contain a registry reference instead of full content.
- **FR-019**: System MUST provide a stub resolver that fetches full content from the registry at runtime and caches it locally.
- **FR-020**: System MUST expire cached stub content based on a configurable time-to-live and re-fetch from the registry on next access.
- **FR-021**: System MUST stop serving cached stub content after TTL expiry if the license has been revoked or expired.

**Audit**

- **FR-022**: System MUST provide a `speckit audit` command that scans a project and reports all deployed assets with their license tier and status.
- **FR-023**: System MUST flag expired or revoked licensed assets in the audit report with a warning.

### Key Entities

- **License Key**: A unique credential tied to an organization. Attributes: key identifier, organization name, subscription tier, entitled asset list, creation date, expiration date, revocation status, usage metadata.
- **Asset**: A deployable unit (skill, agent, template, package). Attributes: name, type, version (semver, multiple versions retained in registry), required license tier, content (file or files), description.
- **Organization**: A client entity that holds one or more license keys. Attributes: name, contact info, active subscription tier, billing status.
- **Stub**: A lightweight file deployed into a project that references the registry for content resolution. Attributes: asset reference ID, registry endpoint, license key reference, cache TTL, last-fetched timestamp.
- **Admin Account**: An individual administrator identity with access to the license server management operations. Attributes: username, hashed credentials, role, creation date, last login, action log.
- **Audit Record**: A snapshot of deployed assets in a project. Attributes: asset name, type, license tier, deployment date, current license status.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Developers can install the CLI globally and run `speckit --version` within 60 seconds of starting the install process.
- **SC-002**: Developers can authenticate with a valid license key and see their entitlements in under 10 seconds.
- **SC-003**: Licensed assets deploy into a target project with the same file structure and reliability as free assets -- zero difference in the developer's deploy workflow.
- **SC-004**: Revoking a license key prevents all subsequent premium asset deployments for that key within 60 seconds of revocation (no key caching beyond this window).
- **SC-005**: Enterprise stub-based assets stop resolving within one TTL cycle after license revocation.
- **SC-006**: The audit command produces an accurate report of all deployed assets in under 5 seconds for projects with up to 50 deployed assets.
- **SC-007**: Free-tier assets remain fully functional with zero authentication requirements -- no regression to existing open workflows.
- **SC-008**: 100% of deploy, audit, and license commands provide clear, actionable error messages when operations fail (no silent failures or stack traces).

## Clarifications

### Session 2026-03-19

- Q: Does a license key grant access to all assets within its tier, or can entitlements be scoped to specific individual assets? → A: Tier + per-asset entitlements. A key has a subscription tier AND an explicit list of specific assets the client can access within that tier.
- Q: How are admin operations (key issuance, revocation, client lookup) protected? → A: Per-admin accounts. Each administrator has their own credentials with login/session management for the license server.
- Q: Can clients pin to a specific asset version, or does the registry always serve the latest? → A: Latest by default + optional pinning. Clients can request a specific version; the registry defaults to latest if no version is specified.

## Assumptions

- The license server will be hosted as a lightweight cloud service (assumed to be a small API with database, not a complex enterprise deployment).
- npm is the distribution channel for the CLI; no alternative package managers are supported initially.
- License keys are long-lived API tokens (not short-lived JWTs); revocation is handled server-side by marking the key as revoked.
- The local configuration file for storing the license key will reside in the user's home directory (e.g., `~/.speckit/credentials`).
- Asset versioning follows semver; the registry serves the latest version by default but supports explicit version pinning on deploy.
- Stub cache TTL defaults to 24 hours unless configured otherwise by the deploying organization.
- The admin interface for key management will initially be API-only (CLI or direct API calls) with per-admin account authentication; a web dashboard for admin can be added later.
- Free assets continue to be served from the local library bundled with the CLI; only premium assets require registry access.
