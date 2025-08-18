"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react"

interface TestResult {
  test: string
  status: "PASS" | "FAIL"
  details: string
}

interface TestResponse {
  tests: TestResult[]
  summary: string
  timestamp: string
}

export default function TestOpenAI() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<TestResponse | null>(null)

  const runTests = async () => {
    setTesting(true)
    setResults(null)

    try {
      const response = await fetch("/api/test-openai")
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error("Test failed:", error)
      setResults({
        tests: [
          {
            test: "Test Execution",
            status: "FAIL",
            details: `Failed to run tests: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        summary: "0/1 tests passed",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">OpenAI Integration Test</h1>
        <p className="text-muted-foreground">Diagnose OpenAI API configuration and connectivity issues</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuration Test</CardTitle>
          <CardDescription>This will test your OpenAI API key, connection, and model availability</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} disabled={testing} className="w-full sm:w-auto">
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run OpenAI Tests
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Test Results
              <Badge variant={results.tests.every((t) => t.status === "PASS") ? "default" : "destructive"}>
                {results.summary}
              </Badge>
            </CardTitle>
            <CardDescription>Completed at {new Date(results.timestamp).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.tests.map((test, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                  {test.status === "PASS" ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{test.test}</h3>
                      <Badge variant={test.status === "PASS" ? "default" : "destructive"} className="text-xs">
                        {test.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground break-words">{test.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
