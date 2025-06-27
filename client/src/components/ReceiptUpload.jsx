import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import { supabase } from '../supabaseClient';

export default function ReceiptUpload({ onContinue }) {
  const [image, setImage] = useState(null);
  const [cleanedItems, setCleanedItems] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
    setCleanedItems("");
    setError("");
  };

  const callGeminiAPI = async (ocrText) => {
    try {
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `Extract a deduplicated list of generic grocery items from this receipt text. For each item, estimate perish days. Add a relevant emoji before each item name. Return as JSON like [{"item": "🍞 Bread", "perish_in_days": 5}].\n\nReceipt:\n${ocrText}`
              }
            ]
          }
        ]
      };

      const response = await fetch("http://localhost:5001/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.text) return data.text;
      if (data.candidates?.length > 0) return data.candidates[0].content.parts[0].text;

      throw new Error("Gemini returned no usable text.");
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  };

  const handleScan = async () => {
    if (!image) return;

    setLoading(true);
    setError("");

    try {
      const result = await Tesseract.recognize(image, 'eng');
      const extractedText = result.data.text;

      if (!extractedText.trim()) {
        throw new Error("No text extracted from the image.");
      }

      const geminiText = await callGeminiAPI(extractedText);
      const cleanedText = geminiText.trim().replace(/```json/g, "").replace(/```/g, "").trim();

      let parsedItems;
      try {
        parsedItems = JSON.parse(cleanedText);
      } catch (parseError) {
        throw new Error(`Failed to parse Gemini response:\n${cleanedText}`);
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error("No user logged in.");

      const now = new Date();
      const itemsToInsert = parsedItems.map(item => ({
        user_id: userId,
        item_name: item.item,
        added_on: now.toISOString(),
        expires_on: new Date(now.getTime() + item.perish_in_days * 24 * 60 * 60 * 1000).toISOString(),
      }));

      const { error: insertError } = await supabase.from('fridge').insert(itemsToInsert);
      if (insertError) throw insertError;

      setCleanedItems(JSON.stringify(parsedItems, null, 2));
    } catch (error) {
      console.error("Scan failed:", error);
      setError(error.message || "Something went wrong during scanning.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 max-w-lg w-full bg-white rounded-xl shadow-lg">
        
        <h2 className="text-3xl font-extrabold text-center text-emerald-800 mb-2">🥗 ChopChop</h2>
        <p className="text-center text-gray-600 mb-6">Upload your receipt to stock your fridge and get recipe ideas!</p>

        {/* File Upload */}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="mb-4 w-full border rounded px-3 py-2 text-sm shadow-sm file:border-none file:bg-emerald-800 file:text-white file:px-4 file:py-2"
        />

        {/* Scan Button */}
        <button
          onClick={handleScan}
          disabled={!image || loading}
          className={`w-full mb-3 py-2 rounded-lg font-semibold text-white shadow transition ${
            loading ? 'bg-emerald-300 cursor-not-allowed' : 'bg-emerald-800 hover:bg-emerald-900'
          }`}
        >
          {loading ? "Scanning..." : "📷 Scan Receipt"}
        </button>

        {/* Skip Button */}
        <button
          onClick={onContinue}
          className="w-full py-2 rounded-lg font-semibold text-blue-800 border border-blue-700 shadow-sm hover:bg-blue-50 transition"
        >
          Skip and Go to Dashboard →
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Cleaned Items */}
        {cleanedItems && (
          <div className="mt-6">
            <h3 className="font-bold text-sm mb-2 text-emerald-800">✅ Cleaned Grocery Items:</h3>
            <pre className="text-xs bg-emerald-50 p-2 rounded whitespace-pre-wrap max-h-60 overflow-y-auto border">
              {cleanedItems}
            </pre>

            <button
              onClick={onContinue}
              className="mt-4 w-full bg-emerald-800 text-white px-4 py-2 rounded hover:bg-emerald-900 transition"
            >
              Continue to Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
