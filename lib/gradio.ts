const GRADIO_API_URL_BASE = "https://11824e588701.ngrok.app"
const GRADIO_API_URL = `${GRADIO_API_URL_BASE}/gradio_api/call/process_inputs`
const GRADIO_API_URL_EVENT = `${GRADIO_API_URL_BASE}/gradio_api/call/process_inputs`

// Custom error types for better error handling
export class GradioAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error,
  ) {
    super(message)
    this.name = "GradioAPIError"
  }
}

export class NetworkError extends Error {
  constructor(message = "Network connection failed") {
    super(message)
    this.name = "NetworkError"
  }
}

export class TimeoutError extends Error {
  constructor(message = "Request timed out") {
    super(message)
    this.name = "TimeoutError"
  }
}

// Helper function to determine if an error is retryable
export function isRetryableError(error: Error): boolean {
  return (
    error instanceof NetworkError ||
    error instanceof TimeoutError ||
    (error instanceof GradioAPIError && error.statusCode && error.statusCode >= 500)
  )
}

// Helper function to get user-friendly error message
export function getUserFriendlyErrorMessage(error: Error): string {
  if (error instanceof NetworkError) {
    return "Unable to connect to the game server. Please check your internet connection and try again."
  }

  if (error instanceof TimeoutError) {
    return "The request is taking longer than expected. Please try again."
  }

  if (error instanceof GradioAPIError) {
    if (error.statusCode === 503) {
      return "The game service is temporarily unavailable. Please try again in a few moments."
    }
    if (error.statusCode === 429) {
      return "Too many requests. Please wait a moment before trying again."
    }
    if (error.statusCode && error.statusCode >= 500) {
      return "The game server is experiencing issues. Please try again later."
    }
  }

  return "An unexpected error occurred. Please try again or contact support if the problem persists."
}

// Enhanced fetch with timeout and retry logic
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      throw new TimeoutError()
    }
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new NetworkError()
    }
    throw error
  }
}

export async function generateTransformPrompt(imageUrl: string): Promise<string> {
  console.log("generateTransformPrompt called with imageUrl:", imageUrl)

  try {
    const response = await fetchWithTimeout(
      GRADIO_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: ["", "", imageUrl],
        }),
      },
      30000,
    ) // 30 second timeout

    if (!response.ok) {
      console.error("generateTransformPrompt: Initial API call failed", response.status)
      throw new GradioAPIError(`API request failed with status ${response.status}`, response.status)
    }

    const result = await response.json()
    console.log("generateTransformPrompt: Initial response:", result)

    const eventId = result.event_id

    if (!eventId) {
      console.error("generateTransformPrompt: No event ID received from initial call")
      throw new GradioAPIError("No event ID received from API response")
    }

    console.log("generateTransformPrompt: Event ID:", eventId)

    const resultResponse = await fetchWithTimeout(`${GRADIO_API_URL_EVENT}/${eventId}`, {}, 60000) // 60 second timeout for processing

    if (!resultResponse.ok) {
      console.error("generateTransformPrompt: Event polling failed", resultResponse.status)
      throw new GradioAPIError(`Event polling failed with status ${resultResponse.status}`, resultResponse.status)
    }

    const reader = resultResponse.body?.getReader()
    if (!reader) {
      console.error("generateTransformPrompt: No readable stream available")
      throw new GradioAPIError("No readable stream available from API response")
    }

    const decoder = new TextDecoder()
    let eventResult = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        eventResult += decoder.decode(value, { stream: true })
      }
    } catch (error) {
      console.error("generateTransformPrompt: Stream reading failed", error)
      throw new GradioAPIError("Failed to read response stream", undefined, error as Error)
    }

    console.log("generateTransformPrompt: Raw SSE response:", eventResult)

    const parsedResult = parseSSEResponse(eventResult)
    console.log("generateTransformPrompt: Parsed result:", parsedResult)

    if (parsedResult.success && parsedResult.prompt) {
      console.log("generateTransformPrompt: Extracted prompt:", parsedResult.prompt)
      return parsedResult.prompt
    }

    console.error("generateTransformPrompt: Failed to extract prompt from response")
    throw new GradioAPIError("Failed to generate transform prompt - invalid response format")
  } catch (error) {
    console.error("generateTransformPrompt: Error occurred:", error)

    // Re-throw our custom errors as-is
    if (error instanceof GradioAPIError || error instanceof NetworkError || error instanceof TimeoutError) {
      throw error
    }

    // Wrap unknown errors
    throw new GradioAPIError("Unexpected error during prompt generation", undefined, error as Error)
  }
}

export async function scorePromptGuess({ prompt, guess }: { prompt: string; guess: string }) {
  console.log("scorePromptGuess called with prompt:", prompt, "guess:", guess)

  try {
    const response = await fetchWithTimeout(
      GRADIO_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [prompt, guess, null],
        }),
      },
      30000,
    ) // 30 second timeout

    if (!response.ok) {
      console.error("scorePromptGuess: Initial API call failed", response.status)
      throw new GradioAPIError(`API request failed with status ${response.status}`, response.status)
    }

    const result = await response.json()
    console.log("scorePromptGuess: Initial response:", result)

    const eventId = result.event_id

    if (!eventId) {
      console.error("scorePromptGuess: No event ID received from initial call")
      throw new GradioAPIError("No event ID received from API response")
    }

    console.log("scorePromptGuess: Event ID:", eventId)

    const resultResponse = await fetchWithTimeout(`${GRADIO_API_URL_EVENT}/${eventId}`, {}, 60000) // 60 second timeout

    if (!resultResponse.ok) {
      console.error("scorePromptGuess: Event polling failed", resultResponse.status)
      throw new GradioAPIError(`Event polling failed with status ${resultResponse.status}`, resultResponse.status)
    }

    const reader = resultResponse.body?.getReader()
    if (!reader) {
      console.error("scorePromptGuess: No readable stream available")
      throw new GradioAPIError("No readable stream available from API response")
    }

    const decoder = new TextDecoder()
    let eventResult = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        eventResult += decoder.decode(value, { stream: true })
      }
    } catch (error) {
      console.error("scorePromptGuess: Stream reading failed", error)
      throw new GradioAPIError("Failed to read response stream", undefined, error as Error)
    }

    console.log("scorePromptGuess: Raw SSE response:", eventResult)

    const parsedResult = parseSSEResponse(eventResult)
    console.log("scorePromptGuess: Parsed result:", parsedResult)

    if (!parsedResult.success) {
      throw new GradioAPIError("Failed to score guess - invalid response format")
    }

    return parsedResult
  } catch (error) {
    console.error("scorePromptGuess: Error occurred:", error)

    // Re-throw our custom errors as-is
    if (error instanceof GradioAPIError || error instanceof NetworkError || error instanceof TimeoutError) {
      throw error
    }

    // Wrap unknown errors
    throw new GradioAPIError("Unexpected error during guess scoring", undefined, error as Error)
  }
}

function parseSSEResponse(sseData: string) {
  console.log("parseSSEResponse: Starting to parse SSE data")

  const lines = sseData.split("\n")
  let currentEvent: { event?: string; data?: any } = {}
  const events: Array<{ event?: string; data?: any }> = []

  for (const line of lines) {
    if (line.startsWith("event: ")) {
      currentEvent.event = line.substring(7).trim()
      console.log("parseSSEResponse: Found event:", currentEvent.event)
    } else if (line.startsWith("data: ")) {
      const dataStr = line.substring(6).trim()
      try {
        // Parse the JSON data
        currentEvent.data = JSON.parse(dataStr)
        console.log("parseSSEResponse: Parsed data:", currentEvent.data)
      } catch (error) {
        // If it's not valid JSON, store as string
        currentEvent.data = dataStr
        console.log("parseSSEResponse: Data stored as string:", dataStr)
      }
    } else if (line.trim() === "") {
      // Empty line indicates end of current event
      if (currentEvent.event || currentEvent.data) {
        events.push({ ...currentEvent })
        console.log("parseSSEResponse: Added event to collection:", currentEvent)
        currentEvent = {}
      }
    }
  }

  // Add the last event if there's no trailing empty line
  if (currentEvent.event || currentEvent.data) {
    events.push(currentEvent)
    console.log("parseSSEResponse: Added final event:", currentEvent)
  }

  console.log("parseSSEResponse: Total events found:", events.length)

  // Helper function to extract score from data array
  function extractScore(data: any): number | null {
    if (Array.isArray(data) && data.length > 0) {
      const firstElement = data[0]
      if (typeof firstElement === "string") {
        // Remove whitespace and newlines, then parse as number
        const cleanedString = firstElement.replace(/\s+/g, "").trim()
        const score = Number.parseFloat(cleanedString)
        const result = isNaN(score) ? null : score
        console.log("parseSSEResponse: Extracted score from string:", firstElement, "->", result)
        return result
      } else if (typeof firstElement === "number") {
        console.log("parseSSEResponse: Extracted score from number:", firstElement)
        return firstElement
      }
    }
    console.log("parseSSEResponse: Could not extract score from data:", data)
    return null
  }

  // Helper function to extract prompt text from data array
  function extractPrompt(data: any): string | null {
    if (Array.isArray(data) && data.length > 0) {
      const firstElement = data[0]
      if (typeof firstElement === "string") {
        // Clean up the string but preserve meaningful content
        const result = firstElement.trim()
        console.log("parseSSEResponse: Extracted prompt:", result)
        return result
      }
    }
    console.log("parseSSEResponse: Could not extract prompt from data:", data)
    return null
  }

  // Return the last complete event's data, or all events if you need them
  const completeEvent = events.find((event) => event.event === "complete")
  if (completeEvent && completeEvent.data) {
    console.log("parseSSEResponse: Using complete event for result")
    const score = extractScore(completeEvent.data)
    const prompt = extractPrompt(completeEvent.data)
    return {
      success: true,
      event: completeEvent.event,
      data: completeEvent.data,
      score: score,
      prompt: prompt,
      allEvents: events, // Include all events for debugging if needed
    }
  }

  // If no complete event found, return the last event with data
  const lastEventWithData = events.reverse().find((event) => event.data)
  if (lastEventWithData) {
    console.log("parseSSEResponse: Using last event with data for result")
    const score = extractScore(lastEventWithData.data)
    const prompt = extractPrompt(lastEventWithData.data)
    return {
      success: true,
      event: lastEventWithData.event,
      data: lastEventWithData.data,
      score: score,
      prompt: prompt,
      allEvents: events,
    }
  }

  // If no data found, return raw events
  console.error("parseSSEResponse: No valid data found in any event")
  return {
    success: false,
    message: "No data found in response",
    allEvents: events,
    rawResponse: sseData,
    score: null,
    prompt: null,
  }
}
