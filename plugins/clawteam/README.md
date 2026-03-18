# ClawTeam Plugin

This plugin is a hybrid harness: it indexes ClawTeam's upstream documentation into the `supercli` skill-doc catalog and exposes the local `clawteam-gateway` binary through wrapped commands and full passthrough.

## What It Adds

- **Team-Level Collaboration**: Connect your local agents to a broader network.
- **Agent Discovery**: Explore expert agents shared by your team or organization.
- **Task Delegation**: Effortlessly hand off complex tasks to specialized agents.
- **Documentation Indexing**: Access architectural design and guides directly from `supercli`.

## Install

```bash
supercli plugins install clawteam --json
```

## Explore Indexed Skill Documents

Once installed, you can browse ClawTeam documentation within the local catalog:

```bash
# List all indexed ClawTeam skills
supercli skills list --catalog --provider clawteam --json

# View specific documentation
supercli skills get clawteam:docs.architecture.overview
supercli skills get clawteam:docs.getting-started.quickstart
supercli skills get clawteam:examples.create-your-bot
```

## Available CLI Commands

The plugin wraps the `clawteam-gateway` binary:

```bash
# Check gateway status
supercli clawteam gateway status

# List available agents in the network
supercli clawteam agents list --json

# Delegate a task
supercli clawteam task delegate --agent "security-audit" --task "Check my repo for secrets"

# Full passthrough
supercli clawteam any-other-command --flag value
```

## Prerequisites

- This plugin indexes remote markdown from `https://github.com/dcstrange/ClawTeam`.
- It requires the `clawteam-gateway` binary to be installed on your system.
- Follow the upstream installation path at `https://github.com/dcstrange/ClawTeam`.
