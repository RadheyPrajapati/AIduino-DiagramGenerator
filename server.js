// const { diagramGenerator } = require('./bot');
// const express = require('express');
// const cors = require('cors');

// const app = express();

// app.use(express.json());

// // ✅ CORS CONFIG (IMPORTANT)
// app.use(cors({
//   origin: [
//     "http://localhost:5173", // your frontend
//   ],
//   methods: ["GET", "POST"],
//   credentials: true
// }));

// // ✅ handle preflight
// app.options('*', cors());

// const PORT = process.env.PORT || 3000;

// app.post('/diagramGenerate', async (req, res) => {
//   try {
//     const { code, diagram_json } = req.body;

//     if (!code || !diagram_json) {
//       return res.status(400).json({
//         error: "code or diagram_json missing"
//       });
//     }

//     const link = await diagramGenerator(
//       'https://wokwi.com/projects/461921499009843201',
//       code,
//       diagram_json
//     );

//     res.json({
//       diagramLink: link
//     });

//   } catch (err) {
//     res.status(500).json({
//       error: err.message
//     });
//   }
// });

// app.listen(PORT, () =>
//   console.log(`server running on port : http://localhost:${PORT}`)
// );

const { diagramGenerator } = require('./bot');
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const ai = new GoogleGenAI({});

app.use(express.json());

// ✅ CORS CONFIG (IMPORTANT)
app.use(cors({
  origin: [
    "http://localhost:5173", // your frontend
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

// ✅ handle preflight
app.options('*', cors());

const PORT = process.env.PORT || 3000;

// Gemini generation helper function
async function generateWokwiJson(code) {
  const prompt = `Analyze the following Arduino code and generate a valid Wokwi diagram.json configuration representing the circuit connections.
The JSON must have the following structure:
{
  "version": 1,
  "author": "Unidentified",
  "editor": "wokwi",
  "parts": [
    { "type": "wokwi-arduino-uno", "id": "uno", "top": 0, "left": 0, "attrs": {} },
    ...
  ],
  "connections": [
    [ "uno:13", "r1:1", "green", [ "v0" ] ],
    ...
  ]
}

Ensure all parts mentioned in the code (such as LEDs, resistors, LCDs, servo motors, ultrasonic sensors, etc.) are declared in the "parts" array and correctly connected to the "uno" board pinouts in the "connections" array.
For example, if an LED is connected to pin 13:
- Add a "wokwi-led" part (e.g. id "led1").
- Add a "wokwi-resistor" part (e.g. id "r1", value "220").
- Connect "uno:13" to "r1:1", connect "r1:2" to "led1:A" (Anode), and connect "uno:GND.1" (or GND) to "led1:C" (Cathode).

Respond ONLY with the raw JSON string. Do not include markdown code block formatting (such as \`\`\`json) or any conversational text.

Arduino Code:
${code}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  const jsonText = response.text;
  return JSON.parse(jsonText);
}

app.post('/diagramGenerate', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        error: "code is required"
      });
    }

    console.log("Generating Wokwi diagram JSON via Gemini...");
    let diagram_json;
    try {
      diagram_json = await generateWokwiJson(code);
    } catch (parseErr) {
      console.error("Failed to generate custom Wokwi JSON via Gemini. Using default Uno layout.", parseErr.message);
      diagram_json = {
        version: 1,
        author: "Unidentified",
        editor: "wokwi",
        parts: [
          { type: "wokwi-arduino-uno", id: "uno", top: 0, left: 0, attrs: {} }
        ],
        connections: []
      };
    }

    console.log("Generated JSON layout successfully");

    const link = await diagramGenerator(
      'https://wokwi.com/projects/461921499009843201',
      code,
      diagram_json
    );

    res.json({
      diagramLink: link
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.listen(PORT, () =>
  console.log(`server running on port : http://localhost:${PORT}`)
);
