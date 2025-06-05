import RunwayML from '@runwayml/sdk';

const client = new RunwayML();

export async function generateImage(
  promptText: string,
  referenceImageUri: string,
  requestId?: string
) {
  const logPrefix = requestId ? `[${requestId}]` : '[runway]';
  const startTime = Date.now();

  try {
    console.log(`${logPrefix} Starting RunwayML task creation`);
    console.log(`${logPrefix} Parameters:`, {
      model: 'gen4_image',
      ratio: '1280:720',
      promptText,
      referenceImageProvided: !!referenceImageUri,
      referenceImageType: referenceImageUri
        ? referenceImageUri.startsWith('data:')
          ? 'base64'
          : 'url'
        : 'none',
    });

    let task = await client.textToImage.create({
      model: 'gen4_image',
      ratio: '1280:720',
      promptText,
      referenceImages: [{ uri: referenceImageUri }],
    });

    console.log(`${logPrefix} Task created successfully with ID: ${task.id}`);

    let pollCount = 0;
    const maxPolls = 300; // 5 minutes timeout
    let retrievedTask: RunwayML.TaskRetrieveResponse | null = null;

    do {
      pollCount++;
      console.log(`${logPrefix} Polling task status (attempt ${pollCount}/${maxPolls})`);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const previousStatus = retrievedTask?.status;
      retrievedTask = await client.tasks.retrieve(task.id);

      if (retrievedTask.status !== previousStatus) {
        console.log(
          `${logPrefix} Task status changed: ${previousStatus || 'initial'} → ${retrievedTask.status}`
        );
      }

      if (retrievedTask.status === 'FAILED') {
        console.error(`${logPrefix} Task failed:`, {
          taskId: task.id,
          status: retrievedTask.status,
        });
        throw new Error(`RunwayML task failed with status: ${retrievedTask.status}`);
      }

      if (pollCount >= maxPolls) {
        console.error(`${logPrefix} Task polling timeout after ${maxPolls} attempts`);
        throw new Error('Task polling timeout - generation took too long');
      }
    } while (!['SUCCEEDED', 'FAILED'].includes(retrievedTask.status));

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`${logPrefix} Task completed successfully:`, {
      taskId: task.id,
      status: retrievedTask.status,
      duration: `${duration}ms`,
      pollAttempts: pollCount,
      outputs: retrievedTask.output ? 'Generated' : 'No output',
    });

    if (retrievedTask.status === 'SUCCEEDED') {
      console.log(`${logPrefix} Generation successful, returning task ID: ${task.id}`);
    }

    return retrievedTask;
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error(`${logPrefix} Image generation failed after ${duration}ms:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      promptText,
      hasReferenceImage: !!referenceImageUri,
    });

    throw error;
  }
}
