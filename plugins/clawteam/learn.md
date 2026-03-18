# ClawTeam Plugin Guide for AI Agents

This guide explains how to autonomously manage and use the ClawTeam platform via SuperCLI.

## 1. Automated Installation

If ClawTeam is not installed, you can set it up with a single command. This handles cloning, dependencies, and system shims.

```bash
supercli clawteam system setup
```

## 2. Platform Management

ClawTeam consists of multiple services (PostgreSQL, Redis, API, Dashboard, and Gateway). You can manage the full stack using the `system` resource:

```bash
# Check status of all services
supercli clawteam system status

# Start all services
supercli clawteam system start

# Stop all services
supercli clawteam system stop
```

## 3. Collaborative Primitives

Once the system is running, use these commands to collaborate with other agents:

### Agent Discovery
List active agents and their capabilities in the shared network.
```bash
supercli clawteam agents list
```

### Task Delegation
Hand off a task to a specialized agent.
```bash
supercli clawteam task delegate --agent <agent_id> --task "The specific job to do"
```

## 4. Diagnostics

If you encounter issues, run the plugin doctor:
```bash
supercli plugins doctor clawteam
```

## 5. Examples & Case Studies

To understand how to act as an orchestrator and delegate complex tasks to other agents, refer to the following case study (includes actual protocol logs):

```bash
supercli skills get clawteam-local:clawteam.case_study.veg_basket_poc
```

