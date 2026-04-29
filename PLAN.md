# Modularized Agent Workflow UI - Implementation Plan

## Context

We're building a dynamic frontend that connects to CAI Agent Studio hosted workflows. Each workflow has different input requirements (text, files, JSON, conversation). The UI discovers input schemas at runtime from the workflow API and renders appropriate components. This replaces the need for per-workflow custom UIs.

The backend API is already running (CAI Agent Studio). We're building a standalone Next.js app that talks to it via a proxy layer.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 14 (App Router) | Matches CAI Studio, API routes for proxy |
| Language | TypeScript (strict) | Type safety for dynamic input system |
| Styling | Tailwind CSS 3 | Utility-first, easy to implement DESIGN.md tokens |
| State | Zustand | 3 small stores vs Redux boilerplate for 5 endpoints |
| JSON Editor | Monaco Editor (`@monaco-editor/react`) | Rich JSON editing with validation |
| Markdown | `react-markdown` + `remark-gfm` | Render workflow output |
| Icons | `lucide-react` | Lightweight, consistent |
| Fonts | Inter (SF Pro substitute, open-source) | Closest to SF Pro without licensing |

---

## Project Structure

```
modularized_agent_ui/
├── app/
│   ├── layout.tsx                    # Root layout, fonts, global styles
│   ├── page.tsx                      # Landing/connect page
│   ├── workflow/
│   │   └── page.tsx                  # Main workflow interaction page
│   ├── api/
│   │   └── proxy/
│   │       └── [...path]/
│   │           └── route.ts          # API proxy to workflow backend
│   └── globals.css                   # Tailwind + Apple design tokens
├── components/
│   ├── ui/                           # Design system primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── GlassNav.tsx
│   │   └── Section.tsx
│   ├── connect/
│   │   └── ConnectForm.tsx           # Workflow URL + API key entry
│   ├── inputs/                       # Modular input system
│   │   ├── InputRenderer.tsx         # Routes input name -> component
│   │   ├── TextInput.tsx             # Single-line text
│   │   ├── TextAreaInput.tsx         # Multi-line text
│   │   ├── JsonEditorInput.tsx       # Monaco JSON editor
│   │   ├── FileUploadInput.tsx       # File drag-drop + upload
│   │   └── inferInputType.ts         # Name -> type inference engine
│   ├── chat/                         # Conversation mode
│   │   ├── ChatView.tsx              # Chat container
│   │   ├── ChatMessage.tsx           # Single message bubble
│   │   └── ChatInput.tsx             # Message input bar
│   ├── events/                       # Execution monitoring
│   │   ├── EventTimeline.tsx         # Scrollable event list
│   │   ├── EventCard.tsx             # Single event display
│   │   └── EventBadge.tsx            # Event type indicator
│   ├── output/
│   │   └── WorkflowOutput.tsx        # Final result display (markdown)
│   └── workflow/
│       └── WorkflowShell.tsx         # Orchestrates inputs -> execution -> output
├── lib/
│   ├── api.ts                        # Typed API client
│   ├── types.ts                      # All TypeScript interfaces
│   ├── fileUpload.ts                 # Base64 chunked upload (from reference)
│   └── constants.ts                  # Event types, input type patterns
├── stores/
│   ├── workflowStore.ts              # Workflow config, connection, inputs
│   ├── eventStore.ts                 # Events, polling state, trace ID
│   └── chatStore.ts                  # Chat messages, conversation context
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── DESIGN.md                         # (existing)
```

---

## Architecture

### 1. API Proxy (`app/api/proxy/[...path]/route.ts`)

All requests to the workflow backend route through this proxy to:
- Avoid CORS issues
- Keep API key server-side
- Rewrite paths transparently

```
Browser: POST /api/proxy/workflow/kickoff
  -> headers: X-Workflow-URL, X-API-Key (from client)
  -> Proxy: POST {workflowUrl}/api/workflow/kickoff + Authorization: Bearer {apiKey}
```

Supports GET, POST, and handles streaming for file upload/download.

### 2. Input Type Inference Engine (`components/inputs/inferInputType.ts`)

Maps workflow input names to UI component types via priority-sorted regex rules:

```typescript
type InputFieldType = 'text' | 'textarea' | 'json' | 'file';

const rules: { pattern: RegExp; type: InputFieldType }[] = [
  { pattern: /attach|file|upload|document|image|pdf/i, type: 'file' },
  { pattern: /json|config|payload|schema|object/i, type: 'json' },
  { pattern: /description|prompt|content|message|body|text|note/i, type: 'textarea' },
];

// Default: 'text' if no pattern matches
```

This is the core of the "modularized" concept - the same UI adapts to any workflow.

### 3. State Management (3 Zustand Stores)

**workflowStore** - Connection + schema:
- `workflowUrl`, `apiKey`, `isConnected`
- `workflowData` (full config from GET /api/workflow)
- `inputs: Record<string, any>` (current input values)
- `sessionId`, `sessionDirectory`
- Actions: `connect()`, `setInput()`, `resetInputs()`

**eventStore** - Execution tracking:
- `traceId`, `events: WorkflowEvent[]`, `isRunning`
- `crewOutput` (final result)
- Actions: `startExecution()`, `addEvents()`, `stopExecution()`

**chatStore** - Conversation mode:
- `messages: ChatMessage[]`, `userInput`
- Actions: `addMessage()`, `clearMessages()`

### 4. Event Polling

```
kickoff() -> trace_id -> setInterval(fetchEvents, 1000)
  -> each poll: GET /events?trace_id=X -> append new events
  -> detect terminal: crew_kickoff_completed | crew_kickoff_failed -> stop polling
```

### 5. Conversational Mode Detection

The `workflow.is_conversational` boolean on the Workflow object controls mode. When true:
- Hide structured input form
- Show ChatView instead
- Kickoff sends `{ user_input: "...", context: JSON.stringify(messageHistory) }`
- On completion, append assistant message with crew output

---

## Pages & Views

### Page 1: Connect (`app/page.tsx`)
- Dark hero section, centered
- Headline: "Agent Workflow" (56px, semibold, tight tracking)
- Two inputs: Workflow URL, API Key
- "Connect" pill button (Apple Blue #0071e3)
- On connect: calls GET /api/workflow -> stores config -> navigates to /workflow

### Page 2: Workflow Interaction (`app/workflow/page.tsx`)
- **GlassNav** top bar: workflow name, connection status, "Disconnect" link
- **Split layout** below nav:
  - **Left panel (40%)** - Light (#f5f5f7) background:
    - Dynamically rendered input fields from `InputRenderer`
    - "Run Workflow" CTA button (Apple Blue)
    - OR ChatView if `is_conversational`
  - **Right panel (60%)** - Dark (#000) background:
    - EventTimeline showing real-time execution progress
    - When complete: WorkflowOutput with markdown-rendered result
- On mobile: stacks vertically (inputs top, events bottom)

---

## Implementation Phases

### Phase 1: Project Scaffold + Design Tokens
**Files:** `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`

- `npx create-next-app@latest` with TypeScript, Tailwind, App Router
- Configure Tailwind with Apple design tokens from DESIGN.md:
  - Colors: `apple-blue`, `near-black`, `light-gray`, surface variants
  - Font: Inter with tight tracking and optical size scale
  - Border radius: `micro(5)`, `standard(8)`, `comfortable(11)`, `pill(980)`
- Root layout with Inter font, dark/light section CSS

### Phase 2: UI Primitives
**Files:** `components/ui/Button.tsx`, `Input.tsx`, `Card.tsx`, `GlassNav.tsx`, `Section.tsx`

- Button: primary (blue), dark, pill-link, with hover/focus states
- Input: text field with Apple styling (subtle border, focus ring)
- Card: light/dark variants, optional shadow
- GlassNav: translucent dark bar with backdrop-filter blur
- Section: full-width dark/light containers

### Phase 3: Types + API Client + Proxy
**Files:** `lib/types.ts`, `lib/constants.ts`, `lib/api.ts`, `lib/fileUpload.ts`, `app/api/proxy/[...path]/route.ts`

Types:
```typescript
interface WorkflowConfig {
  workflow: { workflow_id: string; name: string; is_conversational: boolean };
  agents: AgentMetadata[];
  tasks: TaskMetadata[];  // tasks[].inputs: string[]
  toolInstances: ToolInstance[];
}
interface WorkflowEvent {
  type: string; timestamp: string; agent_studio_id?: string;
  // + event-specific fields
}
```

API client: `fetchWorkflow()`, `createSession()`, `kickoff()`, `getEvents()`, `uploadFile()`

Proxy route: catch-all `[...path]` that forwards to workflow URL with auth header.

### Phase 4: Zustand Stores + Connect Page
**Files:** `stores/workflowStore.ts`, `stores/eventStore.ts`, `stores/chatStore.ts`, `components/connect/ConnectForm.tsx`, `app/page.tsx`

- Three stores with typed actions
- Connect page: dark hero, URL + key inputs, connect button
- On connect: fetch workflow config, extract inputs via `getTaskInputs()` pattern, navigate to /workflow

### Phase 5: Dynamic Input System
**Files:** `components/inputs/inferInputType.ts`, `InputRenderer.tsx`, `TextInput.tsx`, `TextAreaInput.tsx`, `JsonEditorInput.tsx`, `FileUploadInput.tsx`

- `inferInputType(name: string) -> InputFieldType` - regex rule engine
- `InputRenderer` maps each workflow input to the correct component
- FileUploadInput: drag-drop zone, calls `uploadFile()` (chunked base64), stores returned `file_path` as input value
- JsonEditorInput: Monaco editor with JSON syntax, validation

### Phase 6: Execution + Event Timeline
**Files:** `components/events/EventTimeline.tsx`, `EventCard.tsx`, `EventBadge.tsx`, `components/output/WorkflowOutput.tsx`, `components/workflow/WorkflowShell.tsx`

- WorkflowShell: orchestrator component
  1. Shows dynamic inputs (or chat) on left
  2. On "Run": calls `kickoff({ inputs })` -> gets `trace_id`
  3. Starts 1s polling of `/events?trace_id=X`
  4. Streams events into EventTimeline on right
  5. On `crew_kickoff_completed`/`crew_kickoff_failed`: stops polling, shows output

- EventTimeline: scrollable list, auto-scrolls to bottom
- EventCard: icon + label per event type (agent started, tool used, LLM called, etc.)
- EventBadge: colored pill per event category
- WorkflowOutput: markdown-rendered final result

Event types:
```
task_started, task_completed,
agent_execution_started, agent_execution_completed, agent_execution_error,
tool_usage_started, tool_usage_finished, tool_usage_error,
llm_call_started, llm_call_completed, llm_call_failed
```

### Phase 7: Chat Mode
**Files:** `components/chat/ChatView.tsx`, `ChatMessage.tsx`, `ChatInput.tsx`

- Detected via `workflow.is_conversational === true`
- Replaces the structured input panel
- Messages: user bubbles (right, blue) + assistant bubbles (left, dark surface)
- On send: kickoff with `{ user_input, context: JSON.stringify(history) }`
- On completion: append assistant message with crew output
- Event timeline still shows on the right panel during execution

### Phase 8: Polish + Responsive
- Loading skeletons during connect and execution
- Error states with retry
- Responsive: split panel -> stacked on mobile (< 834px)
- Keyboard: Enter to submit, Cmd+Enter for multiline
- LocalStorage: persist last workflow URL (not API key)
- Smooth transitions between states (connecting -> input -> running -> complete)

---

## CAI Deployment (Hosting as a CML Application)

The final goal is to deploy this Next.js app as a **Cloudera AI (CML) Application** — a long-running containerized service that gets a public URL, automatic DNS, and SSL termination from the platform.

### CAI Application Model

CML Applications run in Kubernetes pods with:
- A **public URL**: `<app-name>.<CDSW_DOMAIN>` (e.g., `agent-ui.ml.example.cloudera.site`)
- Traffic routed to `CDSW_APP_PORT` (default `8080`) inside the container
- No root access — all installs go to `~/.local/` or the project venv
- Environment variables injected at runtime (`CDSW_PROJECT_ID`, `CDSW_DOMAIN`, `CDSW_APP_PORT`, etc.)
- Persistent project storage at `/home/cdsw/`

### Additional Project Structure

```
modularized_agent_ui/
├── cai/
│   ├── launch_app.py              # CML job entry point (Python required by CAI)
│   ├── launch_app.sh              # Shell wrapper: build + start Next.js
│   ├── setup_environment.py       # Install Node.js, npm deps in user space
│   ├── app_config.yaml            # CAI application settings (resources, runtime)
│   └── nginx.conf                 # Reverse proxy: 8080 -> Next.js 3000
├── .env.production.template       # Template for CAI env vars
└── next.config.ts                 # (existing, updated for basePath/output)
```

### Architecture: CAI → Next.js

```
Internet → CAI DNS (port 443, SSL)
  → CML Pod (port 8080)
    → nginx (port 8080, reverse proxy)
      → Next.js standalone server (port 3000)
```

nginx is needed because:
- CAI expects traffic on `CDSW_APP_PORT` (8080)
- Next.js defaults to 3000
- nginx handles static asset caching, gzip, and health check endpoint for CAI

### Configuration: `cai/app_config.yaml`

```yaml
application:
  name: "agent-workflow-ui"
  subdomain: "agent-ui"           # -> agent-ui.<CDSW_DOMAIN>
  description: "Modularized Agent Workflow UI"

resources:
  cpu: 2
  memory: 4                        # GB — enough for Node.js + Next.js build

runtime:
  identifier: "docker.repository.cloudera.com/.../ml-runtime-pbj-workbench-python3.11-standard:2026.01.1-b6"

environment:
  NODE_VERSION: "20"
  NEXT_TELEMETRY_DISABLED: "1"
  # These are set at runtime by the user/admin:
  # WORKFLOW_BACKEND_URL: "https://workflow-head.ml.example.cloudera.site"
  # WORKFLOW_API_KEY: "<from CML env vars or secrets>"
```

### Environment Variables

| Variable | Source | Purpose |
|----------|--------|---------|
| `CDSW_APP_PORT` | CML (auto) | Port CAI routes traffic to (8080) |
| `CDSW_DOMAIN` | CML (auto) | Platform domain for DNS |
| `CDSW_PROJECT_ID` | CML (auto) | Project identifier |
| `WORKFLOW_BACKEND_URL` | User config | Default workflow backend URL (optional, pre-fills connect form) |
| `WORKFLOW_API_KEY` | User config | Default API key (optional, skips connect page if both set) |
| `NEXT_PUBLIC_BASE_PATH` | Build time | Base path if app is served under a subpath |

### `next.config.ts` Changes

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',            // Self-contained build (no node_modules at runtime)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  env: {
    WORKFLOW_BACKEND_URL: process.env.WORKFLOW_BACKEND_URL || '',
  },
};
```

`output: 'standalone'` is critical — it produces a self-contained `server.js` in `.next/standalone/` that can run without the full `node_modules` tree. This keeps the deployed artifact small and avoids npm on the CML pod at runtime.

### `cai/setup_environment.py` (One-time Setup Job)

Runs as a CML **job** before the application starts:

1. Download and install Node.js 20 to `~/.local/` (no root)
2. `npm ci --production=false` (install deps including devDependencies for build)
3. `npm run build` (produces `.next/standalone/`)
4. Copy `.next/static` and `public/` into standalone dir
5. Compile nginx from source to `~/.local/bin/nginx` (same pattern as ray-serve-cai)
6. Write `nginx.conf` pointing 8080 → 3000

### `cai/launch_app.sh` (Application Entry Point)

```bash
#!/bin/bash
set -e

export PATH="$HOME/.local/bin:$HOME/.local/node/bin:$PATH"
export PORT=${CDSW_APP_PORT:-8080}
export HOSTNAME="0.0.0.0"

# Start Next.js standalone server on port 3000
cd /home/cdsw/modularized_agent_ui
node .next/standalone/server.js &
NEXT_PID=$!

# Start nginx reverse proxy on CDSW_APP_PORT
nginx -c /home/cdsw/modularized_agent_ui/cai/nginx.conf -g "daemon off;" &
NGINX_PID=$!

# Wait for either to exit
wait -n $NEXT_PID $NGINX_PID
```

### `cai/nginx.conf`

```nginx
worker_processes 1;
error_log /home/cdsw/nginx_error.log warn;
pid /home/cdsw/nginx.pid;

events { worker_connections 128; }

http {
  include       /home/cdsw/.local/conf/mime.types;
  default_type  application/octet-stream;
  sendfile on;
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml;

  server {
    listen 8080;
    server_name _;

    # Health check for CAI
    location /healthz {
      access_log off;
      return 200 "ok";
    }

    # Proxy all traffic to Next.js
    location / {
      proxy_pass http://127.0.0.1:3000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_read_timeout 300s;
    }
  }
}
```

### Auto-Connect Mode

When deployed on CAI alongside the workflow backend, the connect page can be bypassed:

```typescript
// app/page.tsx — on mount
const backendUrl = process.env.WORKFLOW_BACKEND_URL;
const apiKey = process.env.WORKFLOW_API_KEY;
if (backendUrl && apiKey) {
  // Auto-connect and redirect to /workflow
  workflowStore.getState().connect(backendUrl, apiKey);
}
```

This enables a "zero-config" experience: the CML admin sets environment variables on the application, and users go straight to the workflow page.

### Deployment Pipeline

**Option A: CML Jobs (matches ray-serve-cai pattern)**

```
Job 1: git_sync          → Clone/sync repo to CML project
Job 2: setup_environment  → Install Node.js, build Next.js, compile nginx
Job 3: launch_app         → Start nginx + Next.js as CML Application
```

Triggered via `create_jobs.py` + `trigger_jobs.py` (same pattern as ray-serve-cai).

**Option B: GitHub Actions → CML API**

```yaml
# .github/workflows/deploy-ui.yml
- Setup CML project (setup_project.py)
- Create jobs (create_jobs.py)
- Trigger jobs (trigger_jobs.py --jobs-config cai/jobs_config.yaml)
```

### Implementation Phase

### Phase 9: CAI Deployment Integration
**Files:** `cai/launch_app.py`, `cai/launch_app.sh`, `cai/setup_environment.py`, `cai/app_config.yaml`, `cai/nginx.conf`, `next.config.ts` (update), `.env.production.template`

1. Set `output: 'standalone'` in `next.config.ts`, add `basePath` support
2. Write `setup_environment.py`: Node.js install + `npm ci` + `npm run build` + nginx compile
3. Write `launch_app.sh`: start Next.js standalone + nginx on `CDSW_APP_PORT`
4. Write `nginx.conf` reverse proxy config
5. Write `launch_app.py` (CAI-required Python entry point that calls the shell script)
6. Write `app_config.yaml` with resource/runtime defaults
7. Add auto-connect logic to `app/page.tsx` for `WORKFLOW_BACKEND_URL` / `WORKFLOW_API_KEY`
8. Write `.env.production.template` documenting all env vars
9. Test locally: `npm run build && node .next/standalone/server.js` to verify standalone output works

---

## Verification Plan

1. **Dev server**: `npm run dev` -> http://localhost:3000
2. **Connect flow**: Enter the sample workflow URL + API key -> verify schema is fetched and inputs rendered
3. **Input inference**: Confirm "claim_json" renders as JSON editor, "Attachments" renders as file upload
4. **File upload**: Upload a test file -> verify base64 upload through proxy -> file_path returned
5. **Execution**: Fill inputs -> click "Run" -> verify event timeline populates in real-time
6. **Completion**: Verify final output renders as markdown when crew_kickoff_completed fires
7. **Chat mode**: Test with a conversational workflow -> verify chat UI appears and multi-turn works
8. **Responsive**: Resize browser through breakpoints -> verify layout adapts
9. **Error handling**: Test with invalid URL, expired key, failed workflow -> verify error states
10. **Standalone build**: `npm run build && node .next/standalone/server.js` -> verify app serves on port 3000
11. **CAI nginx proxy**: Start nginx with `cai/nginx.conf` locally -> verify port 8080 proxies to 3000
12. **CAI health check**: `curl http://localhost:8080/healthz` -> verify 200 "ok"
13. **Auto-connect**: Set `WORKFLOW_BACKEND_URL` + `WORKFLOW_API_KEY` env vars -> verify connect page is bypassed
14. **CML deployment**: Deploy via `trigger_jobs.py` -> verify app accessible at `<app-name>.<CDSW_DOMAIN>`
