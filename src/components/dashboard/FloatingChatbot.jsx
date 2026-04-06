import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, User } from 'lucide-react';
import { generateChatResponse } from '../../ai/chatbotService';

const EXAMPLE_QUESTIONS = [
  "Is niacinamide safe for sensitive skin?",
  "Can I use salicylic acid with retinol?",
  "What ingredients should I avoid for acne?"
];

export default function FloatingChatbot({ userProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('skinsync_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load chat history', e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('skinsync_chat_history', JSON.stringify(messages.slice(-20))); // Keep last 20
    }
  }, [messages]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleOpen = async () => {
    setIsOpen(true);
    // Lazy load the model right when they open it the first time
    if (!localStorage.getItem('skinsync_chat_initialized')) {
       setIsInitializing(true);
       try {
         // pre-load the chatbot model
         const { loadChatbotModel } = await import('../../ai/modelLoader');
         await loadChatbotModel();
         localStorage.setItem('skinsync_chat_initialized', 'true');
       } catch (err) {
         console.error('Initial load failed', err);
       } finally {
         setIsInitializing(false);
       }
    }
  };

  const handleSend = async (customMessage) => {
    const textToSend = customMessage || message;
    if (!textToSend.trim()) return;

    const newMessages = [...messages, { id: Date.now(), text: textToSend, sender: 'user' }];
    setMessages(newMessages);
    setMessage('');
    setIsLoading(true);

    try {
      // Send last 5 messages for context
      const historyContext = newMessages.slice(-5);
      
      const response = await generateChatResponse(
        textToSend, 
        userProfile?.skinProfile, 
        historyContext
      );

      setMessages(prev => [...prev, { id: Date.now(), text: response, sender: 'ai' }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now(), text: "I'm having trouble connecting to the network right now. Please try again.", sender: 'ai' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Keyboard accessibility for closing
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);


  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0px 10px 20px rgba(79, 125, 243, 0.4)" },
    tap: { scale: 0.95 }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={handleOpen}
            className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg z-50 transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-[#F7F6F3]"
            aria-label="Open AI Skin Assistant"
          >
            <Sparkles className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-[calc(100vw-3rem)] md:w-[400px] h-[550px] max-h-[calc(100vh-6rem)] bg-white rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="bg-primary px-5 py-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">SkinSync AI</h3>
                  <p className="text-white/80 text-xs font-medium">Skincare Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors shrink-0"
                aria-label="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
              
              {/* Welcome Message & Chips */}
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-2 max-w-[85%] relative group">
                   <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                   </div>
                   <div className="bg-white border border-gray-100 text-text p-3 rounded-2xl rounded-tl-sm shadow-sm text-sm whitespace-pre-wrap leading-relaxed inline-block">
                      Hi! I'm your personalized skincare assistant. Based on your profile, how can I help you today?
                   </div>
                </div>

                <div className="flex flex-wrap gap-2 pl-10">
                  {EXAMPLE_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      disabled={isLoading || isInitializing}
                      className="text-left bg-white border border-primary/20 text-primary text-xs font-medium px-3 py-2 rounded-xl hover:bg-primary/5 transition-colors disabled:opacity-50"
                    >
                      "{q}"
                    </button>
                  ))}
                </div>
              </div>

              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex items-start gap-2 max-w-[85%] relative group ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transform translate-y-1 ${
                    msg.sender === 'user' ? 'bg-secondary/20' : 'bg-primary/10'
                  }`}>
                    {msg.sender === 'user' 
                      ? <User className="w-4 h-4 text-secondary-dark" />
                      : <Sparkles className="w-4 h-4 text-primary" />
                    }
                  </div>
                  
                  {/* Bubble */}
                  <div className={`p-3 text-sm whitespace-pre-wrap leading-relaxed inline-block shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-secondary text-primary-dark rounded-2xl rounded-tr-sm'
                      : 'bg-white border border-gray-100 text-text rounded-2xl rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {isInitializing && (
                <div className="flex justify-center my-4">
                   <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm text-xs font-medium text-text-muted">
                     <div className="flex gap-1">
                       <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                       <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                       <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></span>
                     </div>
                     Initializing AI...
                   </div>
                </div>
              )}

              {isLoading && !isInitializing && (
                <div className="flex items-start gap-2 max-w-[85%]">
                   <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                   </div>
                   <div className="bg-white border border-gray-100 text-text px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2 h-[42px]">
                     <div className="flex gap-1">
                       <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                       <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                       <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                     </div>
                   </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Input Area */}
            <div className="px-4 py-4 bg-white border-t border-gray-100 shrink-0">
              <div className="relative flex items-end gap-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a skincare question..."
                  className="w-full bg-gray-50 border-transparent focus:border-primary/30 focus:bg-white focus:ring-0 rounded-2xl py-3 px-4 text-sm resize-none h-[48px] max-h-[120px] scrollbar-hide text-text pr-12 transition-all outline-none"
                  disabled={isLoading || isInitializing}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!message.trim() || isLoading || isInitializing}
                  className="absolute right-2 bottom-1.5 w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:bg-gray-300 hover:bg-primary-dark"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center mt-2">
                <span className="text-[10px] text-text-muted">AI can make mistakes. Consult a doctor for medical issues.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
