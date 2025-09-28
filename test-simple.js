const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testSimple() {
  const apiKey = 'AIzaSyBKG1aSi8ywbYZ8QAuI9i9q-pC1QnNHbRA';
  
  try {
    console.log('Testing with gemini-1.5-flash (most common model)...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash"
    });

    const result = await model.generateContent("Hello! Please respond with 'API working'");
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Success! Response:', text);
    
  } catch (error) {
    console.error('❌ Error with gemini-1.5-flash:', error.message);
    
    // Try gemini-pro as fallback
    try {
      console.log('\nTrying gemini-pro as fallback...');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-pro"
      });

      const result = await model.generateContent("Hello! Please respond with 'API working'");
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Success with gemini-pro! Response:', text);
      
    } catch (error2) {
      console.error('❌ Error with gemini-pro:', error2.message);
      
      // Check if it's an API key issue
      if (error2.message.includes('API_KEY_INVALID') || error2.message.includes('403')) {
        console.error('🔑 API Key appears to be invalid or lacks permissions');
      }
    }
  }
}

testSimple();
