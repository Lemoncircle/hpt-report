import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Define the structure of our report response
interface ReportData {
  executiveSummary: string;
  strengths: string[];
  areasForImprovement: string[];
  managerRecommendations: string[];
}

// POST endpoint to analyze uploaded Excel files
export async function POST(request: NextRequest) {
  try {
    // Parse the form data containing the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' }, 
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      );
    }

    // Read and parse the Excel file
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert Excel data to JSON for analysis
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

    // Analyze the survey data and generate insights
    const reportData = await analyzeEngagementData(jsonData);

    return NextResponse.json({ 
      report: reportData,
      filename: file.name,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze the file. Please ensure it contains valid survey data.' },
      { status: 500 }
    );
  }
}

// Function to analyze engagement survey data and generate insights
async function analyzeEngagementData(data: Record<string, unknown>[]): Promise<ReportData> {
  // In a real implementation, this would call an AI service like OpenAI, Claude, etc.
  // For now, we'll simulate intelligent analysis based on common survey patterns

  const dataSize = data.length;
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Generate contextual insights based on data structure
  const insights = generateContextualInsights(data, columns, dataSize);

  return {
    executiveSummary: insights.summary,
    strengths: insights.strengths,
    areasForImprovement: insights.improvements,
    managerRecommendations: insights.recommendations
  };
}

// Helper function to generate contextual insights from survey data  
function generateContextualInsights(data: Record<string, unknown>[], columns: string[], dataSize: number) {
  // Analyze column names to understand survey structure
  const hasRatingColumns = columns.some(col => 
    col.toLowerCase().includes('rating') || 
    col.toLowerCase().includes('score') ||
    col.toLowerCase().includes('satisfaction')
  );

  const hasEngagementColumns = columns.some(col =>
    col.toLowerCase().includes('engagement') ||
    col.toLowerCase().includes('motivated') ||
    col.toLowerCase().includes('recommend')
  );

  const hasWorkLifeColumns = columns.some(col =>
    col.toLowerCase().includes('worklife') ||
    col.toLowerCase().includes('balance') ||
    col.toLowerCase().includes('stress')
  );

  // Generate insights based on detected patterns
  let summary = `Analysis of ${dataSize} survey responses reveals `;
  const strengths: string[] = [];
  const improvements: string[] = [];
  const recommendations: string[] = [];

  if (dataSize < 20) {
    summary += "a focused sample providing detailed insights into team dynamics. ";
    strengths.push("High response quality with detailed feedback");
    improvements.push("Consider broader participation for comprehensive insights");
    recommendations.push("Conduct follow-up discussions with respondents for deeper understanding");
  } else if (dataSize < 100) {
    summary += "good participation levels with actionable insights across key engagement metrics. ";
    strengths.push("Strong participation rate indicating employee investment in feedback");
    improvements.push("Opportunity to expand survey reach for organization-wide insights");
    recommendations.push("Implement pilot programs based on current feedback patterns");
  } else {
    summary += "comprehensive organization-wide participation with robust data for strategic decision-making. ";
    strengths.push("Excellent survey participation demonstrating high employee engagement in feedback process");
    strengths.push("Comprehensive data set enabling reliable trend analysis");
    recommendations.push("Develop organization-wide initiatives based on identified patterns");
  }

  if (hasEngagementColumns) {
    summary += "The data shows measurable engagement patterns with opportunities for targeted improvements. ";
    strengths.push("Clear engagement metrics provide baseline for improvement tracking");
    improvements.push("Focus on specific engagement drivers identified in the data");
    recommendations.push("Create engagement action plans with measurable targets");
  }

  if (hasWorkLifeColumns) {
    improvements.push("Work-life balance emerges as a key area requiring attention");
    recommendations.push("Implement flexible working arrangements and stress management programs");
  }

  if (hasRatingColumns) {
    strengths.push("Quantitative ratings enable objective performance measurement");
    recommendations.push("Establish regular pulse surveys to track rating improvements over time");
  }

  // Add standard recommendations based on common patterns
  improvements.push("Communication channels could be enhanced for better information flow");
  improvements.push("Recognition and appreciation systems need strengthening");
  
  recommendations.push("Establish regular feedback cycles to maintain improvement momentum");
  recommendations.push("Create cross-functional teams to address identified improvement areas");

  return {
    summary: summary + "Key themes indicate both significant strengths to build upon and focused areas for strategic improvement.",
    strengths,
    improvements,
    recommendations
  };
} 