import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaArrowUp, FaRegStopCircle, FaRegCopy } from "react-icons/fa";
import { TbWorld } from "react-icons/tb";
import { HiMicrophone } from "react-icons/hi";
import { IoMdVolumeHigh } from "react-icons/io";
import toast, { Toaster } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  const controllerRef = useRef(new AbortController());
  const [isSpeaking, setIsSpeaking] = useState(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speakText = (text, index) => {
    if (isSpeaking === index) {
      speechSynthesis.cancel();
      setIsSpeaking(null);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
      utterance.onend = () => setIsSpeaking(null);
      setIsSpeaking(index);
    }
  };

  async function getResponse() {
    if (!input.trim() || isProcessing) {
      toast.error('Please enter a message or wait for the previous response!');
      return;
    }
    
    if (!apiKey) {
      toast.error('API Key is missing! Check your .env file.');
      console.error('API Key not found in environment variables');
      return;
    }
    
    console.log('API Key loaded:', apiKey.substring(0, 10) + '...');
    setIsProcessing(true);
    setLoading(true);
    setMessages(prev => [...prev, { text: input, type: 'user' }]);
    setInput('');

    try {
      controllerRef.current = new AbortController();
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `Please respond in clean Markdown format (headings, lists, paragraphs, code blocks). ${input}`,
                },
              ],
            },
          ],
        },
        { signal: controllerRef.current.signal }
      );

      const responseText = res.data.candidates[0].content.parts[0].text;
      setMessages(prev => [...prev, { text: responseText, type: 'bot' }]);
    }catch (err) {
  console.error('API Error:', err.response?.data || err.message);
  console.error('Full Error Object:', err);
  console.error('Error Status:', err.response?.status);
  console.error('Request URL:', err.config?.url);
  console.error('Error Response Data:', JSON.stringify(err.response?.data, null, 2));
  
  let message = 'Sorry, something went wrong. Please try again.';
  
  if (axios.isCancel(err)) {
    message = 'Request canceled';
  } else if (err.response?.status === 400) {
    message = 'Invalid API request: ' + (err.response?.data?.error?.message || 'Check API key');
  } else if (err.response?.status === 403) {
    message = 'API key is invalid or lacks permissions';
  } else if (err.response?.status === 404) {
    message = 'Model not found. The API endpoint may have changed.';
  } else if (err.response?.status === 429) {
    message = 'Rate limit exceeded. Try again later.';
  } else if (err.response?.data?.error?.message) {
    message = err.response.data.error.message;
  }
  
  setMessages(prev => [...prev, { text: message, type: 'bot' }]);
}finally {
      setLoading(false);
      setIsProcessing(false);
    }
  }

  const stopResponse = () => {
    controllerRef.current.abort();
    setIsProcessing(false);
  };

  const handleSearch = () => {
    window.open(`https://www.google.com/search?q=${input}`, '_blank');
    setInput('');
  };

  const handleReason = () => {
    const reasons = ["Why is the sky blue?", "Explain quantum physics.", "How does AI work?"];
    setMessages(prev => [...prev, {
      text: `Here are some common reasons you can ask:\n\n- ${reasons.join("\n- ")}`,
      type: 'bot'
    }]);
  };

  const startVoiceInput = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();

    recognition.onresult = event => {
      const voiceInput = event.results[0][0].transcript;
      setInput(voiceInput);
    };

    recognition.onerror = () => toast.error("Sorry, I couldn't understand your voice input.");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') getResponse();
  };

  return (
    <div className="app-container text-white">
      <Toaster position="top-center" toastOptions={{
        style: {
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#fff',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      }} />
      
      <header className="glass-header flex justify-between items-center p-5 w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <span className="text-2xl">🤖</span>
          </div>
          <h1 className="text-3xl font-bold logo-gradient">AI Chatbot</h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold shadow-lg">
            ● Online
          </span>
        </div>
      </header>

      <div className="w-full flex justify-center" style={{ position: 'relative', zIndex: 10, flex: 1 }}>
        <div className="w-full max-w-4xl p-6" style={{ paddingBottom: '20px' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-2xl animate-pulse">
              <span className="text-5xl">💬</span>
            </div>
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Welcome to AI Chatbot
            </h2>
            <p className="text-gray-300 text-lg mb-6 max-w-md">
              Ask me anything! I'm here to help with questions, code, explanations, and more.
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-all cursor-pointer">
                💡 Get creative ideas
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-all cursor-pointer">
                🔍 Research topics
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-all cursor-pointer">
                💻 Write code
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} mb-4 message-enter`}>
            <div className={`p-4 rounded-2xl max-w-[85%] ${msg.type === 'user' ? 'user-message text-white' : 'bot-message text-gray-100'}`}
                 style={{ position: 'relative', overflow: 'hidden' }}>
              {msg.type === 'bot' && (
                <button 
                  onClick={() => speakText(msg.text, index)} 
                  className="float-right ml-3 p-2 rounded-lg hover:bg-white/10 transition-all"
                  style={{ marginTop: '-4px' }}
                >
                  <IoMdVolumeHigh size={20} className={isSpeaking === index ? 'text-purple-400' : 'text-gray-300'} />
                </button>
              )}
              <div className="markdown-content">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      return !inline ? (
                        <div className="code-container my-3">
                          <div className="code-header">
                            <span className="text-xs text-purple-300 font-semibold">CODE</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(children);
                                toast.success('Copied to clipboard! ✨');
                              }} 
                              className="p-1.5 hover:bg-white/10 rounded-lg transition-all flex items-center gap-1.5 text-xs text-gray-300 hover:text-white"
                            >
                              <FaRegCopy size={14} />
                              <span>Copy</span>
                            </button>
                          </div>
                          <pre className="whitespace-pre-wrap p-4 text-sm font-mono text-green-200 overflow-x-auto">
                            {children}
                          </pre>
                        </div>
                      ) : (
                        <code className="inline-code font-mono">{children}</code>
                      );
                    }
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="bot-message p-4 rounded-2xl">
              <div className="loading-dots">
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="glass-input-container w-full flex justify-center">
        <div className="w-full max-w-4xl p-5">
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="modern-input flex-1 p-4 rounded-2xl text-white placeholder-gray-400 text-base"
            placeholder="Type your message here..."
            disabled={isProcessing}
            style={{ fontSize: '16px' }}
          />
          <button
            onClick={isProcessing ? stopResponse : getResponse}
            className={`icon-button p-4 rounded-2xl ${isProcessing ? 'btn-stop' : 'btn-send'} text-white shadow-lg`}
            title={isProcessing ? 'Stop' : 'Send'}
          >
            {isProcessing ? <FaRegStopCircle size={22} /> : <FaArrowUp size={22} />}
          </button>
          <button 
            onClick={handleReason} 
            className="icon-button btn-reason p-4 rounded-2xl text-white shadow-lg hidden sm:block"
            title="Get suggestions"
          >
            <span className="text-xl">💡</span>
          </button>
          <button 
            onClick={handleSearch} 
            className="icon-button btn-search p-4 rounded-2xl text-white shadow-lg"
            title="Search on Google"
          >
            <TbWorld size={22} />
          </button>
          <button 
            onClick={startVoiceInput} 
            className="icon-button btn-voice p-4 rounded-2xl text-white shadow-lg"
            title="Voice input"
          >
            <HiMicrophone size={22} />
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

export default App;
