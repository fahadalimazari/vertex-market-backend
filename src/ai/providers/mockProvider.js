// Mock AI Provider (will connect to OpenAI/Gemini later)
export const mockGenerateText = async (prompt) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`[Mock AI Response]: Based on your input "${prompt.substring(0, 20)}...", here is a simulated AI output.`);
    }, 500);
  });
};

export const mockGenerateRecommendations = async (userId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, name: 'AI Recommended Phone', price: 999 },
        { id: 2, name: 'AI Recommended Watch', price: 299 },
      ]);
    }, 500);
  });
};
