# Changelog

## Unreleased

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
