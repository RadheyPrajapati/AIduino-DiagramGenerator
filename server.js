const { diagramGenerator } = require('./bot');
const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/diagramGenerate', async (req, res) => {
  try {
    const { code, diagram_json } = req.body;

    // ✅ validation
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