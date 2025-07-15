// app/api/ai/mission/enhance/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';

const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000/api/v1";

export async function POST(request: NextRequest) {
  try {
    const { userInput, userId } = await request.json();

    if (!userInput || !userId) {
      return NextResponse.json(
        { error: 'Missing userInput or userId' },
        { status: 400 }
      );
    }

    // Verify user authentication
    const supabase = createServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call AI service for mission enhancement
    const response = await fetch(`${AI_SERVICE_BASE_URL}/onboarding/mission/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_input: userInput
      }),
    });

    if (!response.ok) {
      // Fallback if AI service is not available
      console.warn('AI service unavailable, using fallback');
      return NextResponse.json({
        mission: userInput, // Just use their input as-is
        enhanced: false
      });
    }

    const aiResult = await response.json();
    
    return NextResponse.json({
      mission: aiResult.mission || userInput,
      enhanced: true
    });

  } catch (error) {
    console.error('Mission enhancement error:', error);
    
    // Graceful fallback
    const { userInput } = await request.json();
    return NextResponse.json({
      mission: userInput,
      enhanced: false
    });
  }
}