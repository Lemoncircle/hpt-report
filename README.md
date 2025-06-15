# Staff Engagement Report Generator

A modern, clean web application built with Next.js and TailwindCSS that analyzes Excel survey data and generates professional engagement reports with AI-powered insights.

## 🚀 Features

- **Drag & Drop Upload**: Intuitive file upload interface with support for .xlsx and .xls files
- **AI-Powered Analysis**: Intelligent analysis of survey data with contextual insights
- **Professional Reports**: Clean, readable reports with executive summaries and actionable recommendations
- **PDF Export**: Download reports as high-quality PDF files
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Processing**: Live feedback during file upload and analysis
- **Error Handling**: Comprehensive error handling with user-friendly messages

## 🛠 Technology Stack

- **Frontend**: Next.js 14 with React 18
- **Styling**: TailwindCSS with custom design system
- **File Processing**: xlsx library for Excel file parsing
- **PDF Generation**: jsPDF with html2canvas for report export
- **UI Components**: Lucide React icons, react-dropzone for file uploads
- **TypeScript**: Full TypeScript support for type safety

## 📋 Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager

## 🔧 Installation & Setup

1. **Clone or navigate to the project directory**
   ```bash
   cd hpt-report-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
hpt-report-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── analyze/
│   │   │       └── route.ts          # API endpoint for file analysis
│   │   ├── globals.css               # Global styles and Tailwind configuration
│   │   ├── layout.tsx                # Root layout component
│   │   └── page.tsx                  # Main homepage component
│   └── components/                   # Reusable components (expandable)
├── public/                           # Static assets
└── README.md                         # Project documentation
```

## 🎯 How to Use

1. **Upload Your Excel File**
   - Drag and drop your Excel survey file onto the upload zone
   - Or click to browse and select a file
   - Supported formats: `.xlsx`, `.xls`

2. **Wait for Analysis**
   - The system will automatically analyze your data
   - Processing typically takes 1-3 seconds
   - Real-time loading indicators show progress

3. **Review the Report**
   - Generated report includes:
     - Executive Summary
     - Key Strengths
     - Areas for Improvement
     - Manager Recommendations

4. **Download PDF**
   - Click the "Download PDF" button
   - High-quality PDF will be generated and downloaded
   - Includes all report sections with professional formatting

## 🔍 API Endpoints

### POST `/api/analyze`

Analyzes uploaded Excel files and returns structured reports.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Excel file as form data

**Response:**
```json
{
  "report": {
    "executiveSummary": "string",
    "strengths": ["string"],
    "areasForImprovement": ["string"],
    "managerRecommendations": ["string"]
  },
  "filename": "string",
  "processedAt": "ISO date string"
}
```

## 🎨 Design Philosophy

The application follows a clean, minimal design inspired by modern tools like Notion, Linear, and Vercel:

- **Typography**: Clear hierarchy with readable fonts
- **Colors**: Professional blue and slate color palette
- **Spacing**: Generous whitespace for better readability
- **Interactions**: Smooth animations and hover effects
- **Accessibility**: Focus indicators and semantic HTML

## 🔮 AI Integration

Currently, the application includes intelligent analysis based on:
- Survey data structure detection
- Column name analysis for context
- Response volume assessment
- Pattern recognition for common survey themes

**Future Enhancement:** Easy integration with external AI services like OpenAI, Claude, or custom ML models.

## 📱 Responsive Design

- **Mobile**: Optimized for phones (320px+)
- **Tablet**: Enhanced experience for tablets (768px+)
- **Desktop**: Full-featured desktop experience (1024px+)
- **Print**: Optimized styles for PDF generation

## 🚧 Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type checking
npm run type-check
```

### Environment Variables

No environment variables required for basic functionality. For AI service integration, add:

```env
# Optional: External AI service configuration
OPENAI_API_KEY=your_api_key_here
AI_SERVICE_URL=your_service_url_here
```

## 🧪 Testing Excel Files

The application works with various Excel formats:
- Employee engagement surveys
- Customer satisfaction surveys
- Performance review data
- Any structured survey data with columns

## 🔒 Security Considerations

- File size limits (10MB default)
- File type validation
- Secure file processing in API routes
- No persistent storage of uploaded files
- Error handling prevents information leakage

## 🎯 Future Enhancements

- [ ] Integration with external AI services (OpenAI, Claude)
- [ ] Multiple file format support (CSV, Google Sheets)
- [ ] Custom report templates
- [ ] Data visualization charts
- [ ] Team collaboration features
- [ ] Historical report comparison
- [ ] Email report sharing
- [ ] Custom branding options

## 📄 License

This project is built for educational and business purposes. Please ensure you have appropriate licenses for any Excel files you process.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For questions or issues:
- Create an issue in the repository
- Check the troubleshooting section below

## 🐛 Troubleshooting

**File Upload Issues:**
- Ensure file is .xlsx or .xls format
- Check file size is under 10MB
- Verify file is not corrupted

**PDF Generation Issues:**
- Disable browser ad blockers
- Ensure modern browser with JavaScript enabled
- Try refreshing the page and re-generating

**Analysis Errors:**
- Verify Excel file contains data
- Check for special characters in column names
- Ensure at least one row of data exists
