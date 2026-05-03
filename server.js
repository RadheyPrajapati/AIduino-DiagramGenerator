const { diagramGenerator } = require('./bot');
const express = require('express');
const cors = require('cors');

const app = express();

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

app.post('/diagramGenerate', async (req, res) => {
  try {
    const { code, diagram_json } = req.body;

    if (!code || !diagram_json) {
      return res.status(400).json({
        error: "code or diagram_json missing"
      });
    }

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
