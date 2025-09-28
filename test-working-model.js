const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testWorkingModel() {
  const apiKey = 'AIzaSyBKG1aSi8ywbYZ8QAuI9i9q-pC1QnNHbRA';
  
  // Test with the models we found that support generateContent
  const modelsToTest = [
    'gemini-2.5-flash',
    'gemini-2.5-pro-preview-03-25',
    'gemini-2.5-flash-preview-05-20'
  ];
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`\nTesting model: ${modelName}`);
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.3,
          topP: 0.9,
          maxOutputTokens: 100,
        },
      });

      const result = await model.generateContent("Hello! Please respond with 'API connection successful' and nothing else.");
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName} works!`);
      console.log(`Response: ${text}`);
      console.log(`This model should be used in the application.`);
      break; // Stop after finding the first working model
      
    } catch (error) {
      console.log(`❌ ${modelName} failed: ${error.message.substring(0, 150)}...`);
    }
  }
}

testWorkingModel();
