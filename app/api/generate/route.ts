import { generateImage } from '@/lib/runway';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    console.log(`[${requestId}] API Request started at ${new Date().toISOString()}`);

    const body = await request.json();
    const { promptText, referenceImage } = body;

    console.log(`[${requestId}] Request parameters:`, {
      promptText,
      referenceImageSize: referenceImage ? `${referenceImage.length} characters` : 'null',
      hasReferenceImage: !!referenceImage,
    });

    if (!promptText) {
      console.warn(`[${requestId}] Missing promptText in request`);
      return NextResponse.json({ error: 'promptText is required' }, { status: 400 });
    }

    if (!referenceImage) {
      console.warn(`[${requestId}] Missing referenceImage in request`);
      return NextResponse.json({ error: 'referenceImage is required' }, { status: 400 });
    }

    console.log(`[${requestId}] Starting image generation with prompt: "${promptText}"`);

    const result = await generateImage(promptText, referenceImage, requestId);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`[${requestId}] API Request completed successfully in ${duration}ms`);
    console.log(`[${requestId}] Result:`, result);

    return NextResponse.json(result);
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error(`[${requestId}] API Request failed after ${duration}ms:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
