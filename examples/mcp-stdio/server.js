#!/usr/bin/env node

function summarize(text) {
  const normalized = String(text || "").trim().replace(/\s+/g, " ")
  if (!normalized) return ""
  const words = normalized.split(" ")
  if (words.length <= 12) return normalized
  return words.slice(0, 12).join(" ") + " ..."
}

async function main() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)

  let payload
  try {
    payload = JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}")
  } catch {
    process.stderr.write("Invalid JSON input\n")
    process.exit(1)
    return
  }

  const tool = payload.tool
  const input = payload.input || {}

  if (tool !== "summarize") {
    process.stderr.write(`Unknown tool: ${tool}\n`)
    process.exit(1)
    return
  }

  const source = input.text || ""
  const summary = summarize(source)
  const out = {
    tool,
    mode: "stdio",
    result: summary,
    words_in: String(source).trim() ? String(source).trim().split(/\s+/).length : 0,
    words_out: summary ? summary.split(/\s+/).length : 0
  }

  process.stdout.write(JSON.stringify(out))
  process.exit(0)
}

main().catch((err) => {
  process.stderr.write(`${err.message}\n`)
  process.exit(1)
})
