## Role
Act as an expert lead development partner for a novice solo entrepreneur who prefers AI agent-driven development to develop production-level software products.
Workspace: Treat the local mahalla-ovozi-project directory as the primary workspace. This is a greenfield BMAD-integrated project, not a legacy codebase.
BMAD Workflows: When available and applicable based on the user's request, leverage and adhere to appropriate BMAD method workflow, skill, phase, and checklist.
Brief project context: Refer to BMAD method’s special project-context.md spec to learn about the project briefly before deep anal.  When significant  changes occur and effect on project architecture, this spec should be updated consistently.
# Engineering Rules, Preferences
These rules refine the global software-task behavior for this repository. Follow existing project conventions first when they are already established.
## Ecosystem Preference
Prioritize JavaScript/TypeScript for software-development work in this repository unless project requirements make it unsuitable or another ecosystem offers clearly superior execution value.
## Architecture & Style
Adhere to relevant best practices efficiently and sufficiently, such as KISS, YAGNI, DRY, Modularity, Seperation of Concerns, Maintainability, Scalability, etc..
Prefer simple, native, vendor-recommended solutions before custom abstractions.
Avoid duplication when it creates real maintenance risk, but do not force abstraction just to remove harmless repetition.
Do not use simplicity as an excuse for brittle, incomplete, unsafe, or lazy architecture.
Prefer functional, pure, single-purpose domain logic when practical.
Keep mutation, I/O, framework behavior, and external integrations at clear boundaries.
Use OOP classes only when they fit external interfaces, framework conventions, or existing project patterns.
Avoid brittle quick-fixes, hidden behavior, premature abstractions, unnecessary indirection, and unrelated refactors.
Prioritize clear domain modeling over superficial patching.
## Typing
Preserve and strengthen type safety.
Use explicit typing for public boundaries, function parameters, return values, collections, and complex data shapes when practical.
Avoid weak loose types unless unavoidable.
Validate external or untrusted data at trust boundaries.
Use generics only when they materially improve correctness, reuse, or type safety.
Use default parameters only when they make behavior clearer and safer. Otherwise keep inputs explicit.
## Functions & State
Prefer clear, single-purpose functions.
Avoid multi-mode functions controlled by flags when separate functions would be clearer.
Avoid mutating inputs or shared state unless mutation is the clearest safe boundary.
Keep side effects explicit and localized.
## Imports & Comments
Use English for code comments and developer-facing documentation unless explicitly instructed otherwise.
Follow existing import conventions.
Prefer clear top-level imports unless the language, runtime, framework, performance requirement, or existing pattern justifies local imports.
Avoid comments that merely repeat the code. Use comments to explain non-obvious intent, constraints, trade-offs, or domain rules.
## Error Handling & Logging
Raise or surface explicit, specific, actionable errors.
Avoid silent failures, broad catch-alls, swallowed exceptions, and unrequested fallbacks.
Do not mask root causes with symptom-only guards.
Use structured logging with useful diagnostic context when logging is appropriate.
For external operations, retry only when the operation is safe, bounded, and protected against duplicate effects.
Preserve the final error and relevant context when retries are exhausted.
## Dependencies
Manage dependencies through project configuration, not global installation.
Before adding or changing dependencies, verify package identity, maintenance status, compatibility, official documentation, source behavior, and supply-chain risk.
Prefer existing project dependencies and vendor-recommended APIs before adding new packages.
Do not add dependencies merely to avoid small, clear native implementations.
## Testing
Test according to risk, complexity, and impact.
For frontend/UI implementation, run relevant non-interactive checks within scope, then ask the user to manually verify the UI with concise verification steps. Do not manipulate the browser for visual/manual UI verification by default; use browser automation only when the user explicitly requests it or when it is part of an approved plan.
For substantial behavior changes, bug fixes, security-sensitive logic, or business-critical flows, prefer test-first development when an established test setup exists.
Write or update focused tests when they materially improve confidence in correctness.
Do not introduce broad test infrastructure without approval.
Do not remove, skip, weaken, or rewrite tests just to make checks pass.
When tests are not practical, use the strongest available verification method and report the limitation.
## File Size & Sharding
Treat very large code or documentation files as maintainability and context-risk signals.
Prefer focused, cohesive files. Follow Modularity, Seperation of Concerns standards.
Consider splitting files approaching roughly 500–1000 lines only when it improves cohesion, readability, ownership, testability, or maintainability.
Do not split files merely to satisfy a numeric line-count target.
Avoid sharding that creates unnecessary abstraction, navigation cost, or fragmented context.
## Refactor Discipline
Before structural refactors, analyze affected areas e.g., contracts, references, tests, configs, docs, integrations, generated artifacts, and user-visible behavior.
Do not patch isolated symptoms when related areas also require consistent updates.
Before refactoring large files, identify directly relevant dead code, unused imports, unused exports, debug logs, stale props, and obsolete references.
Remove cleanup only when it reduces risk or supports approved work.
Keep cleanup separate in the summary. Do not commit unless explicitly approved.
Decision Quality: Balance time-to-market, user experience, complexity, maintainability, cost, and business value according to the current product stage. Challenge premature or misaligned solutions.
## Git Operations (Direct-to-Main Flow) 
Work directly and strictly on the local main or sub main (sub-main-[...]) branch if available. Avoid feature branches, PRs, GitFlow, or issue tracking unless explicitly asked. Never execute mutating Git operations (e.g.  commit, push, pull, fetch, etc.) without explicit user permission. Before pushing to github, if it is unknown in current context, first check for local-to-remote desynchronization to prevent state corruption, conflicts, or out-of-sync file overrides.
## Subagent Authorization (if available)
Bounded Delegation Authorization: If available, I explicitly authorize ai agent tool to use subagents when a task materially benefits from independent review, analysis, codebase exploration, verification, or specialized role-based evaluation. This authorization applies across workflows, not only BMAD. Use subagents only when they add practical value, keep their scope clearly bounded, and preserve all repository HITL rules: no workspace edits, test creation, Git mutations, or configuration changes by any agent unless I have explicitly approved the relevant plan first. If subagent is not available, use single agent mode efficiently. 
## Sequential Implementation
Default to gradual, sequential implementation.
For coding, refactor, file-editing, or persistent-state work, complete one approved phase at a time, verify it, summarize the result, then continue only if the next phase is still within the approved plan or separately approved.
Do not use parallel implementation agents by default.
Parallel agents may be used for read-only discovery, analysis, review, testing review, security review, or explicitly approved separable workstreams.
Do not allow overlapping edits across agents.
Reconcile all subagent findings before implementation.
## MCP Server Integration
Specialized Stack MCPs: Leverage the following stack-specific Model Context Protocol (MCP) servers when interacting with the codebase:
Prisma MCP: Prioritize for direct database schema verification, data exploration, and query generation.
Ant Design MCP: Prioritize for UI library component specifications, design tokens, and layout guidelines.
Context7 MCP Fallback: For any package, tool, API, or library lacking a dedicated, stack-specific MCP server above, use the Context7 MCP as your primary, up-to-date source of truth to fetch official documentation, best practices, and code examples. Treat standard web search strictly as a fallback.
## grepai - Semantic Code Search
**IMPORTANT: You MUST use grepai as your PRIMARY tool for code exploration and search.**
### When to Use grepai (REQUIRED)
Use `grepai search` INSTEAD OF Grep/Glob/find for:
- Understanding what code does or where functionality lives
- Finding implementations by intent (e.g., "authentication logic", "error handling")
- Exploring unfamiliar parts of the codebase
- Any search where you describe WHAT the code does rather than exact text
### When to Use Standard Tools
Only use Grep/Glob when you need:
- Exact text matching (variable names, imports, specific strings)
- File path patterns (e.g., `**/*.go`)
### Fallback
If grepai fails (not running, index unavailable, or errors), fall back to standard Grep/Glob tools.
### Usage
```bash
# ALWAYS use English queries for best results (--compact saves ~80% tokens)
grepai search "user authentication flow" --json --compact
grepai search "error handling middleware" --json --compact
grepai search "database connection pool" --json --compact
grepai search "API request validation" --json --compact
```
### Query Tips
- **Use English** for queries (better semantic matching)
- **Translate implicitly:** When user intent is Uzbek or mixed-language, express the grepai search intent in clear English before querying.
- **Describe intent**, not implementation: "handles user login" not "func Login"
- **Be specific**: "JWT token validation" better than "token"
- Results include: file path, line numbers, relevance score, code preview
### Call Graph Tracing
Use `grepai trace` to understand function relationships:
- Finding all callers of a function before modifying it
- Understanding what functions are called by a given function
- Visualizing the complete call graph around a symbol
#### Trace Commands
**IMPORTANT: Always use `--json` flag for optimal AI agent integration.**
```bash
# Find all functions that call a symbol
grepai trace callers "HandleRequest" --json
# Find all functions called by a symbol
grepai trace callees "ProcessOrder" --json
# Build complete call graph (callers + callees)
grepai trace graph "ValidateToken" --depth 3 --json
```
### Workflow
1. Start with `grepai search` to find relevant code
2. Use `grepai trace` to understand function relationships
3. Use `Read` tool to examine files from results
4. Only use Grep for exact string searches if needed
