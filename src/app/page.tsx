'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Define interfaces for type safety
interface ReportData {
  executiveSummary: string;
  strengths: string[];
  areasForImprovement: string[];
  managerRecommendations: string[];
}

export default function Home() {
  // State management for the application
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Generate and download PDF report
  const downloadPDF = async () => {
    const reportElement = document.getElementById('report-content');
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

      pdf.save('engagement-survey-report.pdf');
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
              Staff Engagement Report Generator
            </h1>
          </div>
          <p className="mt-2 text-slate-600">
            Upload your Excel survey data to generate professional engagement reports
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
                  Supports .xlsx and .xls files up to 10MB
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
                <span className="text-slate-700 font-medium">Analyzing your data...</span>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                This may take a few moments while we process your survey data
              </p>
            </div>
          )}
        </div>

        {/* Report Display */}
        {reportData && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            {/* Report Header */}
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Staff Engagement Survey Report
                  </h2>
                  <p className="text-slate-600 mt-1">
                    Generated on {new Date().toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={downloadPDF}
                  className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Report Content */}
            <div id="report-content" className="p-8 space-y-8">
              {/* Executive Summary */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                  Executive Summary
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  {reportData.executiveSummary}
                </p>
              </section>

              {/* Strengths */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                  Key Strengths
                </h3>
                <ul className="space-y-3">
                  {reportData.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="h-2 w-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-slate-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Areas for Improvement */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                  Areas for Improvement
                </h3>
                <ul className="space-y-3">
                  {reportData.areasForImprovement.map((area, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="h-2 w-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-slate-700">{area}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Manager Recommendations */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                  Manager Recommendations
                </h3>
                <div className="space-y-4">
                  {reportData.managerRecommendations.map((recommendation, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-slate-700">{recommendation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
