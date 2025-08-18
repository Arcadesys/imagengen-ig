import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export async function GET(request: NextRequest) {
  console.log("[v0] Starting OpenAI configuration test")

  const tests = []

  // Test 1: Check if API key exists
  const apiKey = process.env.OPENAI_API_KEY
  console.log("[v0] API Key check:", apiKey ? "Present" : "Missing")
  tests.push({
    test: "API Key Environment Variable",
    status: apiKey ? "PASS" : "FAIL",
    details: apiKey ? "API key is present" : "OPENAI_API_KEY environment variable is missing",
  })

  if (!apiKey) {
    return NextResponse.json({ tests, summary: "Cannot proceed without API key" })
  }

  // Test 2: Check API key format
  const keyFormat = apiKey.startsWith("sk-") ? "PASS" : "FAIL"
  console.log("[v0] API Key format:", keyFormat)
  tests.push({
    test: "API Key Format",
    status: keyFormat,
    details: keyFormat === "PASS" ? "API key has correct sk- prefix" : "API key should start with sk-",
  })

  // Test 3: Initialize OpenAI client
  let openai
  try {
    openai = new OpenAI({ apiKey })
    console.log("[v0] OpenAI client initialized successfully")
    tests.push({
      test: "OpenAI Client Initialization",
      status: "PASS",
      details: "OpenAI client created successfully",
    })
  } catch (error) {
    console.log("[v0] OpenAI client initialization failed:", error)
    tests.push({
      test: "OpenAI Client Initialization",
      status: "FAIL",
      details: `Failed to initialize: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
    return NextResponse.json({ tests, summary: "Client initialization failed" })
  }

  // Test 4: Test API connection with simple completion
  try {
    console.log("[v0] Testing API connection with simple completion")
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: 'Say "API test successful"' }],
      max_tokens: 10,
    })

    console.log("[v0] API connection test successful")
    tests.push({
      test: "API Connection (Chat Completion)",
      status: "PASS",
      details: `Response: ${completion.choices[0]?.message?.content || "No content"}`,
    })
  } catch (error) {
    console.log("[v0] API connection test failed:", error)
    tests.push({
      test: "API Connection (Chat Completion)",
      status: "FAIL",
      details: `API call failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
  }

  // Test 5: Test DALL-E availability
  try {
    console.log("[v0] Testing DALL-E model availability")
    const imageResponse = await openai.images.generate({
      model: "dall-e-2",
      prompt: "A simple test image",
      n: 1,
      size: "256x256",
    })

    console.log("[v0] DALL-E test successful")
    tests.push({
      test: "DALL-E Image Generation",
      status: "PASS",
      details: `Generated image URL: ${imageResponse.data[0]?.url ? "Success" : "No URL returned"}`,
    })
  } catch (error) {
    console.log("[v0] DALL-E test failed:", error)
    tests.push({
      test: "DALL-E Image Generation",
      status: "FAIL",
      details: `DALL-E call failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
  }

  const passedTests = tests.filter((t) => t.status === "PASS").length
  const summary = `${passedTests}/${tests.length} tests passed`

  console.log("[v0] Test summary:", summary)

  return NextResponse.json({
    tests,
    summary,
    timestamp: new Date().toISOString(),
  })
}
