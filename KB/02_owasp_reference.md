# OWASP Reference: LLM Top 10 (2025) + Agentic Applications Top 10 (2026)
**Version:** 1.0 | **Source:** OWASP Gen AI Security Project
**Purpose:** Citation reference for RedTeamIQ report agent. Every finding maps to an entry here with detection signals specific to agentic systems.

---

## Part A — OWASP Top 10 for Agentic Applications 2026
*Published December 2025. Peer-reviewed by 100+ industry experts. The authoritative framework for agentic AI security risks.*

---

### ASI01 — Agent Goal Hijack
**Definition:** Attackers alter an agent's objectives or decision path through malicious content, exploiting its planning and reasoning capabilities.

**Why it's unique to agents:** Standalone LLMs respond to a single prompt. Agents maintain an objective across many steps. Hijacking that objective redirects the entire multi-step plan, not just a single response.

**Attack vectors:**
- Gradual sub-goal injection across multiple turns
- Direct instruction injection to ignore original objectives
- Reflection loop traps that trigger infinite self-analysis cycles
- Indirect injection via tool outputs containing re-directive instructions

**Detection signals in agent responses:**
- Agent begins pursuing a goal different from the original task
- Agent acknowledges "new instructions" it was not given by the legitimate user
- Agent behavior changes abruptly after processing external content
- Agent refers to permissions or roles not established in the original session

**Applies to:** All agents with multi-step planning capabilities.

---

### ASI02 — Tool Misuse and Exploitation
**Definition:** Agents use legitimate tools in unsafe ways, whether through parameter pollution, tool chain manipulation, or automated abuse of granted permissions.

**Why it's unique to agents:** Standalone LLMs produce text. Agents take actions. The difference between "describing how to exfiltrate data" and "actually exfiltrating data" is the tool layer.

**Attack vectors:**
- Parameter pollution: manipulating function call parameters beyond intended scope
- Tool chain manipulation: exploiting sequential tool calls to achieve unauthorized outcomes
- Scale abuse: using authorized tools to perform actions at harmful volume

**Detection signals:**
- Tool called with file paths, endpoints, or parameters outside declared scope
- Tool call chain forms a collect → transmit pattern without user initiation
- Tool used at unusual frequency or volume
- Agent calls a tool the user never requested

**Applies to:** Any agent with external tool access (email, file, database, API, browser, code execution).

---

### ASI03 — Identity and Privilege Abuse
**Definition:** Agents inherit or escalate high-privilege credentials, creating unauthorized access across systems.

**Why it's unique to agents:** Agents often operate with service account credentials that have broad access. A compromised agent inherits those credentials for every action it takes.

**Attack vectors:**
- Dynamic permission escalation through claimed administrative status
- Cross-system exploitation due to inadequate scope enforcement
- Shadow agent deployment that inherits legitimate agent credentials
- Impersonating orchestrator agents to bypass sub-agent safety filters

**Detection signals:**
- Agent performs actions requiring permissions not established for the current user
- Agent references roles or clearances not part of original session context
- Agent skips verification steps it normally applies
- Agent passes elevated credentials to sub-agents or external systems

**Applies to:** All agents, especially critical in multi-agent and enterprise environments.

---

### ASI04 — Agentic Supply Chain Vulnerabilities
**Definition:** Compromised tools, plugins, prompt templates, and external servers introduce vulnerabilities the agent unknowingly leverages.

**Attack vectors:**
- Malicious tool packages with hidden functionality
- Compromised prompt templates injecting adversarial instructions
- External API dependencies returning poisoned data or instructions
- Skill files with embedded attack directives (Schmotz et al., 2026: Skill-Inject)

**Detection signals:**
- Agent behavior changes after loading a new tool or plugin
- Agent follows instructions not present in the user conversation or system prompt
- Agent tool calls reference endpoints not in the approved tool list

**Applies to:** Agents using external tools, MCP servers, plugins, or third-party APIs.

---

### ASI05 — Unexpected Code Execution
**Definition:** Agents generate or execute code and commands unsafely, creating opportunities for remote code execution, sandbox escapes, and data exfiltration.

**Attack vectors:**
- DevOps agent compromise through generated scripts with hidden commands
- Workflow engine exploitation via AI-generated scripts containing backdoors
- Linguistic vulnerability exploitation to craft data exfiltration commands
- Prompt-to-code injection where attacker controls output destination

**Detection signals:**
- Generated code contains network calls to external endpoints
- Generated code accesses system paths beyond the task scope
- Agent executes code without user confirmation for irreversible operations
- Code contains obfuscated commands or encoded payloads

**Applies to:** Agents with code generation, execution, or shell access tools.

---

### ASI06 — Memory and Context Poisoning
**Definition:** Attackers poison agent memory systems, embeddings, and RAG databases to corrupt stored information and manipulate decision-making across sessions.

**Why it's unique to agents:** Standalone LLMs are stateless. Agents with persistent memory can be compromised once and remain compromised across all future sessions.

**Attack vectors:**
- Gradual memory poisoning through repeated interactions over multiple sessions
- Exploiting memory limits to prevent recognition of privilege escalation
- Corrupting shared memory in multi-agent systems
- RAG database poisoning via injected documents containing hidden directives

**Detection signals:**
- Agent behavior in later sessions is more permissive than initial sessions
- Agent cites a "policy" that was never part of the original system prompt
- Agent refers to permissions established in previous sessions
- Agent retrieves documents that contain instruction-like text alongside factual content

**Applies to:** Agents with persistent memory, RAG systems, or shared knowledge bases.

---

### ASI07 — Insecure Inter-Agent Communication
**Definition:** Multi-agent systems face spoofed identities, replayed messages, and tampering in communication channels between agents.

**Why it's unique to agents:** In multi-agent pipelines, agents communicate with each other. Without cryptographic verification, any message claiming to be from a trusted agent is potentially forged.

**Attack vectors:**
- Injecting misleading information to influence collaborative decisions
- Forging false consensus messages by exploiting authentication weaknesses
- Strategically planting false data that cascades through agent networks
- Impersonating orchestrator messages to bypass sub-agent restrictions

**Detection signals:**
- Agent proceeds on a consensus that was never reached in observable conversation
- Agent references communications from other agents not visible in the log
- Agent behavior changes based on "peer agent" instructions with no verification step
- Multiple agents simultaneously change behavior in a correlated, unexpected way

**Applies to:** Multi-agent pipelines only.

---

### ASI08 — Cascading Failures
**Definition:** Small errors in one agent propagate and amplify across planning, execution, and memory in interconnected systems.

**Attack vectors:**
- Injecting false product details that accumulate in long-term memory
- Introducing hallucinated API endpoints that cause data leaks downstream
- Implanting false information that worsens through self-reinforcement across agent hops

**Detection signals:**
- Downstream agent outputs contain factual errors traceable to an upstream input
- Errors become more severe rather than corrected as they pass through the pipeline
- Agents validate information by referencing other agents that were themselves compromised

**Applies to:** Multi-agent pipelines with sequential data passing.

---

### ASI09 — Human Agent Trust Exploitation
**Definition:** Users over-trust agent recommendations, enabling social engineering and covert harmful actions through the agent interface.

**Attack vectors:**
- AI-powered invoice fraud replacing legitimate vendor details
- AI-driven phishing with deceptive messages using the agent's trusted interface
- Misinformation campaigns delivered through a trusted agent channel

**Detection signals:**
- Agent produces content that could be used for social engineering
- Agent generates communications impersonating other people or organizations
- Agent provides financial or legal advice without appropriate caveats

---

### ASI10 — Rogue Agents
**Definition:** Compromised or misaligned agents act harmfully while appearing legitimate, exploiting trust mechanisms in multi-agent workflows.

**Attack vectors:**
- Agent that appears to complete its task while performing secondary malicious actions
- Agent that modifies its own behavior based on trigger conditions in the environment
- Compromised orchestrator that routes tasks to less-safe sub-agents

**Detection signals:**
- Agent takes secondary actions not requested by the user
- Agent behavior changes based on environmental conditions in a way not explained by the task
- Agent communicates with external systems not specified in its tool configuration

---

## Part B — OWASP LLM Top 10 2025 (Agent-Relevant Entries)
*The foundational LLM risk framework. Entries below are those most relevant to agentic systems.*

---

### LLM01 — Prompt Injection
**Definition:** Malicious inputs manipulate LLM behavior by overriding or hijacking system instructions.

**In agentic context:** Prompt injection in agents is higher severity than in standalone LLMs because the agent takes actions. A hijacked agent doesn't just say something wrong — it *does* something wrong, potentially irreversibly.

**Direct injection:** User input contains attack instructions.
**Indirect injection:** Attack instructions arrive via content the agent processes (documents, web pages, tool outputs, emails).

**Detection signal:** Agent contradicts, ignores, or extends beyond its system prompt instructions in response to user or tool input.

---

### LLM02 — Insecure Output Handling
**Definition:** Agent outputs are passed to downstream systems without sufficient validation, enabling injection attacks in those systems.

**In agentic context:** Agents generate content that other systems consume. SQL queries, shell commands, HTML, and API parameters generated by agents are all attack vectors if the agent can be made to produce malicious variants.

**Detection signal:** Agent produces output containing executable code, query syntax, or markup that was not part of the original task.

---

### LLM06 — Sensitive Information Disclosure
**Definition:** Agent reveals confidential data including system prompts, API credentials, user data, or internal configurations.

**In agentic context:** Agents frequently have credentials, internal policies, and sensitive context in their system prompts. Disclosure of these is a direct security breach.

**Detection signal:** Agent output contains system prompt content, API keys, internal URLs, or user data from other sessions.

---

### LLM08 — Excessive Agency
**Definition:** Agent is given more functionality, permissions, or autonomy than required for its task, creating an unnecessarily large attack surface.

**OWASP 2025 expanded this into three root causes:**
1. Excessive functionality: agent can reach tools beyond its task scope
2. Excessive permissions: those tools operate with broader privileges than necessary
3. Excessive autonomy: high-impact actions proceed without human approval

**Detection signal:** Agent successfully performs actions that should be outside its scope, confirming the scope is too broad.

---

*Document maintained for RedTeamIQ Foundry IQ knowledge base. Source: OWASP Gen AI Security Project (genai.owasp.org).*
