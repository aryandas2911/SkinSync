import { RunAnywhere } from './runanywhere';

let llmInstance = null;
let vlmInstance = null;
let initPromise = null;

let chatbotInstance = null;
let chatInitPromise = null;

export const loadModels = async () => {
  if (llmInstance && vlmInstance) {
    return { llm: llmInstance, vlm: vlmInstance };
  }

  // If initialization is already in progress, wait for it
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      console.log('Loading AI models via RunAnywhere SDK...');
      
      // We load them sequentially or concurrently, but typically models are large so concurrent might be heavy on memory.
      // Let's try to load them properly.
      llmInstance = await RunAnywhere.loadModel('Qwen2.5-7B-Instruct');
      vlmInstance = await RunAnywhere.loadModel('Qwen2-VL-2B-Instruct');
      
      console.log('Models loaded successfully.');
      return { llm: llmInstance, vlm: vlmInstance };
    } catch (error) {
      console.error('Failed to load RunAnywhere models:', error);
      initPromise = null; // Reset promise on failure so we can retry
      throw error;
    }
  })();

  return initPromise;
};

export const loadChatbotModel = async () => {
  if (chatbotInstance) {
    return chatbotInstance;
  }

  if (chatInitPromise) {
    return chatInitPromise;
  }

  chatInitPromise = (async () => {
    try {
      console.log('Loading Chatbot AI model via RunAnywhere SDK...');
      chatbotInstance = await RunAnywhere.loadModel('Qwen2.5-7B-Instruct');
      console.log('Chatbot Model loaded successfully.');
      return chatbotInstance;
    } catch (error) {
      console.error('Failed to load RunAnywhere Chatbot model:', error);
      chatInitPromise = null;
      throw error;
    }
  })();

  return chatInitPromise;
};
