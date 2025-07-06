import { NextResponse } from 'next/server';
import { aiAnalyzer } from '@/lib/ai-service';

export async function GET() {
  try {
    // Test environment variables
    const envVars = {
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY ? 
        `SET (${process.env.PERPLEXITY_API_KEY.substring(0, 10)}...)` : 
        'NOT SET',
      ENABLE_AI_INSIGHTS: process.env.ENABLE_AI_INSIGHTS || 'NOT SET',
      AI_FALLBACK_ENABLED: process.env.AI_FALLBACK_ENABLED || 'NOT SET',
    };

    // Test AI service initialization
    const testEmployee = {
      name: 'Test Employee',
      ratings: {
        collaboration: 4.0,
        communication: 3.5,
        respect: 4.2,
        transparency: 3.8
      }
    };

    let aiTestResult;
    try {
      aiTestResult = await aiAnalyzer.getEnhancedInsights(testEmployee);
      aiTestResult = aiTestResult ? 'SUCCESS' : 'FAILED - No insights returned';
    } catch (error) {
      aiTestResult = `FAILED - ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      status: 'AI Configuration Test',
      environmentVariables: envVars,
      aiServiceTest: aiTestResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 