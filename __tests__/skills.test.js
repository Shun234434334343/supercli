const {
  normalizeSkillId,
  buildCommandSkillMarkdown,
  buildTeachSkillMarkdown,
  listSkillsMetadata
} = require("../cli/skills")

describe("skills", () => {
  test("normalizeSkillId validates dotted ids", () => {
    expect(normalizeSkillId("a.b.c")).toEqual({ id: "a.b.c", namespace: "a", resource: "b", action: "c" })
    expect(normalizeSkillId("a.b")).toBeNull()
    expect(normalizeSkillId(123)).toBeNull()
  })

  test("buildCommandSkillMarkdown returns frontmatter and examples", () => {
    const md = buildCommandSkillMarkdown({
      namespace: "ai",
      resource: "text",
      action: "summarize",
      description: "Summarize text",
      adapter: "mcp",
      adapterConfig: { tool: "summarize" },
      args: [{ name: "text", type: "string", required: true }]
    })

    expect(md.startsWith("---\n")).toBe(true)
    expect(md).toContain("skill_name: \"ai_text_summarize\"")
    expect(md).toContain("supercli ai text summarize --text <text> --json")
  })

  test("buildTeachSkillMarkdown can include dag", () => {
    const md = buildTeachSkillMarkdown({ showDag: true })
    expect(md).toContain("skill_name: \"teach_skills_usage\"")
    expect(md).toContain("dag:")
  })

  test("listSkillsMetadata keeps name and description only", () => {
    const skills = listSkillsMetadata({
      commands: [{ namespace: "x", resource: "y", action: "z", description: "desc" }]
    })
    expect(skills).toEqual([{ name: "x.y.z", description: "desc" }])
  })
})
