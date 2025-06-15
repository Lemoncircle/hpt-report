# 🚀 Enable AI-Only Mode

This guide will help you configure your HPT Report App for **AI-only analysis** to get the best possible insights.

## ✅ Quick Setup (2 minutes)

### Step 1: Get Your Perplexity API Key
1. Visit [Perplexity AI](https://www.perplexity.ai/)
2. Sign up for an account or log in
3. Navigate to your API settings
4. Generate a new API key
5. Copy the API key

### Step 2: Create Environment Configuration
Create a file named `.env.local` in your `hpt-report-app` folder with this content:

```bash
# AI-Only Mode Configuration
PERPLEXITY_API_KEY=your_actual_api_key_here
ENABLE_AI_INSIGHTS=true
AI_FALLBACK_ENABLED=false
```

**Replace `your_actual_api_key_here` with your real Perplexity API key.**

### Step 3: Start the Application
```bash
npm run dev
```

## 🎯 What You Get with AI-Only Mode

### ✅ **Superior Analysis Quality**
- **Deep Contextual Understanding**: AI analyzes performance patterns, behavioral indicators, and team dynamics
- **Personalized Insights**: Each employee gets tailored recommendations based on their unique profile
- **Predictive Analysis**: AI identifies future performance trends and potential challenges

### ✅ **Advanced Features**
- **Behavioral Recommendations**: Specific, actionable development strategies
- **Risk Factor Analysis**: Proactive identification of performance challenges
- **Success Predictors**: Key indicators for future high performance
- **Team Dynamics**: Comprehensive team-level insights and recommendations

### ✅ **Consistency & Reliability**
- **Uniform AI Standards**: All employees analyzed using the same advanced AI model
- **No Mixed Analysis Types**: Eliminates confusion between AI and rule-based insights
- **Quality Assurance**: Ensures every report meets AI-enhanced standards

## 🔍 How to Verify It's Working

1. Upload an Excel file with employee data
2. Look for "AI-Powered Analysis" indicator in the header
3. Check individual employee reports for AI insights sections:
   - Enhanced Summary
   - Behavioral Recommendations
   - Trend Analysis
   - Development Priorities
   - Risk Factors
   - Success Predictors

## 🆘 Troubleshooting

### "AI analysis is required but not properly configured"
- Check that your `.env.local` file exists
- Verify your API key is correct
- Ensure `ENABLE_AI_INSIGHTS=true`

### Slow Performance
- AI analysis takes 2-5 seconds per employee
- This is normal for high-quality insights
- Consider smaller batches for very large datasets

### API Limits
- Monitor your Perplexity API usage
- The system will show clear error messages if limits are reached

## 💡 Pro Tips

1. **Include Feedback Columns**: Add columns like "feedback", "comments", or "notes" in your Excel files for richer AI analysis
2. **Role Information**: Include role/department data for more contextual insights
3. **Regular Monitoring**: Check your Perplexity API usage to avoid unexpected limits

## 🔒 Security & Privacy

- Your API key is stored locally and never shared
- Employee data is not stored by Perplexity
- All API calls use HTTPS encryption
- Data is processed in real-time and not retained

---

**Ready to get started?** Just follow the 3 steps above and you'll have AI-powered performance analysis in minutes! 