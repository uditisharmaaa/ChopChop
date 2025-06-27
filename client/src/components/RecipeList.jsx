import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import ReactMarkdown from 'react-markdown';

export default function RecipeList() {
  const [fridgeItems, setFridgeItems] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const availableFilters = [
    "Vegetarian",
    "High Protein",
    "Chicken Dishes",
    "High Veggie",
    "Low Calorie",
  ];

  useEffect(() => {
    fetchFridgeItems();
  }, []);

  const fetchFridgeItems = async () => {
    const { data, error } = await supabase
      .from('fridge')
      .select('item_name, expires_on')
      .order('expires_on', { ascending: true });

    if (error) console.error('Error fetching fridge items:', error);
    else setFridgeItems(data);
  };

  const handleFilterChange = (filter) => {
    setSelectedFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  const callGeminiAPI = async (fridgeItems, selectedFilters) => {
    const ingredientList = fridgeItems.map(item => item.item_name).join(', ');
    const filterText = selectedFilters.length > 0 ? selectedFilters.join(', ') : "any";

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `Given the following ingredients from my fridge: ${ingredientList}.\n\nI want 3 detailed recipe suggestions that:\n- Prioritize ingredients that will expire soon.\n- Fit these dietary filters: ${filterText}.\n- Format the response in clean Markdown:\n  - Use H2 headings (##) for each recipe title\n  - Bold section titles like **Ingredients:** and **Instructions:**\n  - Bullet lists for ingredients\n  - Numbered steps for instructions\n\nPlease avoid extra text outside the recipes.`
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch("http://localhost:5001/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      const textResponse =
        data.text || (data.candidates?.length > 0 ? data.candidates[0].content.parts[0].text : "");

      const recipeSections = textResponse
        .split(/^##\s+/gm)
        .filter(Boolean)
        .map((section) => `## ${section.trim()}`);

      setRecipes(recipeSections);
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  };

  const handleGenerateRecipes = async () => {
    setLoading(true);
    setError("");
    setRecipes([]);

    try {
      await callGeminiAPI(fridgeItems, selectedFilters);
    } catch (err) {
      setError(err.message || "Failed to generate recipes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-white p-6 rounded-2xl shadow-sm">
      
      {/* Filters */}
      <div className="mb-6 p-4 rounded-lg bg-emerald-100/30 shadow-sm">
        <div className="flex flex-wrap gap-3 justify-center">
          {availableFilters.map((filter) => (
            <label
              key={filter}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full cursor-pointer text-sm shadow-sm transition ${
                selectedFilters.includes(filter)
                  ? 'bg-emerald-700 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedFilters.includes(filter)}
                onChange={() => handleFilterChange(filter)}
                className="hidden"
              />
              <span>{filter}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateRecipes}
        disabled={loading}
        className={`w-full py-3 rounded-xl font-semibold text-white shadow-md transition ${
          loading ? 'bg-emerald-300 cursor-not-allowed' : 'bg-emerald-700 hover:bg-emerald-800'
        }`}
      >
        {loading ? "Generating Recipes..." : "✨ Generate Recipes"}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Recipe Cards */}
      <div className="mt-8 grid grid-cols-1 gap-6">
        {recipes.map((recipeText, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition overflow-y-auto max-h-[600px] text-sm leading-relaxed prose prose-base prose-headings:text-emerald-800 prose-h2:text-3xl prose-h2:font-bold prose-strong:text-gray-900 prose-li:marker:text-emerald-600"
          >
            <ReactMarkdown
              components={{
                h2: ({ node, ...props }) => (
                  <h2 className="text-3xl font-extrabold text-emerald-800 mb-4" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-semibold text-gray-900" {...props} />
                ),
              }}
            >
              {recipeText}
            </ReactMarkdown>
          </div>
        ))}
      </div>
    </div>
  );
}
