import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaArrowUp, FaRegStopCircle, FaRegCopy } from "react-icons/fa";
import { TbWorld } from "react-icons/tb";
import { HiMicrophone } from "react-icons/hi";
import { IoMdVolumeHigh } from "react-icons/io";
import toast from 'react-hot-toast';
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
    setIsProcessing(true);
    setLoading(true);
    setMessages(prev => [...prev, { text: input, type: 'user' }]);
    setInput('');

    try {
      controllerRef.current = new AbortController();
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        { contents: [{ parts: [{ text: input }] }] },
        { signal: controllerRef.current.signal }
      );
      const responseText = res.data.candidates[0].content.parts[0].text;
      setMessages(prev => [...prev, { text: responseText, type: 'bot' }]);
    } catch (err) {
      const message = axios.isCancel(err)
        ? 'Request canceled'
        : 'Sorry, something went wrong. Please try again.';
      setMessages(prev => [...prev, { text: message, type: 'bot' }]);
    } finally {
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
      text: `Here are some common reasons you can ask: ${reasons.join(", ")}`,
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

  const splitMessages = (text) => {
    const parts = [];
    const regex = /(```[\s\S]+?```)/g;
    let lastIndex = 0;
    const matches = text.match(regex);

    if (matches) {
      matches.forEach(match => {
        const index = text.indexOf(match, lastIndex);
        if (index > lastIndex) {
          parts.push({ type: 'text', content: text.slice(lastIndex, index) });
        }
        parts.push({ type: 'code', content: match });
        lastIndex = index + match.length;
      });
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }
    return parts;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') getResponse();
  };

  return (
    <div className="flex flex-col items-center h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <header className="flex justify-between items-center p-4 bg-cyan-800 w-full shadow-md">
        <h1 className="text-2xl font-bold">🤖 Chatbot</h1>
      </header>

      <div className="flex-1 w-full max-w-3xl p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          splitMessages(msg.text).map((part, idx) => (
            <div key={`${index}-${idx}`} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
              <div className={`p-3 rounded-xl max-w-[80%] ${msg.type === 'user' ? 'bg-blue-600' : 'bg-gray-700'} hover:scale-105 transition-transform duration-300`}>
                {part.type === 'text' ? (
                  <>
                    {msg.type === 'bot' && (
                      <button onClick={() => speakText(msg.text, index)} className="float-right ml-2 hover:text-yellow-400">
                        <IoMdVolumeHigh size={20} />
                      </button>
                    )}
                    {part.content}
                  </>
                ) : (
                  <div className="relative bg-cyan-800 p-3 rounded-lg text-sm">
                    <button onClick={() => {
                      navigator.clipboard.writeText(part.content);
                      toast.success('Copied to clipboard!');
                    }} className="absolute top-1 right-1 p-1 hover:bg-cyan-700 rounded">
                      <FaRegCopy />
                    </button>
                    <pre className="whitespace-pre-wrap">{part.content.replace(/```/g, '')}</pre>
                  </div>
                )}
              </div>
            </div>
          ))
        ))}
        {loading && (
          <div className="text-center text-gray-400 animate-pulse mt-4">Generating response...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="w-full max-w-3xl p-4 bg-gray-800">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 p-3 rounded-lg bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            placeholder="Type your message..."
            disabled={isProcessing}
          />
          <button
            onClick={isProcessing ? stopResponse : getResponse}
            className={`p-3 rounded-lg ${isProcessing ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isProcessing ? <FaRegStopCircle size={20} /> : <FaArrowUp size={20} />}
          </button>
          <button onClick={handleReason} className="p-3 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg">Reason</button>
          <button onClick={handleSearch} className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg">
            <TbWorld size={20} />
          </button>
          <button onClick={startVoiceInput} className="p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">
            <HiMicrophone size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
