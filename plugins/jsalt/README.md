# JSALT Plugin

`jsalt` helps agents learn and use the JSALT (JSA) framework by combining:

- learnable framework guidance via `plugins learn`
- executable `jsa-ast` wrappers for validation and AST output
- passthrough access for full upstream CLI coverage

## Install

```bash
npm install -g jsalt
supercli plugins install ./plugins/jsalt --json
```

## Learn First (Recommended)

```bash
supercli plugins learn jsalt
```

This prints agent-focused JSALT syntax, common patterns, and examples for `.jsa` coding workflows.

## Commands

- `supercli jsalt cli help`
- `supercli jsalt ast validate --path examples/counter.jsa`
- `supercli jsalt ast json --path examples/counter.jsa`
- `supercli jsalt ast tree --path examples/counter.jsa`
- `supercli jsalt <any jsa-ast args...>`

## Notes

- Use `ast json` when an agent needs structured AST for planning or code transformation.
- Use `ast validate` in CI or pre-commit checks for `.jsa` syntax safety.
- Use passthrough when you need upstream flags not covered by wrappers.
