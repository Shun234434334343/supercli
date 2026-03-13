# Feature Gaps

Comparison of the current release versus the broader capability-mesh vision from the latest brainstorming notes.

| Feature name | Description | Why it matters |
| --- | --- | --- |
| Unified capability registry service | Dedicated registry service that persists capability metadata, ownership, and lifecycle events outside the CLI runtime. | Enables organization-wide discovery, policy management, and sharing without relying on a single CLI process or local cache. |
| Capability graph traversal API | Graph-native search endpoints ("related capabilities", capability clustering, semantic tags). | Agents can explore neighboring capabilities, infer dependencies, and auto-complete workflows instead of executing isolated commands. |
| Mesh-wide governance & policy | Central rules for authentication, rate limits, approvals, and auditing across every harness/adapter. | Provides enterprise-grade controls so teams can safely expose sensitive CLIs/APIs without bespoke wrappers. |
| Execution DAG orchestration | First-class scheduler for multi-capability plans with retries, checkpoints, and observability hooks. | Bridges `plan/execute` concepts with reliable automation, turning plans into production-grade workflows. |
| Agent-facing HTTP interface | Stable HTTP/WebSocket endpoints that mirror CLI capabilities for direct agent/automation consumption. | Lets agents integrate via simple API calls rather than shelling out to the CLI, unlocking server-side agents and SaaS integrations. |
| Capability composition toolkit | Declarative way to package multiple capabilities into composites or workflows that publish as new capabilities. | Encourages reuse, accelerates plugin development, and aligns with the capability mesh abstraction where every composite is also a capability. |
| Telemetry & lineage for capabilities | Built-in tracing, metrics, and history for each capability invocation and plan. | Makes it possible to reason about reliability, enforce governance, and debug agent runs across heterogeneous tools. |
| Plugin certification & discovery UX | Registry UX for tagging, ranking, and validating community plugins directly in `supercli plugins explore`. | Reduces trust friction for third-party harnesses and makes the discovery narrative match the README's emphasis on capabilities-first exploration. |

These gaps represent future-facing opportunities rather than committed roadmap items; they document the delta between today's shipping features and the aspirational capability-mesh direction.
