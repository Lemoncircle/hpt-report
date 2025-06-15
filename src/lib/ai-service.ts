import axios from 'axios';

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
    this.fallbackEnabled = process.env.AI_FALLBACK_ENABLED === 'true';
    
    if (!this.apiKey && this.isEnabled) {
      console.warn('Perplexity API key not found. AI insights will be disabled.');
      this.isEnabled = false;
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
    }
  ): Promise<AIInsights | null> {
    
    if (!this.isEnabled) {
      console.log('AI insights disabled, using fallback');
      return this.fallbackEnabled ? this.generateFallbackInsights(employeeData, teamContext) : null;
    }

    try {
      // Create comprehensive prompt for Perplexity
      const prompt = this.buildAnalysisPrompt(employeeData, teamContext);
      
      // Make API call to Perplexity
      const response = await this.callPerplexityAPI(prompt);
      
      // Parse and structure the AI response
      const insights = this.parseAIResponse(response);
      
      return insights;
      
    } catch (error) {
      console.error('AI analysis failed:', error);
      
      // Fallback to rule-based analysis if AI fails
      if (this.fallbackEnabled) {
        console.log('Falling back to rule-based analysis');
        return this.generateFallbackInsights(employeeData, teamContext);
      }
      
      return null;
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
    }
  ): string {
    
    const { name, ratings, feedback, role, department, tenure } = employeeData;
    const averageRating = Object.values(ratings).reduce((sum, r) => sum + r, 0) / Object.keys(ratings).length;
    
    let prompt = `As an expert HR performance analyst, provide a comprehensive analysis for employee performance review.

EMPLOYEE PROFILE:
- Name: ${name}
- Role: ${role || 'Not specified'}
- Department: ${department || 'Not specified'}
- Tenure: ${tenure || 'Not specified'}

PERFORMANCE RATINGS (Scale 1-5):
${Object.entries(ratings).map(([key, value]) => `- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}/5.0`).join('\n')}
- Overall Average: ${averageRating.toFixed(1)}/5.0

${feedback ? `FEEDBACK/COMMENTS:\n"${feedback}"\n` : ''}

${teamContext ? `TEAM CONTEXT:
- Team Size: ${teamContext.teamSize} employees
- Team Averages: ${Object.entries(teamContext.averageRatings).map(([key, value]) => `${key}: ${value}`).join(', ')}
${teamContext.industryBenchmarks ? `- Industry Benchmarks: ${Object.entries(teamContext.industryBenchmarks).map(([key, value]) => `${key}: ${value}`).join(', ')}` : ''}
` : ''}

Please provide a detailed analysis in the following JSON format:
{
  "enhancedSummary": "Comprehensive 2-3 sentence performance summary with specific insights",
  "behavioralRecommendations": "Specific, actionable behavioral changes and development strategies",
  "trendAnalysis": "Analysis of performance patterns and trajectory predictions",
  "feedbackAnalysis": "Deep analysis of feedback patterns and sentiment (if feedback provided)",
  "developmentPriorities": ["Priority 1", "Priority 2", "Priority 3"],
  "strengthsAnalysis": "Detailed analysis of key strengths and how to leverage them",
  "riskFactors": ["Risk factor 1", "Risk factor 2"],
  "successPredictors": ["Success predictor 1", "Success predictor 2"]
}

Focus on:
1. Data-driven insights based on the ratings
2. Contextual analysis considering team and industry benchmarks
3. Specific, actionable recommendations
4. Future performance predictions
5. Leadership potential assessment
6. Career development pathways

Provide only the JSON response, no additional text.`;

    return prompt;
  }

  // Make API call to Perplexity
  private async callPerplexityAPI(prompt: string): Promise<string> {
    const response = await axios.post<PerplexityResponse>(
      this.baseURL,
      {
        model: 'llama-3.1-sonar-large-128k-online', // Using Perplexity's most capable model
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR performance analyst with deep expertise in employee development, behavioral psychology, and organizational performance. Provide data-driven, actionable insights.'
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
        timeout: 30000 // 30 second timeout
      }
    );

    return response.data.choices[0]?.message?.content || '';
  }

  // Parse AI response and structure it
  private parseAIResponse(aiResponse: string): AIInsights {
    try {
      // Try to parse as JSON first
      const cleanResponse = aiResponse.trim();
      let jsonStart = cleanResponse.indexOf('{');
      let jsonEnd = cleanResponse.lastIndexOf('}') + 1;
      
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
          successPredictors: Array.isArray(parsed.successPredictors) ? parsed.successPredictors : ['Consistent performance', 'Team collaboration']
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
    }

    // Fallback: parse as text and structure it
    return this.parseTextResponse(aiResponse);
  }

  // Parse non-JSON AI response
  private parseTextResponse(aiResponse: string): AIInsights {
    const lines = aiResponse.split('\n').filter(line => line.trim());
    
    return {
      enhancedSummary: lines.slice(0, 2).join(' ') || 'AI-enhanced analysis completed.',
      behavioralRecommendations: lines.slice(2, 4).join(' ') || 'Continue developing core competencies.',
      trendAnalysis: lines.slice(4, 6).join(' ') || 'Performance trends show positive development.',
      feedbackAnalysis: 'Comprehensive feedback analysis completed.',
      developmentPriorities: ['Professional growth', 'Skill development', 'Leadership potential'],
      strengthsAnalysis: lines.slice(6, 8).join(' ') || 'Strong foundational skills identified.',
      riskFactors: ['Performance consistency', 'Skill gap areas'],
      successPredictors: ['Team collaboration', 'Continuous learning', 'Goal achievement']
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
      riskFactors: this.generateRiskFactors(performanceLevel, averageRating),
      successPredictors: this.generateSuccessPredictors(performanceLevel, topStrength)
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

  private generateFallbackTrendAnalysis(averageRating: number, teamContext?: any): string {
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

  private generateRiskFactors(performanceLevel: string, averageRating: number): string[] {
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

  // Method to analyze team trends and patterns
  async analyzeTeamTrends(
    teamData: Array<{
      name: string;
      ratings: Record<string, number>;
      feedback?: string;
      role?: string;
      department?: string;
    }>
  ): Promise<{
    overallTrends: string;
    riskAreas: string[];
    strengthAreas: string[];
    recommendations: string[];
  } | null> {
    
    if (!this.isEnabled || teamData.length === 0) {
      return this.generateFallbackTeamAnalysis(teamData);
    }

    try {
      const prompt = this.buildTeamAnalysisPrompt(teamData);
      const response = await this.callPerplexityAPI(prompt);
      return this.parseTeamAnalysisResponse(response);
    } catch (error) {
      console.error('Team analysis failed:', error);
      return this.fallbackEnabled ? this.generateFallbackTeamAnalysis(teamData) : null;
    }
  }

  private buildTeamAnalysisPrompt(teamData: Array<any>): string {
    const teamSummary = teamData.map(emp => ({
      name: emp.name,
      average: (Object.values(emp.ratings) as number[]).reduce((sum: number, r: number) => sum + r, 0) / Object.keys(emp.ratings).length,
      ratings: emp.ratings
    }));

    return `Analyze this team performance data and provide insights in JSON format:

TEAM DATA:
${teamSummary.map(emp => `- ${emp.name}: ${emp.average.toFixed(1)}/5.0 (${Object.entries(emp.ratings).map(([k,v]) => `${k}:${v}`).join(', ')})`).join('\n')}

Provide analysis in this JSON format:
{
  "overallTrends": "Team performance trends and patterns",
  "riskAreas": ["Risk area 1", "Risk area 2"],
  "strengthAreas": ["Strength area 1", "Strength area 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}`;
  }

  private parseTeamAnalysisResponse(response: string): any {
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

  private generateFallbackTeamAnalysis(teamData: Array<any>): any {
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