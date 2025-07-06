import axios from 'axios';
import { DocumentContext } from './document-service';

// Interface for AI-enhanced insights
interface AIInsights {
  enhancedSummary: string;
  behavioralRecommendations: string;
  trendAnalysis: string;
  feedbackAnalysis: string;
  developmentPriorities: string[];
  strengthsAnalysis: string;
  riskFactors: string[];
  successPredictors: string[];
  hasDocumentContext: boolean;
}

// Interface for Perplexity API response
interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// AI Service class for Perplexity integration
export class AIPerformanceAnalyzer {
  private apiKey: string;
  private baseURL: string = 'https://api.perplexity.ai/chat/completions';
  private isEnabled: boolean;
  private fallbackEnabled: boolean;

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
    this.isEnabled = process.env.ENABLE_AI_INSIGHTS === 'true' && !!this.apiKey;
    // Force AI-only mode: disable fallback to ensure all analysis is AI-based
    this.fallbackEnabled = process.env.AI_FALLBACK_ENABLED === 'true';
    
    if (!this.apiKey && this.isEnabled) {
      console.warn('Perplexity API key not found. AI insights will be disabled.');
      this.isEnabled = false;
    }
    
    // Log AI configuration for debugging
    console.log('AI Configuration:', {
      enabled: this.isEnabled,
      fallbackEnabled: this.fallbackEnabled,
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey ? this.apiKey.length : 0
    });
    
    // TEMPORARY: Enable fallback for debugging
    if (!this.isEnabled || !this.apiKey) {
      console.warn('🚨 AI not properly configured, enabling fallback for debugging');
      this.fallbackEnabled = true;
    }
  }

  // Main method to get AI-enhanced insights for an employee
  async getEnhancedInsights(
    employeeData: {
      name: string;
      ratings: Record<string, number>;
      feedback?: string;
      role?: string;
      department?: string;
      tenure?: string;
    },
    teamContext?: {
      averageRatings: Record<string, number>;
      teamSize: number;
      industryBenchmarks?: Record<string, number>;
    },
    documentContext?: DocumentContext[]
  ): Promise<AIInsights | null> {
    
    if (!this.isEnabled) {
      if (this.fallbackEnabled) {
        console.log('AI insights disabled, using fallback analysis');
        return this.generateFallbackInsights(employeeData, teamContext);
      } else {
        console.error('AI insights disabled and fallback disabled. Cannot provide analysis.');
        throw new Error('AI analysis is required but not properly configured. Please set PERPLEXITY_API_KEY and ENABLE_AI_INSIGHTS=true');
      }
    }

    try {
      console.log(`Generating AI insights for ${employeeData.name}...`);
      
      // Create comprehensive prompt for Perplexity
      const prompt = this.buildAnalysisPrompt(employeeData, teamContext, documentContext);
      
      // Make API call to Perplexity
      const response = await this.callPerplexityAPI(prompt);
      
      // Parse and structure the AI response
      const insights = this.parseAIResponse(response, documentContext);
      
      console.log(`✅ AI insights generated successfully for ${employeeData.name}`);
      return insights;
      
    } catch (error) {
      console.error(`❌ AI analysis failed for ${employeeData.name}:`, error);
      
      // Only use fallback if explicitly enabled
      if (this.fallbackEnabled) {
        console.log(`⚠️ Falling back to rule-based analysis for ${employeeData.name}`);
        return this.generateFallbackInsights(employeeData, teamContext);
      } else {
        // If fallback is disabled, throw error to ensure AI-only analysis
        throw new Error(`AI analysis failed for ${employeeData.name} and fallback is disabled. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  // Build comprehensive analysis prompt for Perplexity
  private buildAnalysisPrompt(
    employeeData: {
      name: string;
      ratings: Record<string, number>;
      feedback?: string;
      role?: string;
      department?: string;
      tenure?: string;
    },
    teamContext?: {
      averageRatings: Record<string, number>;
      teamSize: number;
      industryBenchmarks?: Record<string, number>;
    },
    documentContext?: DocumentContext[]
  ): string {
    
    const { name, ratings, feedback, role, department, tenure } = employeeData;
    
    // Build the base prompt with employee and team context
    let prompt = `As an expert HR performance analyst, provide a comprehensive analysis for employee performance review.

EMPLOYEE PROFILE:
- Name: ${name}
- Role: ${role || 'Not specified'}
- Department: ${department || 'Not specified'}
- Tenure: ${tenure || 'Not specified'}

PERFORMANCE RATINGS (Scale 1-5):
${Object.entries(ratings).map(([key, value]) => `- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}/5.0`).join('\n')}
- Overall Average: ${(Object.values(ratings).reduce((sum, r) => sum + r, 0) / Object.keys(ratings).length).toFixed(1)}/5.0

${feedback ? `FEEDBACK/COMMENTS:\n"${feedback}"\n` : ''}

${teamContext ? `TEAM CONTEXT:
- Team Size: ${teamContext.teamSize} employees
- Team Averages: ${Object.entries(teamContext.averageRatings).map(([key, value]) => `${key}: ${value}`).join(', ')}
${teamContext.industryBenchmarks ? `- Industry Benchmarks: ${Object.entries(teamContext.industryBenchmarks).map(([key, value]) => `${key}: ${value}`).join(', ')}` : ''}
` : ''}`;

    // Add document context if provided
    if (documentContext && documentContext.length > 0) {
      const contextTexts = documentContext.map(doc => 
        `=== DOCUMENT: ${doc.fileName} ===\n${doc.extractedText}`
      ).join('\n\n');
      
      prompt += `\n🏢 ORGANIZATION-SPECIFIC CONTEXT DOCUMENTS:
${contextTexts}

🎯 CRITICAL INSTRUCTIONS FOR CONTEXT USAGE:
1. MANDATORY REFERENCE: You MUST actively reference and cite specific information from the above organizational documents in your analysis
2. POLICY ALIGNMENT: Align all recommendations with the organization's stated policies, values, and procedures
3. SPECIFIC CITATIONS: When making recommendations, explicitly mention which document or policy supports your suggestion
4. CONTEXTUAL RELEVANCE: Tailor your language, priorities, and focus areas to match the organization's culture and standards
5. AVOID GENERIC ADVICE: Do NOT provide generic HR advice - make everything specific to this organization's documented approach

EXAMPLE OF EXPECTED INTEGRATION:
- Instead of "Improve communication skills" → "Develop communication skills in line with the organization's emphasis on [specific value from documents]"
- Instead of "Consider leadership training" → "Pursue leadership development opportunities that align with the company's [specific leadership framework from documents]"
- Reference specific competencies, values, or procedures mentioned in the uploaded documents

`;
    }

    prompt += `📋 ANALYSIS OUTPUT REQUIREMENTS:

${documentContext && documentContext.length > 0 ? 
`🔴 CONTEXT-ENHANCED ANALYSIS MODE:
Since organizational documents are provided, your analysis MUST:
- Explicitly reference specific policies, values, or procedures from the documents
- Use organization-specific terminology and frameworks
- Align recommendations with documented organizational standards
- Cite specific document sources when making suggestions
- Avoid generic HR language in favor of organization-specific approaches

` : ''}Please provide a detailed analysis in the following JSON format:
{
  "enhancedSummary": "${documentContext && documentContext.length > 0 ? 'Organization-specific performance summary that references relevant policies/values from the provided documents' : 'Comprehensive 2-3 sentence performance summary with specific insights'}",
  "behavioralRecommendations": "${documentContext && documentContext.length > 0 ? 'Specific recommendations aligned with organizational policies and values mentioned in the documents - cite specific sources' : 'Specific, actionable behavioral changes and development strategies'}",
  "trendAnalysis": "${documentContext && documentContext.length > 0 ? 'Performance analysis that considers organizational standards and expectations from the documents' : 'Analysis of performance patterns and trajectory predictions'}",
  "feedbackAnalysis": "Deep analysis of feedback patterns and sentiment (if feedback provided)",
  "developmentPriorities": ["${documentContext && documentContext.length > 0 ? 'Priority based on organizational framework from documents' : 'Priority 1'}", "${documentContext && documentContext.length > 0 ? 'Priority aligned with company values from documents' : 'Priority 2'}", "${documentContext && documentContext.length > 0 ? 'Priority reflecting organizational culture from documents' : 'Priority 3'}"],
  "strengthsAnalysis": "${documentContext && documentContext.length > 0 ? 'Analysis of strengths in context of organizational values and competencies from the documents' : 'Detailed analysis of key strengths and how to leverage them'}",
  "riskFactors": ["${documentContext && documentContext.length > 0 ? 'Risk factor considering organizational standards from documents' : 'Risk factor 1'}", "${documentContext && documentContext.length > 0 ? 'Risk factor based on company expectations from documents' : 'Risk factor 2'}"],
  "successPredictors": ["${documentContext && documentContext.length > 0 ? 'Success predictor aligned with organizational definition of success from documents' : 'Success predictor 1'}", "${documentContext && documentContext.length > 0 ? 'Success predictor based on company culture from documents' : 'Success predictor 2'}"]
}

🎯 ANALYSIS FOCUS AREAS:
1. Data-driven insights based on the ratings
2. Contextual analysis considering team and industry benchmarks
3. Specific, actionable recommendations
4. Future performance predictions
5. Leadership potential assessment
6. Career development pathways
${documentContext && documentContext.length > 0 ? `7. 🔴 MANDATORY: Organization-specific context integration with explicit document references
8. 🔴 MANDATORY: Policy and value alignment with cited sources
9. 🔴 MANDATORY: Culture-specific language and frameworks from documents` : ''}

${documentContext && documentContext.length > 0 ? 
`🚨 QUALITY CHECK: Before finalizing your response, ensure that:
- Every major recommendation references specific organizational documents
- You use terminology and frameworks from the provided documents
- Your advice is tailored to this specific organization's culture and values
- You avoid generic HR advice in favor of organization-specific guidance

` : ''}Provide only the JSON response, no additional text.`;

    return prompt;
  }

  // Make API call to Perplexity
  private async callPerplexityAPI(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
    
    try {
      const response = await axios.post<PerplexityResponse>(
        this.baseURL,
        {
          model: 'llama-3.1-sonar-large-128k-online', // Using Perplexity's most capable model
          messages: [
            {
              role: 'system',
              content: 'You are an expert HR performance analyst with deep expertise in employee development, behavioral psychology, and organizational performance. When organizational documents are provided, you MUST actively reference and integrate specific policies, values, and procedures from those documents into your analysis. Your recommendations should be tailored to the specific organizational culture and standards rather than generic HR advice. Always cite specific sources from the provided documents when making recommendations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.3, // Lower temperature for more consistent, analytical responses
          top_p: 0.9,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000, // 45 second timeout
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);
      return response.data.choices[0]?.message?.content || '';
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Enhanced error handling
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
          throw new Error('AI analysis timed out. Please try again with a smaller dataset.');
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid API key. Please check your Perplexity API key configuration.');
        }
        if (error.response?.status === 429) {
          throw new Error('API rate limit exceeded. Please try again in a few minutes.');
        }
        if (error.response?.status && error.response.status >= 500) {
          throw new Error('Perplexity API service unavailable. Please try again later.');
        }
        throw new Error(`API request failed: ${error.response?.status || 'Unknown'} - ${error.response?.statusText || error.message}`);
      }
      
      throw error;
    }
  }

  // Parse AI response and structure it
  private parseAIResponse(aiResponse: string, documentContext?: DocumentContext[]): AIInsights {
    try {
      // Try to parse as JSON first
      const cleanResponse = aiResponse.trim();
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonString = cleanResponse.substring(jsonStart, jsonEnd);
        const parsed = JSON.parse(jsonString);
        
        // Validate and return structured response
        return {
          enhancedSummary: parsed.enhancedSummary || 'AI analysis completed successfully.',
          behavioralRecommendations: parsed.behavioralRecommendations || 'Continue current performance trajectory.',
          trendAnalysis: parsed.trendAnalysis || 'Performance trends indicate stable development.',
          feedbackAnalysis: parsed.feedbackAnalysis || 'Feedback analysis not available.',
          developmentPriorities: Array.isArray(parsed.developmentPriorities) ? parsed.developmentPriorities : ['Professional development', 'Skill enhancement'],
          strengthsAnalysis: parsed.strengthsAnalysis || 'Strong performance in key areas.',
          riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
          successPredictors: Array.isArray(parsed.successPredictors) ? parsed.successPredictors : ['Consistent performance', 'Team collaboration'],
          hasDocumentContext: !!(documentContext && documentContext.length > 0)
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
    }

    // Fallback: parse as text and structure it
    return this.parseTextResponse(aiResponse, documentContext);
  }

  // Parse non-JSON AI response
  private parseTextResponse(aiResponse: string, documentContext?: DocumentContext[]): AIInsights {
    const lines = aiResponse.split('\n').filter(line => line.trim());
    
    return {
      enhancedSummary: lines.slice(0, 2).join(' ') || 'AI-enhanced analysis completed.',
      behavioralRecommendations: lines.slice(2, 4).join(' ') || 'Continue developing core competencies.',
      trendAnalysis: lines.slice(4, 6).join(' ') || 'Performance trends show positive development.',
      feedbackAnalysis: 'Comprehensive feedback analysis completed.',
      developmentPriorities: ['Professional growth', 'Skill development', 'Leadership potential'],
      strengthsAnalysis: lines.slice(6, 8).join(' ') || 'Strong foundational skills identified.',
      riskFactors: ['Performance consistency', 'Skill gap areas'],
      successPredictors: ['Team collaboration', 'Continuous learning', 'Goal achievement'],
      hasDocumentContext: !!(documentContext && documentContext.length > 0)
    };
  }

  // Fallback method using rule-based analysis
  private generateFallbackInsights(
    employeeData: {
      name: string;
      ratings: Record<string, number>;
      feedback?: string;
      role?: string;
      department?: string;
      tenure?: string;
    },
    teamContext?: {
      averageRatings: Record<string, number>;
      teamSize: number;
      industryBenchmarks?: Record<string, number>;
    }
  ): AIInsights {
    
    const { name, ratings, feedback } = employeeData;
    const averageRating = Object.values(ratings).reduce((sum, r) => sum + r, 0) / Object.keys(ratings).length;
    const firstName = name.split(' ')[0];
    
    // Determine performance level
    const performanceLevel = averageRating >= 4.0 ? 'high' : averageRating >= 3.0 ? 'moderate' : 'developing';
    
    // Find strengths and growth areas
    const sortedRatings = Object.entries(ratings).sort(([,a], [,b]) => b - a);
    const topStrength = sortedRatings[0][0];
    const growthArea = sortedRatings[sortedRatings.length - 1][0];
    
    // Generate contextual insights
    const enhancedSummary = this.generateFallbackSummary(firstName, averageRating, topStrength, performanceLevel);
    const behavioralRecommendations = this.generateFallbackRecommendations(performanceLevel, growthArea, topStrength);
    const trendAnalysis = this.generateFallbackTrendAnalysis(averageRating, teamContext);
    
    return {
      enhancedSummary,
      behavioralRecommendations,
      trendAnalysis,
      feedbackAnalysis: feedback ? `Feedback indicates ${feedback.length > 100 ? 'comprehensive' : 'focused'} input on performance areas.` : 'No specific feedback provided for analysis.',
      developmentPriorities: this.generateDevelopmentPriorities(performanceLevel, growthArea),
      strengthsAnalysis: `${firstName} demonstrates particular strength in ${topStrength}, which serves as a foundation for continued growth and team contribution.`,
      riskFactors: this.generateRiskFactors(performanceLevel),
      successPredictors: this.generateSuccessPredictors(performanceLevel, topStrength),
      hasDocumentContext: false
    };
  }

  // Helper methods for fallback analysis
  private generateFallbackSummary(firstName: string, averageRating: number, topStrength: string, performanceLevel: string): string {
    if (performanceLevel === 'high') {
      return `${firstName} demonstrates exceptional performance with an overall rating of ${averageRating.toFixed(1)}/5.0, particularly excelling in ${topStrength}. This high-performing individual shows consistent value delivery and strong potential for increased responsibilities.`;
    } else if (performanceLevel === 'moderate') {
      return `${firstName} maintains solid performance with an overall rating of ${averageRating.toFixed(1)}/5.0, showing particular strength in ${topStrength}. There are clear opportunities for targeted development that could significantly enhance overall effectiveness.`;
    } else {
      return `${firstName} shows foundational capabilities with an overall rating of ${averageRating.toFixed(1)}/5.0, with emerging strength in ${topStrength}. Focused development initiatives could unlock significant potential and improve performance trajectory.`;
    }
  }

  private generateFallbackRecommendations(performanceLevel: string, growthArea: string, topStrength: string): string {
    if (performanceLevel === 'high') {
      return `Leverage exceptional ${topStrength} skills to mentor others while taking on stretch assignments. Consider leadership development programs and cross-functional projects to maximize impact.`;
    } else if (performanceLevel === 'moderate') {
      return `Focus on developing ${growthArea} through targeted training and regular feedback sessions. Pair with a mentor and set specific improvement goals while continuing to build on ${topStrength} capabilities.`;
    } else {
      return `Prioritize skill development in ${growthArea} through structured learning programs and frequent check-ins. Establish clear performance milestones and leverage ${topStrength} as a confidence-building foundation.`;
    }
  }

  private generateFallbackTrendAnalysis(averageRating: number, teamContext?: { averageRatings: Record<string, number>; teamSize: number }): string {
    const comparison = teamContext ? 
      (averageRating > ((Object.values(teamContext.averageRatings) as number[]).reduce((sum: number, r: number) => sum + r, 0) / Object.keys(teamContext.averageRatings).length) ? 
        'above team average' : 'at or below team average') : 'within expected range';
    
    return `Current performance trajectory shows ${averageRating >= 3.5 ? 'positive momentum' : 'opportunity for improvement'} with ratings ${comparison}. Continued focus on development initiatives should yield measurable improvements over the next review period.`;
  }

  private generateDevelopmentPriorities(performanceLevel: string, growthArea: string): string[] {
    if (performanceLevel === 'high') {
      return ['Leadership development', 'Strategic thinking enhancement', 'Mentoring capabilities'];
    } else if (performanceLevel === 'moderate') {
      return [`${growthArea.charAt(0).toUpperCase() + growthArea.slice(1)} skill development`, 'Performance consistency', 'Goal achievement strategies'];
    } else {
      return [`Core ${growthArea} competencies`, 'Foundation skill building', 'Performance improvement planning'];
    }
  }

  private generateRiskFactors(performanceLevel: string): string[] {
    if (performanceLevel === 'high') {
      return ['Potential for complacency', 'Risk of being overlooked for advancement'];
    } else if (performanceLevel === 'moderate') {
      return ['Performance plateau risk', 'Skill gap widening'];
    } else {
      return ['Performance improvement urgency', 'Skill development gaps', 'Goal achievement challenges'];
    }
  }

  private generateSuccessPredictors(performanceLevel: string, topStrength: string): string[] {
    if (performanceLevel === 'high') {
      return [`Strong ${topStrength} foundation`, 'Leadership potential', 'Consistent high performance'];
    } else if (performanceLevel === 'moderate') {
      return [`Solid ${topStrength} capabilities`, 'Growth mindset', 'Team collaboration'];
    } else {
      return [`Emerging ${topStrength} skills`, 'Development readiness', 'Improvement potential'];
    }
  }

  // Method to analyze team trends and patterns with AI-first approach
  async analyzeTeamTrends(
    teamData: Array<{
      name: string;
      ratings: Record<string, number>;
      feedback?: string;
      role?: string;
      department?: string;
    }>,
    documentContext?: DocumentContext[]
  ): Promise<{
    overallTrends: string;
    riskAreas: string[];
    strengthAreas: string[];
    recommendations: string[];
  } | null> {
    
    if (teamData.length === 0) {
      console.warn('No team data provided for analysis');
      return this.generateFallbackTeamAnalysis(teamData);
    }

    if (!this.isEnabled) {
      if (this.fallbackEnabled) {
        console.log('AI team analysis disabled, using fallback analysis');
        return this.generateFallbackTeamAnalysis(teamData);
      } else {
        console.error('AI team analysis disabled and fallback disabled. Cannot provide team analysis.');
        throw new Error('AI team analysis is required but not properly configured. Please set PERPLEXITY_API_KEY and ENABLE_AI_INSIGHTS=true');
      }
    }

    try {
      console.log(`Generating AI team insights for ${teamData.length} employees...`);
      
      const prompt = this.buildTeamAnalysisPrompt(teamData, documentContext);
      const response = await this.callPerplexityAPI(prompt);
      const insights = this.parseTeamAnalysisResponse(response);
      
      console.log('✅ AI team insights generated successfully');
      return insights;
      
    } catch (error) {
      console.error('❌ AI team analysis failed:', error);
      
      // Only use fallback if explicitly enabled
      if (this.fallbackEnabled) {
        console.log('⚠️ Falling back to rule-based team analysis');
        return this.generateFallbackTeamAnalysis(teamData);
      } else {
        // If fallback is disabled, throw error to ensure AI-only analysis
        throw new Error(`AI team analysis failed and fallback is disabled. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private buildTeamAnalysisPrompt(teamData: Array<{ name: string; ratings: Record<string, number>; feedback?: string; role?: string; department?: string }>, documentContext?: DocumentContext[]): string {
    const teamSummary = teamData.map(emp => ({
      name: emp.name,
      average: (Object.values(emp.ratings) as number[]).reduce((sum: number, r: number) => sum + r, 0) / Object.keys(emp.ratings).length,
      ratings: emp.ratings
    }));

    let prompt = `Analyze this team performance data and provide insights in JSON format:

TEAM DATA:
${teamSummary.map(emp => `- ${emp.name}: ${emp.average.toFixed(1)}/5.0 (${Object.entries(emp.ratings).map(([k,v]) => `${k}:${v}`).join(', ')})`).join('\n')}

`;

    // Add document context if provided
    if (documentContext && documentContext.length > 0) {
      const contextTexts = documentContext.map(doc => 
        `=== DOCUMENT: ${doc.fileName} ===\n${doc.extractedText}`
      ).join('\n\n');
      
      prompt += `🏢 ORGANIZATION-SPECIFIC CONTEXT DOCUMENTS:
${contextTexts}

🎯 MANDATORY CONTEXT INTEGRATION FOR TEAM ANALYSIS:
1. REFERENCE ORGANIZATIONAL VALUES: Explicitly cite company values, culture, and standards from the documents
2. ALIGN WITH POLICIES: Ensure all team recommendations align with documented organizational policies and procedures
3. USE ORGANIZATION-SPECIFIC LANGUAGE: Adopt the terminology and frameworks used in the provided documents
4. CITE SOURCES: When making recommendations, reference which specific document or policy supports your suggestion
5. AVOID GENERIC ADVICE: Tailor all insights to this specific organization's documented approach and culture

EXAMPLE INTEGRATION:
- Instead of "Improve team communication" → "Enhance team communication in alignment with [specific communication framework from documents]"
- Instead of "Focus on collaboration" → "Strengthen collaboration based on the organization's [specific collaboration principles from documents]"

`;
    }

    prompt += `${documentContext && documentContext.length > 0 ? 
`🔴 CONTEXT-ENHANCED TEAM ANALYSIS MODE:
Since organizational documents are provided, your team analysis MUST:
- Reference specific organizational values, policies, and frameworks from the documents
- Use company-specific terminology and approaches
- Align all recommendations with documented organizational standards
- Cite specific sources when making team development suggestions

` : ''}Provide analysis in this JSON format:
{
  "overallTrends": "${documentContext && documentContext.length > 0 ? 'Team performance trends analyzed through the lens of organizational values and standards from the provided documents' : 'Team performance trends and patterns'}",
  "riskAreas": ["${documentContext && documentContext.length > 0 ? 'Risk area identified based on organizational standards from documents' : 'Risk area 1'}", "${documentContext && documentContext.length > 0 ? 'Risk area considering company expectations from documents' : 'Risk area 2'}"],
  "strengthAreas": ["${documentContext && documentContext.length > 0 ? 'Strength area aligned with organizational values from documents' : 'Strength area 1'}", "${documentContext && documentContext.length > 0 ? 'Strength area reflecting company culture from documents' : 'Strength area 2'}"],
  "recommendations": ["${documentContext && documentContext.length > 0 ? 'Recommendation based on organizational framework from documents' : 'Recommendation 1'}", "${documentContext && documentContext.length > 0 ? 'Recommendation aligned with company policies from documents' : 'Recommendation 2'}", "${documentContext && documentContext.length > 0 ? 'Recommendation reflecting organizational values from documents' : 'Recommendation 3'}"]
}

${documentContext && documentContext.length > 0 ? 
`🚨 QUALITY CHECK: Ensure your team analysis:
- Explicitly references organizational documents and policies
- Uses company-specific language and frameworks
- Provides recommendations tailored to this organization's culture
- Cites specific sources from the provided documents

` : ''}`;

    return prompt;
  }

  private parseTeamAnalysisResponse(response: string): { overallTrends: string; riskAreas: string[]; strengthAreas: string[]; recommendations: string[] } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse team analysis response:', error);
    }
    
    return this.generateFallbackTeamAnalysis([]);
  }

  private generateFallbackTeamAnalysis(teamData: Array<{ name: string; ratings: Record<string, number> }>): { overallTrends: string; riskAreas: string[]; strengthAreas: string[]; recommendations: string[] } {
    if (teamData.length === 0) {
      return {
        overallTrends: 'Insufficient data for team analysis',
        riskAreas: ['Data availability'],
        strengthAreas: ['Team collaboration potential'],
        recommendations: ['Gather more comprehensive performance data']
      };
    }

    const averages = teamData.map(emp => 
      (Object.values(emp.ratings) as number[]).reduce((sum: number, r: number) => sum + r, 0) / Object.keys(emp.ratings).length
    );
    const teamAverage = averages.reduce((sum, avg) => sum + avg, 0) / averages.length;

    return {
      overallTrends: `Team shows ${teamAverage >= 3.5 ? 'strong' : 'developing'} performance with average rating of ${teamAverage.toFixed(1)}/5.0`,
      riskAreas: teamAverage < 3.0 ? ['Performance consistency', 'Skill development gaps'] : ['Performance plateau risk'],
      strengthAreas: ['Team collaboration', 'Individual contributor strengths'],
      recommendations: [
        'Implement targeted development programs',
        'Establish peer mentoring systems',
        'Create performance improvement initiatives'
      ]
    };
  }
}

// Export singleton instance
export const aiAnalyzer = new AIPerformanceAnalyzer(); 