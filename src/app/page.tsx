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
  Search
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Define interfaces for type safety - updated for individual employee reports
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
    if (average >= 4.2) return { level: 'Exceptional', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (average >= 3.5) return { level: 'Strong', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (average >= 2.5) return { level: 'Developing', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { level: 'Needs Focus', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const currentEmployee = reportData?.employees[selectedEmployee];
  const performanceLevel = currentEmployee ? getPerformanceLevel(currentEmployee.valueRatings) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-soft border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <FileSpreadsheet className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Employee Performance Hub
                </h1>
                <p className="text-slate-600 text-sm">
                  Advanced analytics for individual performance insights
                </p>
              </div>
            </div>
            {reportData && (
              <div className="flex items-center space-x-4 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>{reportData.totalEmployees} Employees</span>
                </div>
                <div className="h-4 w-px bg-slate-300"></div>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Latest Analysis</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Upload Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 p-8 mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Upload Employee Data</h2>
              <p className="text-slate-600">Transform your Excel data into actionable performance insights</p>
            </div>
            
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer
                ${isDragActive
                  ? 'border-blue-400 bg-blue-50/50 shadow-glow transform scale-[1.02]'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-glow hover:transform hover:scale-[1.01]'
                }
              `}
            >
              <input {...getInputProps()} />
              
              <div className={`transition-all duration-300 ${isDragActive ? 'scale-110' : ''}`}>
                <Upload className={`mx-auto h-12 w-12 mb-4 ${isDragActive ? 'text-blue-500' : 'text-slate-400'}`} />
              </div>
              
              {uploadedFile ? (
                <div className="space-y-3 fade-in">
                  <div className="flex items-center justify-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                    <span className="text-lg font-semibold text-slate-800">{uploadedFile.name}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-4 text-sm text-slate-600">
                    <span>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>•</span>
                    <span>Ready for analysis</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-lg font-medium text-slate-700">
                    {isDragActive
                      ? 'Drop your Excel file here'
                      : 'Drag & drop your Excel file or click to browse'}
                  </p>
                  <p className="text-sm text-slate-500">
                    Supports .xlsx and .xls • Include employee names and performance ratings
                  </p>
                  <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-slate-400">
                    <span>✓ Secure Processing</span>
                    <span>✓ No Data Storage</span>
                    <span>✓ Instant Results</span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl flex items-start space-x-3 slide-up">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="mt-8 text-center slide-up">
                <div className="inline-flex items-center space-x-4 bg-blue-50/80 backdrop-blur-sm rounded-xl px-6 py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <div className="text-left">
                    <span className="text-slate-800 font-semibold block">Processing your data...</span>
                    <span className="text-sm text-slate-600">Generating personalized insights for each employee</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Employee Reports Section */}
        {reportData && (
          <div className="space-y-8">
            {/* Employee Dashboard */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Team Dashboard</h2>
                    <p className="text-sm text-slate-600">{reportData.totalEmployees} individual reports generated</p>
                  </div>
                </div>
                
                <button
                  onClick={downloadPDF}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Report</span>
                </button>
              </div>
              
              {/* Search and Filter */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                      className={`
                        p-4 rounded-xl text-left transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02]
                        ${selectedEmployee === employeeIndex
                          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg'
                          : 'bg-white/80 border border-slate-200 hover:border-blue-200'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${performance.bg}`}>
                            <User className={`h-4 w-4 ${performance.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 text-sm">{employee.name}</h3>
                            <p className={`text-xs font-medium ${performance.color}`}>{performance.level}</p>
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 transition-transform ${selectedEmployee === employeeIndex ? 'rotate-90' : ''} text-slate-400`} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Star className="h-3 w-3 text-amber-400" />
                          <span className="text-xs text-slate-600">{employee.topValueObserved}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-900">{averageRating.toFixed(1)}</div>
                          <div className="text-xs text-slate-500">Overall</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Enhanced Individual Employee Report */}
            {currentEmployee && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 overflow-hidden">
                <div id="employee-report-content" className="p-8 space-y-8">
                  {/* Report Header */}
                  <div className="border-b border-slate-200/60 pb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${performanceLevel?.bg}`}>
                          <Award className={`h-8 w-8 ${performanceLevel?.color}`} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900">{currentEmployee.name}</h2>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${performanceLevel?.bg} ${performanceLevel?.color}`}>
                              {performanceLevel?.level} Performance
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="text-sm text-slate-600">Generated {new Date().toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-slate-900">
                          {(Object.values(currentEmployee.valueRatings).reduce((sum, rating) => sum + rating, 0) / 4).toFixed(1)}
                        </div>
                        <div className="text-sm text-slate-500">Overall Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Key Insights Cards */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-3">
                        <TrendingUp className="h-6 w-6 text-emerald-600" />
                        <h3 className="font-semibold text-emerald-900">Top Strength</h3>
                      </div>
                      <p className="text-lg font-bold text-emerald-800 mb-2">{currentEmployee.topValueObserved}</p>
                      <p className="text-sm text-emerald-700">
                        Rated {currentEmployee.valueRatings[currentEmployee.topValueObserved.toLowerCase() as keyof typeof currentEmployee.valueRatings]}/5.0
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-3">
                        <Target className="h-6 w-6 text-amber-600" />
                        <h3 className="font-semibold text-amber-900">Growth Focus</h3>
                      </div>
                      <p className="text-lg font-bold text-amber-800 mb-2">{currentEmployee.areaForGrowth}</p>
                      <p className="text-sm text-amber-700">
                        Development opportunity area
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Value Ratings */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-slate-900 flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Performance Breakdown</span>
                    </h3>
                    
                    <div className="grid gap-4">
                      {Object.entries(currentEmployee.valueRatings).map(([value, rating]) => (
                        <div key={value} className="bg-white/80 border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${
                                rating >= 4 ? 'bg-emerald-100' : 
                                rating >= 3 ? 'bg-blue-100' : 
                                rating >= 2 ? 'bg-amber-100' : 'bg-red-100'
                              }`}>
                                <div className={`h-3 w-3 rounded-full ${
                                  rating >= 4 ? 'bg-emerald-500' : 
                                  rating >= 3 ? 'bg-blue-500' : 
                                  rating >= 2 ? 'bg-amber-500' : 'bg-red-500'
                                }`}></div>
                              </div>
                              <h4 className="font-semibold text-slate-900 capitalize text-lg">{value}</h4>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-slate-900">{rating}</div>
                              <div className="text-sm text-slate-500">out of 5.0</div>
                            </div>
                          </div>
                          
                          <div className="relative">
                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                              <div 
                                className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                                  rating >= 4 ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 
                                  rating >= 3 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 
                                  rating >= 2 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 
                                  'bg-gradient-to-r from-red-500 to-pink-500'
                                }`}
                                style={{ width: `${(rating / 5) * 100}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                              <span>Needs Focus</span>
                              <span>Exceptional</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Summary */}
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                      <Eye className="h-5 w-5" />
                      <span>Performance Summary</span>
                    </h3>
                    <p className="text-slate-700 leading-relaxed text-lg">{currentEmployee.summary}</p>
                  </div>

                  {/* Enhanced Behavioral Recommendations */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Recommended Actions</span>
                    </h3>
                    <div className="bg-white/80 border border-blue-200 rounded-lg p-6">
                      <p className="text-slate-700 leading-relaxed text-lg">{currentEmployee.suggestedBehavioralShift}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Team Performance Overview */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Team Performance Overview</span>
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Object.entries(reportData.averageRatings).map(([value, rating]) => (
                  <div key={value} className="text-center p-6 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl hover:shadow-lg transition-all">
                    <div className={`inline-flex p-3 rounded-full mb-3 ${
                      rating >= 4 ? 'bg-emerald-100' : 
                      rating >= 3 ? 'bg-blue-100' : 'bg-amber-100'
                    }`}>
                      <div className={`h-4 w-4 rounded-full ${
                        rating >= 4 ? 'bg-emerald-500' : 
                        rating >= 3 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}></div>
                    </div>
                    <p className="text-sm font-medium text-slate-600 uppercase tracking-wide capitalize mb-2">
                      {value}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{rating}</p>
                    <p className="text-xs text-slate-500">Team Average</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
