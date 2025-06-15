'use client';

import { useState } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  User, 
  TrendingUp, 
  Target,
  Star,
  Award,
  Users,
  BarChart3,
  Eye,
  ChevronRight,
  Search,
  Sparkles,
  Zap,
  Shield,
  Clock,
  Brain,
  Lightbulb,
  AlertTriangle,
  TrendingDown,
  Activity
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
  const performanceLevel = currentEmployee ? getPerformanceLevel(currentEmployee.valueRatings) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 bg-dots-pattern">
      {/* Premium Header with Glassmorphism */}
      <header className="header-glass sticky top-0 z-50 border-b border-white/20">
        <div className="container-custom py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-premium float">
                <FileSpreadsheet className="h-8 w-8 text-white" />
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient mb-1">
                  Employee Performance Hub
                </h1>
                <p className="text-slate-600 text-sm font-medium">
                  AI-powered insights for exceptional team performance
                </p>
              </div>
            </div>
            {reportData && (
              <div className="glass-card rounded-xl px-4 py-3 flex items-center space-x-6 text-sm text-slate-700">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold">{reportData.totalEmployees} Employees</span>
                </div>
                <div className="h-4 w-px bg-slate-300"></div>
                <div className="flex items-center space-x-2">
                  {reportData.processingInfo.aiEnabled ? (
                    <>
                      <Brain className="h-4 w-4 text-purple-500" />
                      <span className="font-semibold">AI Enhanced ({reportData.processingInfo.aiSuccessRate.toFixed(0)}%)</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-emerald-500" />
                      <span className="font-semibold">Rule-Based Analysis</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container-custom py-12">
        {/* Premium Upload Section with Glassmorphism */}
        <div className="premium-card p-12 mb-12 slide-up">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50/80 backdrop-blur-sm rounded-full border border-blue-200/50 mb-4">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-blue-700">Upload & Transform</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-3 text-balance">
                Transform Your Employee Data
              </h2>
              <p className="text-xl text-slate-600 text-balance">
                Advanced AI analytics to unlock performance insights and drive meaningful growth
              </p>
            </div>
            
            <div
              {...getRootProps()}
              className={`upload-zone ${isDragActive ? 'active' : ''} relative z-10`}
            >
              <input {...getInputProps()} />
              
              <div className={`relative z-10 transition-all duration-300 ${isDragActive ? 'scale-110' : ''}`}>
                <div className="relative">
                  <Upload className={`mx-auto h-16 w-16 mb-6 transition-all duration-300 ${isDragActive ? 'text-blue-500 scale-110' : 'text-slate-400'}`} />
                  {isDragActive && (
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                  )}
                </div>
              </div>
              
              {uploadedFile ? (
                <div className="space-y-4 fade-in relative z-10">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="relative">
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
                    </div>
                    <span className="text-xl font-bold text-slate-800">{uploadedFile.name}</span>
                  </div>
                  <div className="glass-card rounded-xl px-6 py-4 inline-flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="h-4 w-px bg-slate-300"></div>
                    <div className="flex items-center space-x-2 text-sm text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-semibold">Ready for Analysis</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 relative z-10">
                  <div className="space-y-3">
                    <p className="text-2xl font-bold text-slate-800">
                      {isDragActive
                        ? 'Drop your Excel file here'
                        : 'Drag & drop your Excel file or click to browse'}
                    </p>
                    <p className="text-lg text-slate-600">
                      Supports .xlsx and .xls • Include employee names and performance ratings
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
                    <div className="text-center">
                      <div className="glass-card rounded-lg p-3 mb-2">
                        <Shield className="h-6 w-6 text-emerald-500 mx-auto" />
                      </div>
                      <span className="text-xs font-medium text-slate-600">Secure Processing</span>
                    </div>
                    <div className="text-center">
                      <div className="glass-card rounded-lg p-3 mb-2">
                        <Brain className="h-6 w-6 text-purple-500 mx-auto" />
                      </div>
                      <span className="text-xs font-medium text-slate-600">AI Enhanced</span>
                    </div>
                    <div className="text-center">
                      <div className="glass-card rounded-lg p-3 mb-2">
                        <Clock className="h-6 w-6 text-blue-500 mx-auto" />
                      </div>
                      <span className="text-xs font-medium text-slate-600">No Data Storage</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-8 glass-card border border-red-200 rounded-2xl p-6 slide-up">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-800 mb-1">Analysis Error</h3>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="mt-12 text-center slide-up">
                <div className="premium-card p-8 inline-block">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                      <div className="absolute inset-2 rounded-full bg-blue-50"></div>
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">Processing Your Data</h3>
                      <p className="text-slate-600">Generating AI-enhanced insights for each employee...</p>
                      <div className="flex items-center space-x-4 mt-3 text-sm text-slate-500">
                        <span>• AI Analysis</span>
                        <span>• Performance Scoring</span>
                        <span>• Behavioral Insights</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Employee Reports Section */}
        {reportData && (
          <div className="space-y-12">
            {/* Team Dashboard with Premium Styling and AI Info */}
            <div className="premium-card p-8 slide-up">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Team Dashboard</h2>
                    <p className="text-slate-600 font-medium">{reportData.totalEmployees} individual reports • Advanced AI insights</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* AI Processing Info */}
                  <div className="glass-card rounded-xl px-4 py-3 text-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      {reportData.processingInfo.aiEnabled ? (
                        <Brain className="h-4 w-4 text-purple-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="font-semibold text-slate-700">
                        {reportData.processingInfo.aiEnabled ? 'AI Enhanced' : 'Rule-Based'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {reportData.processingInfo.aiEnabled && (
                        <span>Success: {reportData.processingInfo.aiSuccessRate.toFixed(0)}% • </span>
                      )}
                      {reportData.processingInfo.processingTime}ms
                    </div>
                  </div>
                  
                  <button
                    onClick={downloadPDF}
                    className="btn-primary flex items-center space-x-3"
                  >
                    <Download className="h-5 w-5" />
                    <span>Export Report</span>
                  </button>
                </div>
              </div>
              
              {/* Premium Search */}
              <div className="mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search employees by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              {/* Premium Employee Grid with AI indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map((employee, index) => {
                  const employeeIndex = reportData.employees.findIndex(e => e.name === employee.name);
                  const performance = getPerformanceLevel(employee.valueRatings);
                  const averageRating = Object.values(employee.valueRatings).reduce((sum, rating) => sum + rating, 0) / 4;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedEmployee(employeeIndex)}
                      className={`employee-card ${selectedEmployee === employeeIndex ? 'selected' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-xl ${performance.bg} relative`}>
                            <User className={`h-5 w-5 ${performance.color}`} />
                            {averageRating >= 4.0 && (
                              <Star className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400 fill-current" />
                            )}
                            {employee.isAiEnhanced && (
                              <Brain className="absolute -bottom-1 -right-1 h-3 w-3 text-purple-500 fill-current" />
                            )}
                          </div>
                          <div className="text-left">
                            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                              <span>{employee.name}</span>
                              {employee.isAiEnhanced && (
                                <Sparkles className="h-3 w-3 text-purple-500" />
                              )}
                            </h3>
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${performance.class}`}>
                              {performance.level}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={`h-5 w-5 transition-transform duration-300 ${selectedEmployee === employeeIndex ? 'rotate-90 text-blue-500' : 'text-slate-400'}`} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm font-medium text-slate-600">{employee.topValueObserved}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-slate-900">{averageRating.toFixed(1)}</div>
                          <div className="text-xs text-slate-500 font-medium">Overall</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Premium Individual Employee Report with AI Insights */}
            {currentEmployee && (
              <div className="premium-card overflow-hidden slide-up">
                <div id="employee-report-content" className="p-10 space-y-10">
                  {/* Premium Report Header with AI indicator */}
                  <div className="border-b border-slate-200/60 pb-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className={`p-4 rounded-2xl ${performanceLevel?.bg} relative shadow-lg`}>
                          <Award className={`h-10 w-10 ${performanceLevel?.color}`} />
                          <div className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md">
                            {currentEmployee.isAiEnhanced ? (
                              <Brain className="h-4 w-4 text-purple-500" />
                            ) : (
                              <Sparkles className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </div>
                        <div>
                          <h2 className="text-4xl font-bold text-slate-900 mb-2 flex items-center space-x-3">
                            <span>{currentEmployee.name}</span>
                            {currentEmployee.isAiEnhanced && (
                              <div className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-100 rounded-full">
                                <Brain className="h-4 w-4 text-purple-600" />
                                <span className="text-sm font-semibold text-purple-700">AI Enhanced</span>
                              </div>
                            )}
                          </h2>
                          <div className="flex items-center space-x-4">
                            <span className={`px-4 py-2 rounded-full text-sm font-bold ${performanceLevel?.class}`}>
                              {performanceLevel?.level} Performance
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-sm text-slate-600 font-medium">Generated {new Date().toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-5xl font-bold text-gradient mb-1">
                          {(Object.values(currentEmployee.valueRatings).reduce((sum, rating) => sum + rating, 0) / 4).toFixed(1)}
                        </div>
                        <div className="text-sm text-slate-500 font-semibold">Overall Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Premium Key Insights Cards */}
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="glass-card rounded-2xl p-8 border-l-4 border-emerald-500">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                          <TrendingUp className="h-7 w-7 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-emerald-900">Top Strength</h3>
                      </div>
                      <p className="text-2xl font-bold text-emerald-800 mb-3">{currentEmployee.topValueObserved}</p>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-semibold text-emerald-700">
                          Rated {currentEmployee.valueRatings[currentEmployee.topValueObserved.toLowerCase() as keyof typeof currentEmployee.valueRatings]}/5.0
                        </span>
                      </div>
                    </div>
                    
                    <div className="glass-card rounded-2xl p-8 border-l-4 border-amber-500">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="p-3 bg-amber-100 rounded-xl">
                          <Target className="h-7 w-7 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-bold text-amber-900">Growth Focus</h3>
                      </div>
                      <p className="text-2xl font-bold text-amber-800 mb-3">{currentEmployee.areaForGrowth}</p>
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-semibold text-amber-700">
                          Priority development area
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI-Enhanced Insights Section */}
                  {currentEmployee.isAiEnhanced && currentEmployee.aiInsights && (
                    <div className="space-y-8">
                      <h3 className="text-2xl font-bold text-slate-900 flex items-center space-x-3">
                        <Brain className="h-6 w-6 text-purple-500" />
                        <span>AI-Enhanced Insights</span>
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-8">
                        {/* Development Priorities */}
                        <div className="glass-card rounded-2xl p-6 border border-purple-200 bg-gradient-to-r from-purple-50/50 to-indigo-50/50">
                          <div className="flex items-center space-x-3 mb-4">
                            <Lightbulb className="h-6 w-6 text-purple-600" />
                            <h4 className="text-lg font-bold text-purple-900">Development Priorities</h4>
                          </div>
                          <ul className="space-y-2">
                            {currentEmployee.aiInsights.developmentPriorities.map((priority, index) => (
                              <li key={index} className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span className="text-purple-800 font-medium">{priority}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Risk Factors */}
                        <div className="glass-card rounded-2xl p-6 border border-amber-200 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
                          <div className="flex items-center space-x-3 mb-4">
                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                            <h4 className="text-lg font-bold text-amber-900">Risk Factors</h4>
                          </div>
                          <ul className="space-y-2">
                            {currentEmployee.aiInsights.riskFactors.map((risk, index) => (
                              <li key={index} className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                <span className="text-amber-800 font-medium">{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* AI Trend Analysis */}
                      <div className="glass-card rounded-2xl p-8 border border-blue-200">
                        <h4 className="text-xl font-bold text-slate-900 mb-4 flex items-center space-x-3">
                          <TrendingUp className="h-6 w-6 text-blue-500" />
                          <span>Trend Analysis</span>
                        </h4>
                        <p className="text-lg text-slate-700 leading-relaxed">{currentEmployee.aiInsights.trendAnalysis}</p>
                      </div>

                      {/* Success Predictors */}
                      <div className="glass-card rounded-2xl p-6 border border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-green-50/50">
                        <div className="flex items-center space-x-3 mb-4">
                          <Star className="h-6 w-6 text-emerald-600" />
                          <h4 className="text-lg font-bold text-emerald-900">Success Predictors</h4>
                        </div>
                        <ul className="space-y-2">
                          {currentEmployee.aiInsights.successPredictors.map((predictor, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                              <span className="text-emerald-800 font-medium">{predictor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Premium Performance Breakdown */}
                  <div className="space-y-8">
                    <h3 className="text-2xl font-bold text-slate-900 flex items-center space-x-3">
                      <BarChart3 className="h-6 w-6 text-blue-500" />
                      <span>Performance Breakdown</span>
                    </h3>
                    
                    <div className="grid gap-6">
                      {Object.entries(currentEmployee.valueRatings).map(([value, rating]) => (
                        <div key={value} className="rating-card">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                              <div className={`p-3 rounded-xl ${
                                rating >= 4 ? 'bg-emerald-100' : 
                                rating >= 3 ? 'bg-blue-100' : 
                                rating >= 2 ? 'bg-amber-100' : 'bg-red-100'
                              }`}>
                                <div className={`h-4 w-4 rounded-full ${
                                  rating >= 4 ? 'bg-emerald-500' : 
                                  rating >= 3 ? 'bg-blue-500' : 
                                  rating >= 2 ? 'bg-amber-500' : 'bg-red-500'
                                }`}></div>
                              </div>
                              <h4 className="text-xl font-bold text-slate-900 capitalize">{value}</h4>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-slate-900">{rating}</div>
                              <div className="text-sm text-slate-500 font-medium">out of 5.0</div>
                            </div>
                          </div>
                          
                          <div className="relative">
                            <div className="progress-bar">
                              <div 
                                className={`progress-fill ${
                                  rating >= 4 ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 
                                  rating >= 3 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 
                                  rating >= 2 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 
                                  'bg-gradient-to-r from-red-500 to-pink-500'
                                }`}
                                style={{ width: `${(rating / 5) * 100}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                              <span>Needs Focus</span>
                              <span>Exceptional</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Premium Summary */}
                  <div className="glass-card rounded-2xl p-8 border border-slate-200">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center space-x-3">
                      <Eye className="h-6 w-6 text-indigo-500" />
                      <span>Performance Summary</span>
                      {currentEmployee.isAiEnhanced && (
                        <span className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 rounded-full text-xs font-semibold text-purple-700">
                          <Brain className="h-3 w-3" />
                          <span>AI Enhanced</span>
                        </span>
                      )}
                    </h3>
                    <p className="text-lg text-slate-700 leading-relaxed">{currentEmployee.summary}</p>
                  </div>

                  {/* Premium Behavioral Recommendations */}
                  <div className="glass-card rounded-2xl p-8 border border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center space-x-3">
                      <Target className="h-6 w-6 text-blue-500" />
                      <span>Recommended Actions</span>
                      {currentEmployee.isAiEnhanced && (
                        <span className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 rounded-full text-xs font-semibold text-purple-700">
                          <Brain className="h-3 w-3" />
                          <span>AI Enhanced</span>
                        </span>
                      )}
                    </h3>
                    <div className="glass-card rounded-xl p-6 bg-white/60">
                      <p className="text-lg text-slate-700 leading-relaxed">{currentEmployee.suggestedBehavioralShift}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Premium Team Performance Overview with AI Team Insights */}
            <div className="premium-card p-8 slide-up">
              <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center space-x-3">
                <BarChart3 className="h-6 w-6 text-purple-500" />
                <span>Team Performance Overview</span>
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                {Object.entries(reportData.averageRatings).map(([value, rating]) => (
                  <div key={value} className="stat-card relative">
                    <div className={`inline-flex p-4 rounded-2xl mb-4 ${
                      rating >= 4 ? 'bg-emerald-100' : 
                      rating >= 3 ? 'bg-blue-100' : 'bg-amber-100'
                    }`}>
                      <div className={`h-6 w-6 rounded-full ${
                        rating >= 4 ? 'bg-emerald-500' : 
                        rating >= 3 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}></div>
                    </div>
                    <p className="text-sm font-bold text-slate-600 uppercase tracking-wide capitalize mb-3">
                      {value}
                    </p>
                    <p className="text-4xl font-bold text-slate-900 mb-2">{rating}</p>
                    <p className="text-xs text-slate-500 font-semibold">Team Average</p>
                  </div>
                ))}
              </div>

              {/* AI Team Insights */}
              {reportData.teamInsights && (
                <div className="glass-card rounded-2xl p-8 border border-purple-200 bg-gradient-to-r from-purple-50/50 to-indigo-50/50">
                  <h4 className="text-xl font-bold text-slate-900 mb-6 flex items-center space-x-3">
                    <Brain className="h-6 w-6 text-purple-500" />
                    <span>AI Team Analysis</span>
                  </h4>
                  
                  <div className="space-y-6">
                    <div>
                      <h5 className="font-semibold text-purple-900 mb-2">Overall Trends</h5>
                      <p className="text-purple-800">{reportData.teamInsights.overallTrends}</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-semibold text-emerald-900 mb-3 flex items-center space-x-2">
                          <Star className="h-4 w-4 text-emerald-600" />
                          <span>Strength Areas</span>
                        </h5>
                        <ul className="space-y-1">
                          {reportData.teamInsights.strengthAreas.map((strength, index) => (
                            <li key={index} className="text-emerald-800 text-sm">• {strength}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-semibold text-amber-900 mb-3 flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <span>Risk Areas</span>
                        </h5>
                        <ul className="space-y-1">
                          {reportData.teamInsights.riskAreas.map((risk, index) => (
                            <li key={index} className="text-amber-800 text-sm">• {risk}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                        <Lightbulb className="h-4 w-4 text-blue-600" />
                        <span>Recommendations</span>
                      </h5>
                      <ul className="space-y-1">
                        {reportData.teamInsights.recommendations.map((rec, index) => (
                          <li key={index} className="text-blue-800 text-sm">• {rec}</li>
                        ))}
                      </ul>
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
