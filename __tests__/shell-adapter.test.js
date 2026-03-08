const { execute } = require("../cli/adapters/shell")

describe("shell adapter", () => {
  test("executes script and parses json", async () => {
    const result = await execute({
      adapterConfig: {
        shell: "bash",
        unsafe: true,
        script: "printf '{\"ok\":true,\"msg\":\"{{text}}\"}'",
        parseJson: true,
        timeout_ms: 1000
      }
    }, { text: "hello" })

    expect(result).toEqual({ ok: true, msg: "hello" })
  })

  test("returns raw text when parseJson is false", async () => {
    const result = await execute({
      adapterConfig: {
        shell: "bash",
        unsafe: true,
        script: "printf 'plain-output'",
        parseJson: false,
        timeout_ms: 1000
      }
    }, {})

    expect(result).toEqual({ raw: "plain-output" })
  })
})
