'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, User, TrendingUp, Target } from 'lucide-react';
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
      pdf.save(`${employeeName}_Employee_Report.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">
              Employee Performance Report Generator
            </h1>
          </div>
          <p className="mt-2 text-slate-600">
            Upload Excel employee data to generate individual performance reports with behavioral insights
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            
            {uploadedFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-slate-700 font-medium">{uploadedFile.name}</span>
                </div>
                <p className="text-sm text-slate-500">
                  File uploaded successfully • {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium text-slate-700">
                  {isDragActive
                    ? 'Drop your Excel file here'
                    : 'Drag & drop your Excel file here, or click to browse'}
                </p>
                <p className="text-sm text-slate-500">
                  Supports .xlsx and .xls files • Include employee names and performance ratings
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-slate-700 font-medium">Analyzing employee data...</span>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Processing individual performance metrics and generating personalized insights
              </p>
            </div>
          )}
        </div>

        {/* Employee Reports Section */}
        {reportData && (
          <div className="space-y-6">
            {/* Employee Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <User className="h-6 w-6 text-blue-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Employee Reports ({reportData.totalEmployees} employees)
                  </h2>
                </div>
                <button
                  onClick={downloadPDF}
                  className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Current Report</span>
                </button>
              </div>
              
              {/* Employee Selector */}
              <div className="flex flex-wrap gap-2">
                {reportData.employees.map((employee, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedEmployee(index)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedEmployee === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {employee.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Employee Report */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div id="employee-report-content" className="p-8 space-y-6">
                {/* Employee Header */}
                <div className="border-b border-slate-200 pb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Employee Performance Report
                  </h2>
                  <p className="text-slate-600">Generated on {new Date().toLocaleDateString()}</p>
                </div>

                {/* Employee Details */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Name</label>
                    <p className="text-lg font-semibold text-slate-900">
                      {reportData.employees[selectedEmployee].name}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Top Value Observed</label>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <p className="text-lg font-semibold text-green-700">
                        {reportData.employees[selectedEmployee].topValueObserved}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Area for Growth</label>
                    <div className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-amber-600" />
                      <p className="text-lg font-semibold text-amber-700">
                        {reportData.employees[selectedEmployee].areaForGrowth}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Value Ratings Table */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                    Value Ratings
                  </h3>
                  <div className="overflow-hidden border border-slate-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-medium text-slate-700 uppercase tracking-wide">
                            Value
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-slate-700 uppercase tracking-wide">
                            Average Rating (out of 5)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {Object.entries(reportData.employees[selectedEmployee].valueRatings).map(([value, rating]) => (
                          <tr key={value} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm font-medium text-slate-900 capitalize">
                              {value}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <span className="text-lg font-bold text-slate-900">{rating}</span>
                                <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-32">
                                  <div 
                                    className={`h-2 rounded-full transition-all ${
                                      rating >= 4 ? 'bg-green-500' : 
                                      rating >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${(rating / 5) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                    Summary
                  </h3>
                  <p className="text-slate-700 leading-relaxed">
                    {reportData.employees[selectedEmployee].summary}
                  </p>
                </div>

                {/* Behavioral Shift Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                    Suggested Behavioural Shift
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <p className="text-slate-700 leading-relaxed">
                      {reportData.employees[selectedEmployee].suggestedBehavioralShift}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                Team Averages
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(reportData.averageRatings).map(([value, rating]) => (
                  <div key={value} className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-600 uppercase tracking-wide capitalize">
                      {value}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{rating}</p>
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
