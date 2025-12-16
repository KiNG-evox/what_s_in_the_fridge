import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

console.log('🔍 Checking available models...\n');

// List all available models
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  .then(res => res.json())
  .then(data => {
    console.log('Available models:');
    
    if (data.models) {
      data.models.forEach(model => {
        console.log(`\n✅ ${model.name}`);
        console.log(`   Display Name: ${model.displayName}`);
        console.log(`   Supported: ${model.supportedGenerationMethods?.join(', ')}`);
      });
    } else {
      console.log('No models found or error:', data);
    }
  })
  .catch(err => console.error('❌ Error:', err.message));