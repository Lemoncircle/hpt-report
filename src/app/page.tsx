'use client';

import { useState } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  User, 
  Users,
  ChevronRight,
  Search,
  Brain,
  Lightbulb,
  AlertTriangle,
  Activity,
  Calendar,
  Mail
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Define interfaces for type safety - updated for AI-enhanced individual employee reports
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

export default function Home() {
  // State management for the application
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Configure dropzone for file upload
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setUploadedFile(acceptedFiles[0]);
        setError(null);
        setSelectedEmployee(0);
        setSearchTerm('');
        analyzeFile(acceptedFiles[0]);
      }
    }
  });

  // Analyze the uploaded Excel file using the API endpoint
  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Create form data to send the file to our API
      const formData = new FormData();
      formData.append('file', file);

      // Call our analysis API endpoint
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      setReportData(result.report);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze the file. Please ensure it\'s a valid Excel file.';
      setError(errorMessage);
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate and download PDF report for current employee
  const downloadPDF = async () => {
    const reportElement = document.getElementById('employee-report-content');
    if (!reportElement || !reportData) return;

    try {
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const employeeName = reportData.employees[selectedEmployee].name.replace(/\s+/g, '_');
      pdf.save(`${employeeName}_Performance_Report.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  // Filter employees based on search term
  const filteredEmployees = reportData?.employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Get performance level based on average rating
  const getPerformanceLevel = (ratings: Record<string, number>) => {
    const average = Object.values(ratings).reduce((sum, rating) => sum + rating, 0) / 4;
    if (average >= 4.2) return { level: 'Exceptional', color: 'text-emerald-600', bg: 'bg-emerald-50', class: 'performance-exceptional' };
    if (average >= 3.5) return { level: 'Strong', color: 'text-blue-600', bg: 'bg-blue-50', class: 'performance-strong' };
    if (average >= 2.5) return { level: 'Developing', color: 'text-amber-600', bg: 'bg-amber-50', class: 'performance-developing' };
    return { level: 'Needs Focus', color: 'text-red-600', bg: 'bg-red-50', class: 'performance-needs-focus' };
  };

  const currentEmployee = reportData?.employees[selectedEmployee];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Employee Performance Hub</h1>
                  <p className="text-sm text-gray-500">AI-powered performance insights</p>
                </div>
              </div>
            </div>
            {reportData && (
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>{reportData.totalEmployees} Employees</span>
                </div>
                <div className="flex items-center space-x-2">
                  {reportData.processingInfo.aiEnabled ? (
                    <>
                      <Brain className="h-4 w-4 text-purple-500" />
                      <span>AI Enhanced ({reportData.processingInfo.aiSuccessRate.toFixed(0)}%)</span>
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4 text-blue-500" />
                      <span>Rule-Based Analysis</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Upload Employee Data</h2>
              <p className="text-gray-600">Upload your Excel file to generate comprehensive performance reports</p>
            </div>
            
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              
              {uploadedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-3">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <span className="text-lg font-medium text-gray-900">{uploadedFile.name}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                    <span>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>•</span>
                    <span className="text-green-600 font-medium">Ready for Analysis</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className={`mx-auto h-12 w-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {isDragActive ? 'Drop your file here' : 'Drag & drop your Excel file'}
                    </p>
                    <p className="text-gray-500">or click to browse • Supports .xlsx and .xls</p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-800">Analysis Error</h3>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center space-x-4 bg-blue-50 rounded-lg px-6 py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600"></div>
                  <div className="text-left">
                    <p className="font-medium text-blue-900">Processing Your Data</p>
                    <p className="text-sm text-blue-700">Generating AI-enhanced insights...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Employee Reports Section */}
        {reportData && (
          <div className="space-y-8">
            {/* Employee Profile Header (similar to screenshot) */}
            {currentEmployee && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="h-10 w-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-2xl font-semibold text-white">{currentEmployee.name}</h2>
                        {currentEmployee.isAiEnhanced && (
                          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-white/20 rounded-full text-xs font-medium text-white">
                            <Brain className="h-3 w-3" />
                            <span>AI Enhanced</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-6 text-white/90 text-sm">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>employee@company.com</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Last Activity: {new Date().toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">
                        {(Object.values(currentEmployee.valueRatings).reduce((sum, rating) => sum + rating, 0) / 4).toFixed(1)}
                      </div>
                      <div className="text-white/80 text-sm">Overall Score</div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid (similar to screenshot layout) */}
                <div className="p-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {Object.values(currentEmployee.valueRatings).filter(r => r >= 4).length}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Strong Areas</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(Object.values(currentEmployee.valueRatings).filter(r => r >= 4).length / 4) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {Object.values(currentEmployee.valueRatings).filter(r => r >= 3 && r < 4).length}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Developing</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(Object.values(currentEmployee.valueRatings).filter(r => r >= 3 && r < 4).length / 4) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {Object.values(currentEmployee.valueRatings).filter(r => r < 3).length}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Growth Areas</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-amber-500 h-2 rounded-full" 
                          style={{ width: `${(Object.values(currentEmployee.valueRatings).filter(r => r < 3).length / 4) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {currentEmployee.aiInsights?.developmentPriorities.length || 3}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Priorities</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="bg-purple-500 h-2 rounded-full w-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Breakdown */}
                  <div className="space-y-6" id="employee-report-content">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Breakdown</h3>
                    
                    <div className="grid gap-4">
                      {Object.entries(currentEmployee.valueRatings).map(([value, rating]) => (
                        <div key={value} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${
                              rating >= 4 ? 'bg-green-500' : 
                              rating >= 3 ? 'bg-blue-500' : 
                              rating >= 2 ? 'bg-amber-500' : 'bg-red-500'
                            }`}></div>
                            <span className="font-medium text-gray-900 capitalize">{value}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  rating >= 4 ? 'bg-green-500' : 
                                  rating >= 3 ? 'bg-blue-500' : 
                                  rating >= 2 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${(rating / 5) * 100}%` }}
                              ></div>
                            </div>
                            <span className="font-semibold text-gray-900 w-8">{rating}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* AI Insights */}
                    {currentEmployee.isAiEnhanced && currentEmployee.aiInsights && (
                      <div className="mt-8 space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                          <Brain className="h-5 w-5 text-purple-500" />
                          <span>AI-Enhanced Insights</span>
                        </h3>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-purple-50 rounded-lg p-6">
                            <h4 className="font-semibold text-purple-900 mb-3 flex items-center space-x-2">
                              <Lightbulb className="h-4 w-4" />
                              <span>Development Priorities</span>
                            </h4>
                            <ul className="space-y-2">
                              {currentEmployee.aiInsights.developmentPriorities.map((priority, index) => (
                                <li key={index} className="text-purple-800 text-sm flex items-start space-x-2">
                                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                                  <span>{priority}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-amber-50 rounded-lg p-6">
                            <h4 className="font-semibold text-amber-900 mb-3 flex items-center space-x-2">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Risk Factors</span>
                            </h4>
                            <ul className="space-y-2">
                              {currentEmployee.aiInsights.riskFactors.map((risk, index) => (
                                <li key={index} className="text-amber-800 text-sm flex items-start space-x-2">
                                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                                  <span>{risk}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-6">
                          <h4 className="font-semibold text-blue-900 mb-3">Trend Analysis</h4>
                          <p className="text-blue-800">{currentEmployee.aiInsights.trendAnalysis}</p>
                        </div>
                      </div>
                    )}

                    {/* Summary and Recommendations */}
                    <div className="mt-8 space-y-6">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Performance Summary</h4>
                        <p className="text-gray-700">{currentEmployee.summary}</p>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-6">
                        <h4 className="font-semibold text-blue-900 mb-3">Recommended Actions</h4>
                        <p className="text-blue-800">{currentEmployee.suggestedBehavioralShift}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Employee List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                <button
                  onClick={downloadPDF}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Report</span>
                </button>
              </div>
              
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Employee Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees.map((employee, index) => {
                  const employeeIndex = reportData.employees.findIndex(e => e.name === employee.name);
                  const performance = getPerformanceLevel(employee.valueRatings);
                  const averageRating = Object.values(employee.valueRatings).reduce((sum, rating) => sum + rating, 0) / 4;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedEmployee(employeeIndex)}
                      className={`text-left p-4 rounded-lg border transition-all ${
                        selectedEmployee === employeeIndex
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${performance.bg}`}>
                            <User className={`h-5 w-5 ${performance.color}`} />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                              <span>{employee.name}</span>
                              {employee.isAiEnhanced && (
                                <Brain className="h-3 w-3 text-purple-500" />
                              )}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              performance.level === 'Exceptional' ? 'bg-green-100 text-green-800' :
                              performance.level === 'Strong' ? 'bg-blue-100 text-blue-800' :
                              performance.level === 'Developing' ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {performance.level}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 transition-transform ${
                          selectedEmployee === employeeIndex ? 'rotate-90 text-blue-500' : 'text-gray-400'
                        }`} />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Top: {employee.topValueObserved}</span>
                        <span className="font-semibold text-gray-900">{averageRating.toFixed(1)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Team Performance Overview</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {Object.entries(reportData.averageRatings).map(([value, rating]) => (
                  <div key={value} className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{rating.toFixed(1)}</div>
                    <div className="text-sm text-gray-500 font-medium capitalize mb-2">{value}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          rating >= 4 ? 'bg-green-500' : 
                          rating >= 3 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${(rating / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Team Insights */}
              {reportData.teamInsights && (
                <div className="bg-purple-50 rounded-lg p-6">
                  <h4 className="font-semibold text-purple-900 mb-4 flex items-center space-x-2">
                    <Brain className="h-5 w-5" />
                    <span>AI Team Analysis</span>
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium text-purple-900 mb-2">Overall Trends</h5>
                      <p className="text-purple-800 text-sm">{reportData.teamInsights.overallTrends}</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-green-900 mb-2">Strengths</h5>
                        <ul className="space-y-1">
                          {reportData.teamInsights.strengthAreas.map((strength, index) => (
                            <li key={index} className="text-green-800 text-sm">• {strength}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-amber-900 mb-2">Risk Areas</h5>
                        <ul className="space-y-1">
                          {reportData.teamInsights.riskAreas.map((risk, index) => (
                            <li key={index} className="text-amber-800 text-sm">• {risk}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
