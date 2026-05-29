import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Logging Middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });

  // AI Service
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    });
  });

  // System Stats for Monitoring
  app.get("/api/system/stats", (req, res) => {
    res.json({
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptime: process.uptime(),
    });
  });

  // AI Suggestion for Campaign Assignment
  app.post("/api/ai/suggest-assignment", async (req, res) => {
    try {
      const { staff, customers, campaign } = req.body;
      const prompt = `Bạn là một chuyên gia quản trị kinh doanh Viễn thông của VNPT. 
      Dựa trên thông tin nhân viên: ${JSON.stringify(staff)}
      Danh sách khách hàng: ${JSON.stringify(customers)}
      Chiến dịch: ${JSON.stringify(campaign)}
      Hãy phân bổ tập khách hàng này cho nhân viên, gợi ý cách tiếp cận (Upsell/Cross-sell) cho từng khách hàng để đạt KPI cao nhất. 
      Trả về dưới dạng JSON danh sách các cặp {customerId, approach, reason}. Hãy viết bằng tiếng Việt chuyên nghiệp.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = result.text || "[]";
      // Basic JSON extraction from markdown if necessary
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Could not parse AI response", raw: text };

      res.json(suggestions);
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "AI failed to generate suggestions" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VNPT Platform running on http://localhost:${PORT}`);
  });
}

startServer();
