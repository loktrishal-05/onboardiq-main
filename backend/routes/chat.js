import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are Aria, the AI onboarding assistant for OnboardIQ — an intelligent employee onboarding platform.

Your role:
- Help new employees navigate their onboarding journey
- Answer questions about tasks, timelines, and company processes
- Provide encouragement and guidance during the first 90 days
- Suggest resources, next steps, and help prioritize work
- Be warm, professional, and concise

Personality: Friendly, knowledgeable, proactive. Like a helpful senior colleague who knows everything about the company's onboarding process.

Keep responses concise (2-4 sentences) unless asked for detailed explanations. Use emojis sparingly but appropriately. Never make up specific company names, policies, or people — stay general if you don't have context.`;

// POST /api/chat/message
router.post('/message', requireAuth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message too long.' });
    }

    const user = await User.findById(req.user.id).select('name role department startDate completedTasks');

    const userContext = user
      ? `\n\nEmployee context: Name: ${user.name}, Role: ${user.role}, Department: ${user.department}, Start Date: ${user.startDate?.toISOString().split('T')[0] || 'Unknown'}, Completed Tasks: ${user.completedTasks?.length || 0}`
      : '';

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const chatHistory = history.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: SYSTEM_PROMPT + userContext,
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    res.json({ reply, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Chat error:', err);
    res.json({
      reply: "I'm having trouble connecting right now. Please try again in a moment! 🔄",
      timestamp: new Date().toISOString(),
      error: true,
    });
  }
});

// POST /api/chat/message-public (no auth)
router.post('/message-public', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required.' });

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const chatHistory = history.slice(-6).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history: chatHistory, systemInstruction: SYSTEM_PROMPT });
    const result = await chat.sendMessage(message);
    res.json({ reply: result.response.text(), timestamp: new Date().toISOString() });
  } catch (err) {
    res.json({
      reply: "Hi! I'm Aria, your onboarding assistant. I'm having a bit of trouble connecting — please try again! 🔄",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
