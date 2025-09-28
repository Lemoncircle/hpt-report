const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const apiKey = 'AIzaSyBKG1aSi8ywbYZ8QAuI9i9q-pC1QnNHbRA';
  
  try {
    console.log('Listing available Google AI models...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try with different model names that are commonly available
    const commonModels = [
      'gemini-pro',
      'gemini-1.5-pro-latest',
      'gemini-1.0-pro',
      'gemini-pro-vision'
    ];
    
    for (const modelName of commonModels) {
      try {
        console.log(`\nTesting model: ${modelName}`);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.3,
            topP: 0.9,
            maxOutputTokens: 50,
          },
        });

        const result = await model.generateContent("Test");
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ ${modelName} works! Response: ${text.substring(0, 100)}...`);
        break; // Stop after finding the first working model
        
      } catch (error) {
        console.log(`❌ ${modelName} failed: ${error.message.substring(0, 100)}...`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModels();
