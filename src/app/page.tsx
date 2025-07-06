'use client';

import { useState, useEffect } from 'react';
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
  Mail,
  TrendingUp,
  Target,
  Star,
  BarChart3,
  Award,
  Info,
  History,
  Clock,
  FileText,
  Trash2,
  Plus
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
    hasDocumentContext: boolean;
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

// New interface for file history
interface FileAnalysisHistory {
  id: string;
  fileName: string;
  uploadDate: Date;
  reportData: ReportData;
  fileSize: number;
  processingTime: number;
  documentContext?: DocumentContext[];
}

// Interface for document context
interface DocumentContext {
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: Date;
}

export default function Home() {
  // State management for the application
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  // New state for multi-file analysis and history
  const [analysisHistory, setAnalysisHistory] = useState<FileAnalysisHistory[]>([]);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // State for document context
  const [contextDocuments, setContextDocuments] = useState<File[]>([]);
  const [showContextUpload, setShowContextUpload] = useState(false);

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('hpt-analysis-history');
    const savedCurrentId = localStorage.getItem('hpt-current-analysis-id');
    
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory).map((item: Omit<FileAnalysisHistory, 'uploadDate'> & { uploadDate: string }) => ({
          ...item,
          uploadDate: new Date(item.uploadDate)
        }));
        setAnalysisHistory(parsedHistory);
        
        if (savedCurrentId && parsedHistory.find((a: FileAnalysisHistory) => a.id === savedCurrentId)) {
          setCurrentAnalysisId(savedCurrentId);
          const currentAnalysis = parsedHistory.find((a: FileAnalysisHistory) => a.id === savedCurrentId);
          if (currentAnalysis) {
            setReportData(currentAnalysis.reportData);
          }
        }
      } catch (error) {
        console.error('Error loading analysis history:', error);
        localStorage.removeItem('hpt-analysis-history');
        localStorage.removeItem('hpt-current-analysis-id');
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (analysisHistory.length > 0) {
      localStorage.setItem('hpt-analysis-history', JSON.stringify(analysisHistory));
    } else {
      localStorage.removeItem('hpt-analysis-history');
    }
  }, [analysisHistory]);

  // Save current analysis ID to localStorage
  useEffect(() => {
    if (currentAnalysisId) {
      localStorage.setItem('hpt-current-analysis-id', currentAnalysisId);
    } else {
      localStorage.removeItem('hpt-current-analysis-id');
    }
  }, [currentAnalysisId]);

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
        setActiveTooltip(null);
        analyzeFile(acceptedFiles[0]);
      }
    }
  });

  // Analyze the uploaded Excel file using the API endpoint
  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    const startTime = Date.now();

    try {
      // Create form data to send the file to our API
      const formData = new FormData();
      formData.append('file', file);

      // Add context documents if any
      contextDocuments.forEach(doc => {
        formData.append('contextFiles', doc);
      });

      // Call our analysis API endpoint with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      console.log('📊 Analysis result structure:', {
        hasEmployees: !!result.employees,
        employeeCount: result.employees?.length || 0,
        hasProcessingInfo: !!result.processingInfo,
        aiEnabled: result.processingInfo?.aiEnabled,
        aiSuccessRate: result.processingInfo?.aiSuccessRate
      });
      
      const processingTime = Date.now() - startTime;
      
      // Create new analysis history entry
      const newAnalysis: FileAnalysisHistory = {
        id: Date.now().toString(),
        fileName: file.name,
        uploadDate: new Date(),
        reportData: result, // Use result directly, not result.report
        fileSize: file.size,
        processingTime,
        documentContext: result.documentContext
      };

      // Add to history and set as current
      setAnalysisHistory(prev => [newAnalysis, ...prev]);
      setCurrentAnalysisId(newAnalysis.id);
      setReportData(result); // Use result directly
      setSelectedEmployee(0);
      setSearchTerm('');
    } catch (err) {
      let errorMessage = 'Failed to analyze the file. Please ensure it\'s a valid Excel file.';
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Analysis timed out. Please try again with a smaller file or check your internet connection.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load analysis from history
  const loadAnalysisFromHistory = (analysisId: string) => {
    const analysis = analysisHistory.find(a => a.id === analysisId);
    if (analysis) {
      setCurrentAnalysisId(analysisId);
      setReportData(analysis.reportData);
      setSelectedEmployee(0);
      setSearchTerm('');
      setShowHistory(false);
    }
  };

  // Delete analysis from history
  const deleteAnalysisFromHistory = (analysisId: string) => {
    setAnalysisHistory(prev => prev.filter(a => a.id !== analysisId));
    if (currentAnalysisId === analysisId) {
      // If deleting current analysis, switch to most recent or clear
      const remaining = analysisHistory.filter(a => a.id !== analysisId);
      if (remaining.length > 0) {
        loadAnalysisFromHistory(remaining[0].id);
      } else {
        setCurrentAnalysisId(null);
        setReportData(null);
        setUploadedFile(null);
      }
    }
  };

  // Clear all history
  const clearAllHistory = () => {
    setAnalysisHistory([]);
    setCurrentAnalysisId(null);
    setReportData(null);
    setUploadedFile(null);
    setShowHistory(false);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.tooltip-container')) {
        setActiveTooltip(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FileSpreadsheet className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Employee Performance Hub</h1>
                  <p className="text-sm text-gray-600 font-medium">AI-powered performance insights & analytics</p>
                </div>
              </div>
            </div>
            {reportData && (
              <div className="flex items-center space-x-6 text-sm">
                {/* Current File Info */}
                <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">{reportData.totalEmployees} Employees</span>
                </div>
                
                {/* AI Status */}
                <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
                  {reportData.processingInfo.aiEnabled ? (
                    <>
                      <Brain className="h-4 w-4 text-purple-600" />
                      <span className="font-semibold text-purple-900">
                        {reportData.processingInfo.aiSuccessRate >= 100 ? 
                          'AI-Powered Analysis' : 
                          `AI Enhanced (${reportData.processingInfo.aiSuccessRate.toFixed(0)}%)`
                        }
                      </span>
                      {reportData.processingInfo.fallbackUsed && (
                        <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                          Hybrid Mode
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-900">Rule-Based Analysis</span>
                    </>
                  )}
                </div>

                {/* History Controls */}
                <div className="flex items-center space-x-3">
                  {analysisHistory.length > 0 && (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-emerald-50 rounded-lg">
                      <History className="h-4 w-4 text-emerald-600" />
                      <span className="font-semibold text-emerald-900">{analysisHistory.length} Files</span>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors duration-200 font-semibold"
                  >
                    <History className="h-4 w-4" />
                    <span>History</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* History Panel */}
        {showHistory && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <History className="h-6 w-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">Analysis History</h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {analysisHistory.length} files
                </span>
              </div>
              <div className="flex items-center space-x-3">
                {analysisHistory.length > 0 && (
                  <button
                    onClick={clearAllHistory}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors duration-200 text-sm font-semibold"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Clear All</span>
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 text-sm font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

            {analysisHistory.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis History</h3>
                <p className="text-gray-600">Upload and analyze files to see them here</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {analysisHistory.map((analysis) => (
                  <div
                    key={analysis.id}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md ${
                      currentAnalysisId === analysis.id
                        ? 'border-indigo-200 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-200'
                    }`}
                    onClick={() => loadAnalysisFromHistory(analysis.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          currentAnalysisId === analysis.id ? 'bg-indigo-100' : 'bg-gray-100'
                        }`}>
                          <FileSpreadsheet className={`h-6 w-6 ${
                            currentAnalysisId === analysis.id ? 'text-indigo-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                            <span>{analysis.fileName}</span>
                            {currentAnalysisId === analysis.id && (
                              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                                Current
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(analysis.uploadDate)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{analysis.reportData.totalEmployees} employees</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FileText className="h-3 w-3" />
                              <span>{formatFileSize(analysis.fileSize)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAnalysisFromHistory(analysis.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-500/10 to-blue-500/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full mb-4">
                {reportData ? <Plus className="h-4 w-4 text-blue-600" /> : <Upload className="h-4 w-4 text-blue-600" />}
                <span className="text-sm font-semibold text-blue-700">
                  {reportData ? 'Upload Another File' : 'Upload & Analyze'}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {reportData ? 'Add Another Analysis' : 'Transform Your Employee Data'}
              </h2>
              <p className="text-lg text-gray-600">
                {reportData 
                  ? 'Upload additional Excel files to compare performance across different periods or teams'
                  : 'Upload your Excel file to generate comprehensive AI-powered performance reports'
                }
              </p>
            </div>

            {/* Document Context Upload Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span>Context Documents</span>
                    <span className="text-sm font-normal text-gray-500">(Optional)</span>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload organizational documents to provide context for more specific AI analysis
                  </p>
                </div>
                <button
                  onClick={() => setShowContextUpload(!showContextUpload)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors duration-200"
                >
                  <FileText className="h-4 w-4" />
                  <span>{showContextUpload ? 'Hide' : 'Add Context'}</span>
                </button>
              </div>

              {showContextUpload && (
                <div className="bg-purple-50/30 border border-purple-200 rounded-xl p-6">
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Info className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Supported file types:</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      PDF documents, Word documents (.docx), Text files (.txt), Markdown (.md), RTF documents
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div
                      className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors duration-200 cursor-pointer"
                      onClick={() => document.getElementById('context-file-input')?.click()}
                    >
                      <FileText className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-sm text-purple-700 font-medium">
                        Click to upload context documents
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        Policies, procedures, org charts, guidelines
                      </p>
                    </div>
                    
                    <input
                      id="context-file-input"
                      type="file"
                      multiple
                      accept=".pdf,.docx,.doc,.txt,.md,.rtf"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setContextDocuments(prev => [...prev, ...files]);
                      }}
                      className="hidden"
                    />

                    {contextDocuments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-purple-900">Uploaded Context Documents:</h4>
                        {contextDocuments.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-purple-200">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-4 w-4 text-purple-600" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setContextDocuments(prev => prev.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => setContextDocuments([])}
                          className="text-sm text-purple-600 hover:text-purple-800 underline"
                        >
                          Clear all context documents
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {contextDocuments.length > 0 && !showContextUpload && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Brain className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">
                      {contextDocuments.length} context document{contextDocuments.length > 1 ? 's' : ''} ready
                    </span>
                  </div>
                  <p className="text-sm text-purple-700">
                    AI analysis will use these documents to provide organization-specific insights
                  </p>
                </div>
              )}
            </div>
            
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                isDragActive 
                  ? 'border-blue-400 bg-blue-50/50 scale-[1.02]' 
                  : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50/50'
              }`}
            >
              <input {...getInputProps()} />
              
              {uploadedFile && !reportData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="relative">
                      <CheckCircle className="h-10 w-10 text-emerald-500" />
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
                    </div>
                    <span className="text-xl font-semibold text-gray-900">{uploadedFile.name}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="flex items-center space-x-2 text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-semibold">Ready for Analysis</span>
                    </div>
                  </div>
                </div>
              ) : reportData ? (
                <div className="space-y-6">
                  {/* Current File Info */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
                    <div className="flex items-center justify-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-indigo-900">
                          {analysisHistory.find(a => a.id === currentAnalysisId)?.fileName || 'Current Analysis'}
                        </h3>
                        <p className="text-sm text-indigo-700">
                          {reportData.totalEmployees} employees • AI-powered insights
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Upload Another File */}
                  <div className="text-center">
                    <div className="relative">
                      <Plus className={`mx-auto h-12 w-12 transition-all duration-300 ${
                        isDragActive ? 'text-blue-500 scale-110' : 'text-gray-400'
                      }`} />
                      {isDragActive && (
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                      )}
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-2 mt-4">
                      {isDragActive ? 'Drop your file here' : 'Upload another Excel file'}
                    </p>
                    <p className="text-gray-600">Compare different periods, teams, or departments</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative">
                    <Upload className={`mx-auto h-16 w-16 transition-all duration-300 ${
                      isDragActive ? 'text-blue-500 scale-110' : 'text-gray-400'
                    }`} />
                    {isDragActive && (
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-gray-900 mb-2">
                      {isDragActive ? 'Drop your file here' : 'Drag & drop your Excel file'}
                    </p>
                    <p className="text-gray-600">or click to browse • Supports .xlsx and .xls files</p>
                  </div>
                  <div className="flex items-center justify-center space-x-8 text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>Secure Processing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>AI Enhanced</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>No Data Storage</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800">Analysis Error</h3>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center space-x-4 bg-blue-50 rounded-xl px-8 py-6 border border-blue-100">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-200 border-t-blue-600"></div>
                    <div className="absolute inset-2 rounded-full bg-blue-50"></div>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-blue-900 text-lg">Processing Your Data</p>
                    <p className="text-blue-700">Generating AI-enhanced insights for each employee...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Employee Reports Section */}
        {reportData && (
          <div className="space-y-8">
            {/* Enhanced Employee List - Moved to top */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Users className="h-6 w-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">Team Members</h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {reportData.totalEmployees} employees
                  </span>
                </div>
                <button
                  onClick={downloadPDF}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Report</span>
                </button>
              </div>
              
              {/* Enhanced Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
                  />
                </div>
              </div>

              {/* Enhanced Employee Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees.map((employee, index) => {
                  const employeeIndex = reportData.employees.findIndex(e => e.name === employee.name);
                  const performance = getPerformanceLevel(employee.valueRatings);
                  const averageRating = Object.values(employee.valueRatings).reduce((sum, rating) => sum + rating, 0) / 4;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedEmployee(employeeIndex)}
                      className={`text-left p-5 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                        selectedEmployee === employeeIndex
                          ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${performance.bg} border border-white shadow-sm`}>
                            <User className={`h-6 w-6 ${performance.color}`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                              <span>{employee.name}</span>
                              {employee.isAiEnhanced && (
                                <Brain className="h-3 w-3 text-purple-500" />
                              )}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              performance.level === 'Exceptional' ? 'bg-emerald-100 text-emerald-800' :
                              performance.level === 'Strong' ? 'bg-blue-100 text-blue-800' :
                              performance.level === 'Developing' ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {performance.level}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={`h-5 w-5 transition-transform duration-200 ${
                          selectedEmployee === employeeIndex ? 'rotate-90 text-blue-500' : 'text-gray-400'
                        }`} />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 font-medium">Top: {employee.topValueObserved}</span>
                        <span className="font-bold text-gray-900 text-lg">{averageRating.toFixed(1)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Enhanced Employee Profile Header */}
            {currentEmployee && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Gradient Profile Header */}
                <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-8">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
                  
                  <div className="relative flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                        <User className="h-12 w-12 text-white" />
                      </div>
                      {currentEmployee.isAiEnhanced && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center border-2 border-white">
                          <Brain className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h2 className="text-3xl font-bold text-white">{currentEmployee.name}</h2>
                        {currentEmployee.isAiEnhanced && (
                          <span className="inline-flex items-center space-x-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white border border-white/30">
                            <Brain className="h-3 w-3" />
                            <span>
                              {currentEmployee.aiInsights?.hasDocumentContext 
                                ? 'Organization-Specific Analysis' 
                                : 'AI-Powered Analysis'
                              }
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-8 text-white/90 text-sm">
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
                      <div className="text-4xl font-bold text-white mb-1">
                        {(Object.values(currentEmployee.valueRatings).reduce((sum, rating) => sum + rating, 0) / 4).toFixed(1)}
                      </div>
                      <div className="text-white/80 text-sm font-medium">Overall Score</div>
                    </div>
                  </div>
                </div>

                {/* Document Context Summary */}
                {currentEmployee.isAiEnhanced && currentEmployee.aiInsights?.hasDocumentContext && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-t border-purple-100 px-8 py-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-purple-900">Organization-Specific Context</h4>
                    </div>
                    <p className="text-sm text-purple-800 leading-relaxed">
                      This analysis incorporates your organization&apos;s specific documents and context to provide more relevant insights and recommendations tailored to your company&apos;s policies and culture.
                    </p>
                    {analysisHistory.find(h => h.id === currentAnalysisId)?.documentContext && (
                      <div className="mt-4 flex items-center space-x-2 text-xs text-purple-700">
                        <Info className="h-3 w-3" />
                        <span>
                          Based on {analysisHistory.find(h => h.id === currentAnalysisId)?.documentContext?.length} context document(s)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced Stats Grid with Tooltips */}
                <div className="p-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    {/* Strong Areas Card */}
                    <div className="relative group tooltip-container">
                      <div 
                        className="text-center p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100 hover:shadow-lg transition-all duration-200 cursor-help"
                        onClick={() => setActiveTooltip(activeTooltip === 'strong' ? null : 'strong')}
                        onMouseEnter={() => setActiveTooltip('strong')}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        <div className="text-3xl font-bold text-emerald-600 mb-2">
                          {Object.values(currentEmployee.valueRatings).filter(r => r >= 4).length}
                        </div>
                        <div className="text-sm text-emerald-700 font-semibold mb-3 flex items-center justify-center space-x-1">
                          <span>Strong Areas</span>
                          <Info className="h-3 w-3 text-emerald-500 opacity-60" />
                        </div>
                        <div className="w-full bg-emerald-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${(Object.values(currentEmployee.valueRatings).filter(r => r >= 4).length / 4) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      {/* Tooltip */}
                      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg transition-opacity duration-200 z-20 w-64 text-center ${
                        activeTooltip === 'strong' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      } md:group-hover:opacity-100 md:opacity-0`}>
                        <div className="font-semibold mb-1">Strong Areas (4.0-5.0)</div>
                        <div>Number of core values where this employee excels with ratings of 4.0 or higher</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                    
                    {/* Developing Card */}
                    <div className="relative group tooltip-container">
                      <div 
                        className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-lg transition-all duration-200 cursor-help"
                        onClick={() => setActiveTooltip(activeTooltip === 'developing' ? null : 'developing')}
                        onMouseEnter={() => setActiveTooltip('developing')}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {Object.values(currentEmployee.valueRatings).filter(r => r >= 3 && r < 4).length}
                        </div>
                        <div className="text-sm text-blue-700 font-semibold mb-3 flex items-center justify-center space-x-1">
                          <span>Developing</span>
                          <Info className="h-3 w-3 text-blue-500 opacity-60" />
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${(Object.values(currentEmployee.valueRatings).filter(r => r >= 3 && r < 4).length / 4) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      {/* Tooltip */}
                      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg transition-opacity duration-200 z-20 w-64 text-center ${
                        activeTooltip === 'developing' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      } md:group-hover:opacity-100 md:opacity-0`}>
                        <div className="font-semibold mb-1">Developing (3.0-3.9)</div>
                        <div>Number of core values showing solid performance with room for continued growth</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                    
                    {/* Growth Areas Card */}
                    <div className="relative group tooltip-container">
                      <div 
                        className="text-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 hover:shadow-lg transition-all duration-200 cursor-help"
                        onClick={() => setActiveTooltip(activeTooltip === 'growth' ? null : 'growth')}
                        onMouseEnter={() => setActiveTooltip('growth')}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        <div className="text-3xl font-bold text-amber-600 mb-2">
                          {Object.values(currentEmployee.valueRatings).filter(r => r < 3).length}
                        </div>
                        <div className="text-sm text-amber-700 font-semibold mb-3 flex items-center justify-center space-x-1">
                          <span>Growth Areas</span>
                          <Info className="h-3 w-3 text-amber-500 opacity-60" />
                        </div>
                        <div className="w-full bg-amber-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${(Object.values(currentEmployee.valueRatings).filter(r => r < 3).length / 4) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      {/* Tooltip */}
                      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg transition-opacity duration-200 z-20 w-64 text-center ${
                        activeTooltip === 'growth' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      } md:group-hover:opacity-100 md:opacity-0`}>
                        <div className="font-semibold mb-1">Growth Areas (Below 3.0)</div>
                        <div>Number of core values requiring focused development and improvement</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                    
                    {/* Priorities Card */}
                    <div className="relative group tooltip-container">
                      <div 
                        className="text-center p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 hover:shadow-lg transition-all duration-200 cursor-help"
                        onClick={() => setActiveTooltip(activeTooltip === 'priorities' ? null : 'priorities')}
                        onMouseEnter={() => setActiveTooltip('priorities')}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        <div className="text-3xl font-bold text-purple-600 mb-2">
                          {currentEmployee.aiInsights?.developmentPriorities.length || 3}
                        </div>
                        <div className="text-sm text-purple-700 font-semibold mb-3 flex items-center justify-center space-x-1">
                          <span>Priorities</span>
                          <Info className="h-3 w-3 text-purple-500 opacity-60" />
                        </div>
                        <div className="w-full bg-purple-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full w-full transition-all duration-500"></div>
                        </div>
                      </div>
                      {/* Tooltip */}
                      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg transition-opacity duration-200 z-20 w-64 text-center ${
                        activeTooltip === 'priorities' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      } md:group-hover:opacity-100 md:opacity-0`}>
                        <div className="font-semibold mb-1">AI Development Priorities</div>
                        <div>Number of key focus areas identified by AI for professional development</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Performance Breakdown */}
                  <div className="space-y-6" id="employee-report-content">
                    <div className="flex items-center space-x-3 mb-6">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                      <h3 className="text-xl font-bold text-gray-900">Performance Breakdown</h3>
                    </div>
                    
                    <div className="grid gap-4">
                      {Object.entries(currentEmployee.valueRatings).map(([value, rating]) => (
                        <div key={value} className="flex items-center justify-between p-6 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className={`w-4 h-4 rounded-full ${
                              rating >= 4 ? 'bg-emerald-500' : 
                              rating >= 3 ? 'bg-blue-500' : 
                              rating >= 2 ? 'bg-amber-500' : 'bg-red-500'
                            }`}></div>
                            <span className="font-semibold text-gray-900 capitalize text-lg">{value}</span>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="w-40 bg-gray-200 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full transition-all duration-700 ${
                                  rating >= 4 ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 
                                  rating >= 3 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 
                                  rating >= 2 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-pink-500'
                                }`}
                                style={{ width: `${(rating / 5) * 100}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-gray-900 text-xl w-12">{rating}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Enhanced AI Insights */}
                    {currentEmployee.isAiEnhanced && currentEmployee.aiInsights && (
                      <div className="mt-8 space-y-6">
                        <div className="flex items-center space-x-3 mb-6">
                          <Brain className="h-6 w-6 text-purple-600" />
                          <h3 className="text-xl font-bold text-gray-900">AI-Enhanced Insights</h3>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
                            <h4 className="font-bold text-purple-900 mb-4 flex items-center space-x-2">
                              <Lightbulb className="h-5 w-5" />
                              <span>Development Priorities</span>
                            </h4>
                            <ul className="space-y-3">
                              {currentEmployee.aiInsights.developmentPriorities.map((priority, index) => (
                                <li key={index} className="text-purple-800 flex items-start space-x-3">
                                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                                  <span className="font-medium">{priority}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                            <h4 className="font-bold text-amber-900 mb-4 flex items-center space-x-2">
                              <AlertTriangle className="h-5 w-5" />
                              <span>Risk Factors</span>
                            </h4>
                            <ul className="space-y-3">
                              {currentEmployee.aiInsights.riskFactors.map((risk, index) => (
                                <li key={index} className="text-amber-800 flex items-start space-x-3">
                                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                                  <span className="font-medium">{risk}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                          <h4 className="font-bold text-blue-900 mb-4 flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5" />
                            <span>Trend Analysis</span>
                          </h4>
                          <p className="text-blue-800 leading-relaxed font-medium">{currentEmployee.aiInsights.trendAnalysis}</p>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Summary and Recommendations */}
                    <div className="mt-8 space-y-6">
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                          <Award className="h-5 w-5 text-gray-600" />
                          <span>Performance Summary</span>
                        </h4>
                        <p className="text-gray-700 leading-relaxed font-medium">{currentEmployee.summary}</p>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                        <h4 className="font-bold text-blue-900 mb-4 flex items-center space-x-2">
                          <Target className="h-5 w-5" />
                          <span>Recommended Actions</span>
                        </h4>
                        <p className="text-blue-800 leading-relaxed font-medium">{currentEmployee.suggestedBehavioralShift}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Team Overview */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <BarChart3 className="h-6 w-6 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900">Team Performance Overview</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {Object.entries(reportData.averageRatings).map(([value, rating]) => (
                  <div key={value} className="text-center p-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-100">
                    <div className="text-3xl font-bold text-gray-900 mb-2">{rating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600 font-semibold capitalize mb-3">{value}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          rating >= 4 ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 
                          rating >= 3 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                        }`}
                        style={{ width: `${(rating / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced AI Team Insights */}
              {reportData.teamInsights && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
                  <h4 className="font-bold text-purple-900 mb-6 flex items-center space-x-2">
                    <Brain className="h-5 w-5" />
                    <span>AI Team Analysis</span>
                  </h4>
                  
                  <div className="space-y-6">
                    <div>
                      <h5 className="font-semibold text-purple-900 mb-3">Overall Trends</h5>
                      <p className="text-purple-800 font-medium leading-relaxed">{reportData.teamInsights.overallTrends}</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-semibold text-emerald-900 mb-3 flex items-center space-x-2">
                          <Star className="h-4 w-4 text-emerald-600" />
                          <span>Strengths</span>
                        </h5>
                        <ul className="space-y-2">
                          {reportData.teamInsights.strengthAreas.map((strength, index) => (
                            <li key={index} className="text-emerald-800 font-medium flex items-start space-x-2">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-semibold text-amber-900 mb-3 flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <span>Risk Areas</span>
                        </h5>
                        <ul className="space-y-2">
                          {reportData.teamInsights.riskAreas.map((risk, index) => (
                            <li key={index} className="text-amber-800 font-medium flex items-start space-x-2">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                              <span>{risk}</span>
                            </li>
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
