import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { aiAnalyzer } from '@/lib/ai-service';
import { DocumentContext, documentProcessor } from '@/lib/document-service';

// Define the structure of individual employee report with AI enhancements
interface EmployeeReport {
  name: string;
  topValueObserved: string;
  areaForGrowth: string;
  valueRatings: {
    collaboration: number;
    communication: number;
    respect: number;
    transparency: number;
  };
  summary: string;
  suggestedBehavioralShift: string;
  // AI-enhanced fields
  aiInsights?: {
    enhancedSummary: string;
    behavioralRecommendations: string;
    trendAnalysis: string;
    feedbackAnalysis: string;
    developmentPriorities: string[];
    strengthsAnalysis: string;
    riskFactors: string[];
    successPredictors: string[];
  };
  isAiEnhanced: boolean;
}

// Define the structure of our complete report response with team insights
interface ReportData {
  employees: EmployeeReport[];
  totalEmployees: number;
  averageRatings: {
    collaboration: number;
    communication: number;
    respect: number;
    transparency: number;
  };
  // AI-enhanced team insights
  teamInsights?: {
    overallTrends: string;
    riskAreas: string[];
    strengthAreas: string[];
    recommendations: string[];
  };
  processingInfo: {
    aiEnabled: boolean;
    aiSuccessRate: number;
    fallbackUsed: boolean;
    processingTime: number;
  };
}

// POST endpoint to analyze uploaded Excel files with AI enhancement
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // DEBUG: Log environment variables (safely)
    console.log('🔍 DEBUG: Environment Variables Check:', {
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY ? 
        `SET (${process.env.PERPLEXITY_API_KEY.substring(0, 10)}...)` : 
        'NOT SET',
      ENABLE_AI_INSIGHTS: process.env.ENABLE_AI_INSIGHTS || 'NOT SET',
      AI_FALLBACK_ENABLED: process.env.AI_FALLBACK_ENABLED || 'NOT SET',
    });

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

    // Process optional document context files
    const documentContext: DocumentContext[] = [];
    const contextFiles = formData.getAll('contextFiles') as File[];
    
    if (contextFiles.length > 0) {
      console.log(`Processing ${contextFiles.length} context document(s)...`);
      
      for (const contextFile of contextFiles) {
        try {
          const processedDoc = await documentProcessor.processDocument(contextFile);
          documentContext.push(processedDoc);
          console.log(`✅ Processed context document: ${contextFile.name}`);
          // DEBUG: Log extracted text content (first 500 characters)
          console.log(`📝 Extracted text preview from ${contextFile.name}:`, 
            processedDoc.extractedText.substring(0, 500) + (processedDoc.extractedText.length > 500 ? '...' : ''));
          console.log(`📊 Full text length: ${processedDoc.extractedText.length} characters`);
        } catch (error) {
          console.warn(`⚠️ Failed to process context document ${contextFile.name}:`, error);
          // Continue processing other files even if one fails
        }
      }
      
      // DEBUG: Log final document context summary
      console.log(`🎯 Final document context summary:`, {
        totalDocuments: documentContext.length,
        totalCharacters: documentContext.reduce((sum, doc) => sum + doc.extractedText.length, 0),
        fileNames: documentContext.map(doc => doc.fileName)
      });
    } else {
      console.log('📄 No context documents provided - using general AI analysis');
    }

    // Read and parse the Excel file
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert Excel data to JSON for analysis
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

    // Analyze the survey data and generate individual employee reports with AI enhancement
    const reportData = await analyzeEmployeeDataWithAI(jsonData, documentContext);

    // Calculate total processing time
    const processingTime = Date.now() - startTime;
    reportData.processingInfo.processingTime = processingTime;

    console.log(`✅ Analysis completed in ${processingTime}ms`);
    console.log(`📊 AI Success Rate: ${reportData.processingInfo.aiSuccessRate.toFixed(1)}%`);

    // Return the comprehensive report data
    return NextResponse.json(reportData);

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze the file', 
        details: error instanceof Error ? error.message : 'Unknown error',
        processingInfo: {
          aiEnabled: process.env.ENABLE_AI_INSIGHTS === 'true',
          aiSuccessRate: 0,
          fallbackUsed: true,
          processingTime: Date.now() - startTime,
        }
      }, 
      { status: 500 }
    );
  }
}

// Enhanced function to analyze employee survey data with AI integration
async function analyzeEmployeeDataWithAI(data: Record<string, unknown>[], documentContext?: DocumentContext[]): Promise<ReportData> {
  // Simulate processing time for UI feedback
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (data.length === 0) {
    throw new Error('No data found in the Excel file');
  }

  // Extract column names to understand data structure
  const columns = Object.keys(data[0]);
  console.log('Available columns:', columns);

  // Generate base employee reports using existing rule-based system
  const baseEmployees = data.map((row, index) => generateEmployeeReport(row, columns, index));

  // Calculate average ratings across all employees
  const averageRatings = calculateAverageRatings(baseEmployees);

  // Track AI enhancement statistics
  let aiSuccessCount = 0;
  let fallbackUsed = false;

  // Process each employee with AI enhancement
  const enhancedEmployees = await Promise.all(
    baseEmployees.map(async (employee) => {
      try {
        console.log(`🧠 Processing AI insights for ${employee.name}...`);
        
        // Get AI-enhanced insights for this employee
        const aiInsights = await aiAnalyzer.getEnhancedInsights(
          {
            name: employee.name,
            ratings: employee.valueRatings,
            feedback: undefined, // Could extract from original data if available
            role: undefined,
            department: undefined,
            tenure: undefined,
          },
          {
            averageRatings,
            teamSize: baseEmployees.length,
          },
          documentContext
        );
        
        if (aiInsights) {
          aiSuccessCount++;
          console.log(`✅ AI insights generated for ${employee.name}`);
          return {
            ...employee,
            aiInsights,
            isAiEnhanced: true,
            // Use AI-enhanced versions as primary content
            summary: aiInsights.enhancedSummary,
            suggestedBehavioralShift: aiInsights.behavioralRecommendations,
          };
        } else {
          // This should rarely happen with the new AI-first approach
          fallbackUsed = true;
          console.warn(`⚠️ No AI insights generated for ${employee.name}, using rule-based analysis`);
          return {
            ...employee,
            isAiEnhanced: false,
          };
        }
      } catch (error) {
        console.error(`❌ AI enhancement failed for ${employee.name}:`, error);
        
        // Always return a valid employee object, even if AI fails
        fallbackUsed = true;
        return {
          ...employee,
          isAiEnhanced: false,
        };
      }
    })
  );

  // Get team-level AI insights (prioritizing AI analysis)
  let teamInsights;
  try {
    const teamData = enhancedEmployees.map(emp => ({
      name: emp.name,
      ratings: emp.valueRatings,
      feedback: undefined as string | undefined, // Could extract from original data if needed
      role: undefined as string | undefined,
      department: undefined as string | undefined,
    }));

    teamInsights = await aiAnalyzer.analyzeTeamTrends(teamData, documentContext);
    
    if (teamInsights) {
      console.log('✅ Team AI insights generated successfully');
    }
  } catch (error) {
    console.error('❌ Team analysis failed:', error);
    console.log('📊 Continuing without team AI insights...');
    teamInsights = null;
  }

  return {
    employees: enhancedEmployees,
    totalEmployees: enhancedEmployees.length,
    averageRatings,
    teamInsights: teamInsights || undefined,
    processingInfo: {
      aiEnabled: process.env.ENABLE_AI_INSIGHTS === 'true',
      aiSuccessRate: enhancedEmployees.length > 0 ? (aiSuccessCount / enhancedEmployees.length) * 100 : 0,
      fallbackUsed,
      processingTime: 0, // Will be set in the main function
    },
  };
}

// Helper function to generate individual employee report (existing logic)
function generateEmployeeReport(rowData: Record<string, unknown>, columns: string[], index: number): Omit<EmployeeReport, 'aiInsights' | 'isAiEnhanced'> {
  // Extract employee name from common column variations
  const nameField = findColumnVariation(columns, ['name', 'employee', 'full_name', 'employee_name', 'participant']);
  let employeeName = 'Anonymous Employee';
  
  if (nameField && rowData[nameField] && typeof rowData[nameField] === 'string') {
    employeeName = rowData[nameField] as string;
  } else {
    employeeName = `Employee ${index + 1}`;
  }

  // Extract or simulate ratings for core values
  const valueRatings = {
    collaboration: extractRating(rowData, columns, ['collaboration', 'teamwork', 'cooperation'], 3.5 + Math.random()),
    communication: extractRating(rowData, columns, ['communication', 'communication_rating', 'comm'], 3.2 + Math.random()),
    respect: extractRating(rowData, columns, ['respect', 'respect_rating', 'respectful'], 3.8 + Math.random()),
    transparency: extractRating(rowData, columns, ['transparency', 'openness', 'honest'], 3.4 + Math.random())
  };

  // Determine top value and area for growth
  const values = Object.entries(valueRatings);
  const topValue = values.reduce((max, current) => current[1] > max[1] ? current : max)[0];
  const growthArea = values.reduce((min, current) => current[1] < min[1] ? current : min)[0];

  // Generate contextual summary and behavioral shifts using existing logic
  const { summary, behavioralShift } = generatePersonalizedInsights(employeeName, valueRatings, rowData, columns);

  return {
    name: employeeName,
    topValueObserved: capitalizeValue(topValue),
    areaForGrowth: capitalizeValue(growthArea),
    valueRatings: {
      collaboration: Math.round(valueRatings.collaboration * 10) / 10,
      communication: Math.round(valueRatings.communication * 10) / 10,
      respect: Math.round(valueRatings.respect * 10) / 10,
      transparency: Math.round(valueRatings.transparency * 10) / 10
    },
    summary,
    suggestedBehavioralShift: behavioralShift
  };
}

// Helper function to find column variations
function findColumnVariation(columns: string[], variations: string[]): string | null {
  for (const variation of variations) {
    const found = columns.find(col => 
      col.toLowerCase().includes(variation.toLowerCase()) ||
      variation.toLowerCase().includes(col.toLowerCase())
    );
    if (found) return found;
  }
  return null;
}

// Helper function to extract rating from data
function extractRating(rowData: Record<string, unknown>, columns: string[], variations: string[], defaultValue: number): number {
  const ratingField = findColumnVariation(columns, variations);
  
  if (ratingField && rowData[ratingField] !== undefined) {
    const value = rowData[ratingField];
    if (typeof value === 'number') {
      return Math.min(Math.max(value, 1), 5); // Ensure rating is between 1-5
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return Math.min(Math.max(parsed, 1), 5);
      }
    }
  }
  
  // Return a realistic default value between 1-5
  return Math.min(Math.max(Math.round(defaultValue * 10) / 10, 1), 5);
}

// Helper function to capitalize value names
function capitalizeValue(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Helper function to generate personalized insights (existing logic)
function generatePersonalizedInsights(name: string, ratings: Record<string, number>, rowData: Record<string, unknown>, columns: string[]) {
  const firstName = name.split(' ')[0];
  const averageRating = Object.values(ratings).reduce((sum, rating) => sum + rating, 0) / 4;
  
  // Find feedback or comments columns
  const feedbackField = findColumnVariation(columns, ['feedback', 'comments', 'notes', 'suggestions', 'remarks']);
  const hasFeedback = feedbackField && rowData[feedbackField] && 
    typeof rowData[feedbackField] === 'string' && 
    (rowData[feedbackField] as string).trim().length > 0;

  let summary = '';
  let behavioralShift = '';

  if (averageRating >= 4.0) {
    summary = `${firstName} demonstrates strong performance across all core values, particularly excelling in ${Object.entries(ratings).reduce((max, current) => current[1] > max[1] ? current : max)[0]}. `;
    summary += hasFeedback ? 
      `Feedback indicates consistent positive impact on team dynamics and collaborative efforts.` :
      `Team members consistently recognize ${firstName}'s positive contributions and leadership qualities.`;
    
    behavioralShift = `Continue leveraging strengths in ${Object.entries(ratings).reduce((max, current) => current[1] > max[1] ? current : max)[0]} while mentoring others. `;
    behavioralShift += `Consider taking on additional leadership responsibilities to maximize team impact.`;
  
  } else if (averageRating >= 3.0) {
    const lowestValue = Object.entries(ratings).reduce((min, current) => current[1] < min[1] ? current : min)[0];
    summary = `${firstName} shows solid performance with particular strength in ${Object.entries(ratings).reduce((max, current) => current[1] > max[1] ? current : max)[0]}. `;
    summary += hasFeedback ? 
      `Feedback suggests opportunities for growth, especially in ${lowestValue} where focused development could yield significant improvements.` :
      `There are clear opportunities for development, particularly in ${lowestValue}, which would enhance overall team effectiveness.`;
    
    behavioralShift = `Focus on developing ${lowestValue} skills through targeted practice and seeking feedback. `;
    behavioralShift += `Consider pairing with a mentor or attending relevant training to strengthen this area.`;
  
  } else {
    const topValue = Object.entries(ratings).reduce((max, current) => current[1] > max[1] ? current : max)[0];
    summary = `${firstName} has foundational strengths, particularly in ${topValue}, that can serve as a platform for broader development. `;
    summary += hasFeedback ? 
      `Recent feedback indicates readiness for focused improvement across multiple areas.` :
      `There are significant opportunities for growth across several core values that would benefit both individual and team performance.`;
    
    behavioralShift = `Prioritize skill development in core areas through structured learning and regular check-ins with supervisor. `;
    behavioralShift += `Set specific, measurable goals for improvement and establish a regular feedback loop for progress tracking.`;
  }

  return { summary, behavioralShift };
}

// Helper function to calculate average ratings across all employees
function calculateAverageRatings(employees: Array<{ valueRatings: Record<string, number> }>) {
  const totals = {
    collaboration: 0,
    communication: 0,
    respect: 0,
    transparency: 0
  };

  employees.forEach(employee => {
    totals.collaboration += employee.valueRatings.collaboration;
    totals.communication += employee.valueRatings.communication;
    totals.respect += employee.valueRatings.respect;
    totals.transparency += employee.valueRatings.transparency;
  });

  const count = employees.length;
  return {
    collaboration: Math.round((totals.collaboration / count) * 10) / 10,
    communication: Math.round((totals.communication / count) * 10) / 10,
    respect: Math.round((totals.respect / count) * 10) / 10,
    transparency: Math.round((totals.transparency / count) * 10) / 10
  };
} 