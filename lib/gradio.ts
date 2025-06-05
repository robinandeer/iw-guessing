const GRADIO_API_URL_BASE = 'https://c2765f2c95dd.ngrok.app';
const GRADIO_API_URL = `${GRADIO_API_URL_BASE}/gradio_api/call/process_inputs`;
const GRADIO_API_URL_EVENT = `${GRADIO_API_URL_BASE}/gradio_api/call/process_inputs`;

export async function generateTransformPrompt(imageUrl: string) {
  console.log('generateTransformPrompt called with imageUrl:', imageUrl);

  const response = await fetch(GRADIO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: ['', '', imageUrl],
    }),
  });

  if (!response.ok) {
    console.error('generateTransformPrompt: Initial API call failed', response.status);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  console.log('generateTransformPrompt: Initial response:', result);

  const eventId = result.event_id;

  if (!eventId) {
    console.error('generateTransformPrompt: No event ID received from initial call');
    throw new Error('No event ID received from initial call');
  }

  console.log('generateTransformPrompt: Event ID:', eventId);

  const resultResponse = await fetch(`${GRADIO_API_URL_EVENT}/${eventId}`);

  if (!resultResponse.ok) {
    console.error('generateTransformPrompt: Event polling failed', resultResponse.status);
    throw new Error(`HTTP error! status: ${resultResponse.status}`);
  }

  const reader = resultResponse.body?.getReader();
  if (!reader) {
    console.error('generateTransformPrompt: No readable stream available');
    throw new Error('No readable stream available');
  }

  const decoder = new TextDecoder();
  let eventResult = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    eventResult += decoder.decode(value, { stream: true });
  }

  console.log('generateTransformPrompt: Raw SSE response:', eventResult);

  const parsedResult = parseSSEResponse(eventResult);
  console.log('generateTransformPrompt: Parsed result:', parsedResult);

  if (parsedResult.success && parsedResult.prompt) {
    console.log('generateTransformPrompt: Extracted prompt:', parsedResult.prompt);
    return parsedResult.prompt;
  }

  console.error('generateTransformPrompt: Failed to extract prompt from response');
  throw new Error('Failed to generate transform prompt');
}

export async function scorePromptGuess({ prompt, guess }: { prompt: string; guess: string }) {
  console.log('scorePromptGuess called with prompt:', prompt, 'guess:', guess);

  const response = await fetch(GRADIO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: [prompt, guess, null],
    }),
  });

  if (!response.ok) {
    console.error('scorePromptGuess: Initial API call failed', response.status);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  console.log('scorePromptGuess: Initial response:', result);

  const eventId = result.event_id;

  if (!eventId) {
    console.error('scorePromptGuess: No event ID received from initial call');
    throw new Error('No event ID received from initial call');
  }

  console.log('scorePromptGuess: Event ID:', eventId);

  const resultResponse = await fetch(`${GRADIO_API_URL_EVENT}/${eventId}`);

  if (!resultResponse.ok) {
    console.error('scorePromptGuess: Event polling failed', resultResponse.status);
    throw new Error(`HTTP error! status: ${resultResponse.status}`);
  }

  const reader = resultResponse.body?.getReader();
  if (!reader) {
    console.error('scorePromptGuess: No readable stream available');
    throw new Error('No readable stream available');
  }

  const decoder = new TextDecoder();
  let eventResult = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    eventResult += decoder.decode(value, { stream: true });
  }

  console.log('scorePromptGuess: Raw SSE response:', eventResult);

  const parsedResult = parseSSEResponse(eventResult);
  console.log('scorePromptGuess: Parsed result:', parsedResult);

  return parsedResult;
}

function parseSSEResponse(sseData: string) {
  console.log('parseSSEResponse: Starting to parse SSE data');

  const lines = sseData.split('\n');
  let currentEvent: { event?: string; data?: any } = {};
  const events: Array<{ event?: string; data?: any }> = [];

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      currentEvent.event = line.substring(7).trim();
      console.log('parseSSEResponse: Found event:', currentEvent.event);
    } else if (line.startsWith('data: ')) {
      const dataStr = line.substring(6).trim();
      try {
        // Parse the JSON data
        currentEvent.data = JSON.parse(dataStr);
        console.log('parseSSEResponse: Parsed data:', currentEvent.data);
      } catch (error) {
        // If it's not valid JSON, store as string
        currentEvent.data = dataStr;
        console.log('parseSSEResponse: Data stored as string:', dataStr);
      }
    } else if (line.trim() === '') {
      // Empty line indicates end of current event
      if (currentEvent.event || currentEvent.data) {
        events.push({ ...currentEvent });
        console.log('parseSSEResponse: Added event to collection:', currentEvent);
        currentEvent = {};
      }
    }
  }

  // Add the last event if there's no trailing empty line
  if (currentEvent.event || currentEvent.data) {
    events.push(currentEvent);
    console.log('parseSSEResponse: Added final event:', currentEvent);
  }

  console.log('parseSSEResponse: Total events found:', events.length);

  // Helper function to extract score from data array
  function extractScore(data: any): number | null {
    if (Array.isArray(data) && data.length > 0) {
      const firstElement = data[0];
      if (typeof firstElement === 'string') {
        // Remove whitespace and newlines, then parse as number
        const cleanedString = firstElement.replace(/\s+/g, '').trim();
        const score = parseFloat(cleanedString);
        const result = isNaN(score) ? null : score;
        console.log('parseSSEResponse: Extracted score from string:', firstElement, '->', result);
        return result;
      } else if (typeof firstElement === 'number') {
        console.log('parseSSEResponse: Extracted score from number:', firstElement);
        return firstElement;
      }
    }
    console.log('parseSSEResponse: Could not extract score from data:', data);
    return null;
  }

  // Helper function to extract prompt text from data array
  function extractPrompt(data: any): string | null {
    if (Array.isArray(data) && data.length > 0) {
      const firstElement = data[0];
      if (typeof firstElement === 'string') {
        // Clean up the string but preserve meaningful content
        const result = firstElement.trim();
        console.log('parseSSEResponse: Extracted prompt:', result);
        return result;
      }
    }
    console.log('parseSSEResponse: Could not extract prompt from data:', data);
    return null;
  }

  // Return the last complete event's data, or all events if you need them
  const completeEvent = events.find(event => event.event === 'complete');
  if (completeEvent && completeEvent.data) {
    console.log('parseSSEResponse: Using complete event for result');
    const score = extractScore(completeEvent.data);
    const prompt = extractPrompt(completeEvent.data);
    return {
      success: true,
      event: completeEvent.event,
      data: completeEvent.data,
      score: score,
      prompt: prompt,
      allEvents: events, // Include all events for debugging if needed
    };
  }

  // If no complete event found, return the last event with data
  const lastEventWithData = events.reverse().find(event => event.data);
  if (lastEventWithData) {
    console.log('parseSSEResponse: Using last event with data for result');
    const score = extractScore(lastEventWithData.data);
    const prompt = extractPrompt(lastEventWithData.data);
    return {
      success: true,
      event: lastEventWithData.event,
      data: lastEventWithData.data,
      score: score,
      prompt: prompt,
      allEvents: events,
    };
  }

  // If no data found, return raw events
  console.error('parseSSEResponse: No valid data found in any event');
  return {
    success: false,
    message: 'No data found in response',
    allEvents: events,
    rawResponse: sseData,
    score: null,
    prompt: null,
  };
}
