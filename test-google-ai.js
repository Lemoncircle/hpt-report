const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGoogleAI() {
  const apiKey = 'AIzaSyBKG1aSi8ywbYZ8QAuI9i9q-pC1QnNHbRA';
  
  try {
    console.log('Testing Google AI API connection...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 100,
      },
    });

    const result = await model.generateContent("Hello, this is a test. Please respond with 'API connection successful'.");
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Google AI API Response:', text);
    console.log('✅ API connection is working!');
    
  } catch (error) {
    console.error('❌ Google AI API Error:', error.message);
    if (error.message.includes('API_KEY_INVALID')) {
      console.error('❌ The API key is invalid or expired');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      console.error('❌ API quota exceeded');
    } else if (error.message.includes('RATE_LIMIT_EXCEEDED')) {
      console.error('❌ Rate limit exceeded');
    }
  }
}

testGoogleAI();
