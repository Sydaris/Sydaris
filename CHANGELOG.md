# Changelog

## Unreleased

### Development tools

- Save, verify, restore, and recover complete local database/Library/parser states.
- Run isolated parsing instances with separate databases, storage, and Next build
  directories while retaining SDK-only builds and empty plugin registration.
- Document Core/downstream ownership and remove machine-specific deployment examples.

Development scripts are ported through downstream `1619afa`; they do not add
View plugins or publish packages. The application retains its existing alpha
release version until a release is explicitly prepared.

### Tool and interaction reliability

- Enforce portable object-envelope tool schemas and Skill action activation gates.
- Expose generic View operations, evidence-backed change reactions, retry controls,
  and conversation notices through the Runtime and SDK.
- Separate answer completion from persistence, preserve conversation sessions across
  navigation, and use server-owned message positions for concurrent chat writes.
- Refresh explicitly requested View snapshots instead of returning stale state.

Ported through downstream `1619afa`. This batch adds two migrations: evidence
fields on View reactions, and a unique per-conversation message position with a
server sequence. The sequence migration repairs legacy duplicate positions while
preserving message content; back up the database and run `pnpm prisma:deploy`
before starting the new application.

### Recoverable compilation and memory continuity

- Recover interrupted Library compilation and rebuild Assertion indexes after
  restarts or temporary embedding-service failures.
- Resolve document objects from explicit evidence links and identity hints.
- Preserve Actor/Object memory continuity and record shared/private Higher Memory
  maintenance outcomes in the conversation's operational receipt.
- Unify model thinking and structured-output configuration across the TypeScript
  and Python runtimes.

Ported through downstream `ad0dc7e`. Apply migrations with `pnpm prisma:deploy`
before starting the updated application. The two additive migrations create the
Assertion index recovery job and add Higher Memory maintenance receipt fields;
they do not rebuild or clear existing organization data.

### Agent Runtime and library intake

- Compose multiple Skills in one turn, enforce their declared View and resource
  access, and attribute Command authorization to the responsible Skill.
- Separate static View definitions, observed state, and evidence coverage. Govern
  streamed answers with a capability ledger, answer verification, and progress guards.
- Add a built-in Library triage Skill, ignore import noise, and support authenticated
  MinerU API parsing alongside the local parser.
- Improve chat composition, completion status, and error presentation.
- Extend the SDK with resource access contracts (`0.1.0-alpha.9`).

These changes are ported from association-management through `7eb5e90`, using its
`0ee01cd` core as the source baseline for the existing Sydaris alpha snapshot.
View plugins, presentations, organization assets, and plugin installation defaults
remain outside this repository. Runtime regression tests use synthetic contracts.

This batch does not change the database schema. See `.env.example` for optional
MinerU API settings and Agent timeout/progress controls.
