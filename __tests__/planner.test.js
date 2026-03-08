const { createPlan } = require("../cli/planner")

describe("planner", () => {
  test("creates default http plan with expected steps", () => {
    const cmd = {
      namespace: "api",
      resource: "users",
      action: "list",
      adapter: "http",
      adapterConfig: { method: "GET", url: "https://example.com/users" }
    }

    const plan = createPlan(cmd, { limit: 10 })

    expect(plan.command).toBe("api.users.list")
    expect(plan.args).toEqual({ limit: 10 })
    expect(plan.steps).toHaveLength(4)
    expect(plan.steps[2]).toMatchObject({
      type: "adapter_request",
      adapter: "http",
      method: "GET",
      url: "https://example.com/users"
    })
    expect(plan.side_effects).toBe(false)
    expect(plan.risk_level).toBe("safe")
  })

  test("marks mutation command as medium risk by default", () => {
    const cmd = {
      namespace: "api",
      resource: "users",
      action: "create",
      adapter: "openapi",
      mutation: true,
      adapterConfig: { operationId: "createUser" }
    }

    const plan = createPlan(cmd, {})

    expect(plan.side_effects).toBe(true)
    expect(plan.risk_level).toBe("medium")
    expect(plan.steps[2]).toMatchObject({
      adapter: "openapi",
      operationId: "createUser"
    })
  })
})
