import dotenv from "dotenv";
dotenv.config();

/**
 * Generate recipes using Google Gemini AI
 */
export async function generateRecipes(ingredients) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not found in environment variables");
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const prompt = `Generate 4 SHORT recipes using: ${ingredients.join(", ")}

IMPORTANT: Keep recipes concise. Return ONLY valid JSON array.

Format:
[
  {
    "title": "Recipe Name",
    "description": "Brief description under 100 chars",
    "ingredients": [{"name": "item", "quantity": 2, "unit": "cups"}],
    "instructions": [{"step": 1, "description": "Short instruction"}],
    "cookingTime": 15,
    "preparationTime": 5,
    "servings": 2,
    "difficulty": "Easy",
    "category": "Breakfast",
    "tags": ["Quick"],
    "nutritionalInfo": {"calories": 200, "protein": 10, "carbs": 25, "fat": 8}
  }
]

Keep instructions to 10-15 steps maximum. Return ONLY the JSON array.`;

        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 8192,
                topP: 0.8,
                topK: 40
            }
        };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();

        if (!data.candidates?.length || !data.candidates[0].content?.parts?.length) {
            throw new Error("Invalid response structure from Gemini");
        }

        let generatedText = data.candidates[0].content.parts[0].text;

        generatedText = generatedText.replace(/```json/g, "").replace(/```/g, "");

        const arrayStart = generatedText.indexOf("[");
        const arrayEnd = generatedText.lastIndexOf("]");

        if (arrayStart === -1) {
            throw new Error("Could not find JSON array start in response");
        }

        if (arrayEnd === -1) {
            const lastCompleteRecipe = generatedText.lastIndexOf("}");
            if (lastCompleteRecipe !== -1) {
                generatedText = generatedText.substring(arrayStart, lastCompleteRecipe + 1) + "\n]";
            } else {
                throw new Error("Response was cut off and cannot be recovered");
            }
        } else {
            generatedText = generatedText.substring(arrayStart, arrayEnd + 1);
        }

        generatedText = generatedText.replace(/[""]/g, '"');
        generatedText = generatedText.replace(/['']/g, "'");
        generatedText = generatedText.replace(/,\s*}/g, "}");
        generatedText = generatedText.replace(/,\s*]/g, "]");

        let recipes;

        try {
            recipes = JSON.parse(generatedText);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError.message);
            throw new Error(`JSON parsing failed: ${parseError.message}`);
        }

        if (!Array.isArray(recipes)) {
            throw new Error("AI did not return an array of recipes");
        }

        if (recipes.length === 0) {
            throw new Error("AI returned empty array");
        }

        console.log(`Successfully generated ${recipes.length} recipe(s)!`);

        return recipes;

    } catch (error) {
        console.error("Error in generateRecipes:", error.message);
        throw error;
    }
}
