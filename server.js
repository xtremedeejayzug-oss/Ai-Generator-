const express = require("express");
const cors = require("cors");
const multer = require("multer");
const OpenAI = require("openai");
const { toFile } = require("openai/uploads");

const app = express();
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(",").map(s => s.trim()) : true
}));
app.use(express.json({ limit: "1mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(allowed.includes(file.mimetype) ? null : new Error("Please upload a JPG, PNG, or WEBP image."), allowed.includes(file.mimetype));
  }
});

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst";
const ALLOWED_SIZES = new Set(["1024x1024", "1536x1024", "1024x1536"]);

app.get("/health", (_req, res) => res.json({ ok: true, service: "WHISTER AI Image Studio" }));

app.post("/api/generate", upload.single("image"), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "The backend is missing its OPENAI_API_KEY environment variable." });
    }
    const prompt = typeof req.body.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) return res.status(400).json({ error: "Prompt is required." });
    if (prompt.length > 4000) return res.status(400).json({ error: "Prompt is too long." });
    const size = ALLOWED_SIZES.has(req.body.size) ? req.body.size : "1024x1024";

    let result;
    if (req.file) {
      const imageFile = await toFile(req.file.buffer, req.file.originalname || "upload.png", { type: req.file.mimetype });
      result = await client.images.edit({
        model: MODEL,
        image: imageFile,
        prompt,
        size,
        quality: "medium"
      });
    } else {
      result = await client.images.generate({
        model: MODEL,
        prompt,
        size,
        quality: "medium"
      });
    }

    const image = result.data && result.data[0];
    if (!image || !image.b64_json) {
      console.error("Image API returned no base64 image:", JSON.stringify(result).slice(0, 1500));
      return res.status(502).json({ error: "The image service did not return an image. Please try again." });
    }
    res.json({ imageUrl: `data:image/png;base64,${image.b64_json}` });
  } catch (error) {
    console.error("WHISTER AI generation error:", error.status || "", error.message || error);
    const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 500;
    let message = error.message || "Image generation failed.";
    if (status === 401) message = "The backend API key was rejected. Check OPENAI_API_KEY in your backend environment settings.";
    else if (status === 429) message = "The image API rate limit or account quota was reached. Check API billing and limits.";
    else if (status === 400 && req.file) message = "The image or prompt was rejected. Check the file format and try a different prompt.";
    res.status(status).json({ error: message });
  }
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Image is larger than 20 MB. Please choose a smaller image." });
  }
  res.status(400).json({ error: err.message || "Invalid upload." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`WHISTER AI backend listening on port ${PORT}`));
