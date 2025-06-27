import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());

// ✅ Route to call Gemini API
app.post('/api/gemini', async (req, res) => {
  try {
    const { contents } = req.body;

    console.log('📥 Incoming request body:', JSON.stringify(req.body, null, 2));

    const geminiResponse = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCD1_8YzeCVNPTeJKQC06elCM777FDbn8M',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents }),
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error('❌ Gemini API error:', data);
      return res.status(500).json({ error: 'Gemini API error', details: data });
    }

    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('✅ Gemini response:', responseText);
    res.json({ text: responseText });
  } catch (err) {
    console.error('❌ Server crashed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
