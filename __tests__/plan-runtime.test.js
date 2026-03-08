const { buildLocalPlan, annotateServerPlan, outputHumanPlan } = require("../cli/plan-runtime")

describe("plan-runtime", () => {
  test("buildLocalPlan annotates local execution", () => {
    const cmd = {
      namespace: "ai",
      resource: "text",
      action: "summarize",
      adapter: "mcp",
      adapterConfig: { tool: "summarize" }
    }

    const plan = buildLocalPlan(cmd, { text: "hello" })

    expect(plan.execution_mode).toBe("local")
    expect(plan.persisted).toBe(false)
    expect(plan.command).toBe("ai.text.summarize")
  })

  test("annotateServerPlan annotates persisted server plan", () => {
    const plan = annotateServerPlan({ plan_id: "plan_1", command: "x.y.z", steps: [] })

    expect(plan.execution_mode).toBe("server")
    expect(plan.persisted).toBe(true)
  })

  test("outputHumanPlan prints execution hint", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {})
    outputHumanPlan({
      plan_id: "plan_1",
      command: "x.y.z",
      risk_level: "safe",
      side_effects: false,
      persisted: false,
      steps: [{ type: "resolve_command", description: "resolve" }]
    })

    const joined = spy.mock.calls.map(args => args.join(" ")).join("\n")
    expect(joined).toContain("Execution Plan")
    expect(joined).toContain("preview only")
    spy.mockRestore()
  })
})
