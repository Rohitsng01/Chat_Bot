import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaArrowUp, FaRegStopCircle, FaRegCopy } from "react-icons/fa";
import { TbWorld } from "react-icons/tb";
import { HiMicrophone } from "react-icons/hi";
import { IoMdVolumeHigh } from "react-icons/io"; // Added Volume Icon
import './App.css';
import toast from 'react-hot-toast';

function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  const controllerRef = useRef(new AbortController());

  const [isSpeaking, setIsSpeaking] = useState(null); // Track speaking state per message

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to speak or stop speaking the response text
  const speakText = (text, index) => {
    if (isSpeaking === index) {
      // Stop speaking
      speechSynthesis.cancel();
      setIsSpeaking(null);
    } else {
      // Start speaking
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
      utterance.onend = () => {
        setIsSpeaking(null); // Reset speaking state when finished
      };
      setIsSpeaking(index); // Set speaking to the current message index
    }
  };

  async function getResponse() {
    if (!input || isProcessing) {
      alert('Please enter a message or wait for the previous response!');
      return;
    }

    setIsProcessing(true);
    setLoading(true);
    setMessages(prevMessages => [
      ...prevMessages,
      { text: `${input}`, type: 'user' }
    ]);
    setInput('');

    try {
      controllerRef.current = new AbortController();
      const response = await axios({
        url: import.meta.env.VITE_API_URL,
        method: 'POST',
        data: {
          contents: [{ parts: [{ text: input }] }]
        },
        signal: controllerRef.current.signal
      });

      const responseText = response.data.candidates[0].content.parts[0].text;

      setMessages(prevMessages => [
        ...prevMessages,
        { text: responseText, type: 'bot' }
      ]);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled');
      } else {
        setMessages(prevMessages => [
          ...prevMessages,
          { text: "Sorry, something went wrong. Please try again.", type: 'bot' }
        ]);
      }
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  }

  const stopResponse = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      setIsProcessing(false);
    }
  };

  const handleSearch = () => {
    const query = input;
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
    setInput('');
  };

  const handleReason = () => {
    const reasons = ["Why is the sky blue?", "Explain quantum physics.", "How does AI work?"];
    setMessages(prevMessages => [
      ...prevMessages,
      { text: `Here are some common reasons you can ask: ${reasons.join(", ")}`, type: 'bot' }
    ]);
  };

  const startVoiceInput = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();

    recognition.onresult = (event) => {
      const voiceInput = event.results[0][0].transcript;
      setInput(voiceInput);
    };

    recognition.onerror = () => {
      alert("Sorry, I couldn't understand your voice input.");
    };
  };

  const splitMessages = (text) => {
    const parts = [];
    const regex = /(```[\s\S]+?```)/g;
    let lastIndex = 0;

    const matches = text.match(regex);
    if (matches) {
      matches.forEach((match, index) => {
        const beforeCode = text.slice(lastIndex, text.indexOf(match, lastIndex));
        if (beforeCode) {
          parts.push({ type: 'text', content: beforeCode });
        }
        parts.push({ type: 'code', content: match });
        lastIndex = text.indexOf(match, lastIndex) + match.length;
      });
    }

    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText });
    }

    return parts;
  };

  return (
    <div className="flex flex-col items-center h-screen bg-gray-900 text-white">
      <header className="flex justify-between items-center p-4 bg-cyan-800 border-b-4 w-full">
        <h1 className="text-2xl font-semibold">Chatbot</h1>
        <div className="flex space-x-4">
          {/* <button className="px-4 py-2 bg-blue-500 rounded-lg"></button>
          <button className="px-4 py-2 bg-blue-500 rounded-lg">Signup</button> */}
        </div>
      </header>

      <div className="flex-1 p-6 max-w-2xl w-full overflow-y-auto bg-gray-800 shadow-lg rounded-lg">
        <div className="space-y-4 w-full">
          {messages.map((msg, index) => {
            const parts = splitMessages(msg.text);
            return parts.map((part, idx) => {
              const messageClass =
                msg.type === 'user'
                  ? 'bg-blue-600 text-white self-end'
                  : 'bg-gray-700 text-white self-start';

              return (
                <div key={`${index}-${idx}`} className={`flex justify-${msg.type === 'user' ? 'end' : 'start'} max-w-xl transition-all duration-300 `}>
                  {part.type === 'text' && (
                    <div className={`p-3 rounded-lg w-[70%] ${messageClass}`}>
                      {msg.type === 'bot' && (
                        <button onClick={() => speakText(msg.text, index)} className="p-2 text-white rounded-lg hover:color-blue-800">
                          <IoMdVolumeHigh size={20} />
                        </button>
                      )}
                      {part.content}
                    </div>
                  )}
                  {part.type === 'code' && (
                    <div className={`relative p-4 bg-cyan-800 w-[70%] border-4 text-white rounded-lg ${messageClass}`}>
                      <button onClick={() => {
                        navigator.clipboard.writeText(part.content);
                        toast.success('Text copied successfully!');
                      }} className="absolute top-2 right-2 p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500">
                        <FaRegCopy />
                      </button>
                      <pre className="whitespace-pre-wrap">{part.content.replace(/```/g, '')}</pre>
                    </div>
                  )}
                </div>
              );
            });
          })}
        </div>

        {loading && (
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500 mx-auto"></div>
            <p>Loading...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 max-w-2xl w-full bg-gray-800 border-t-4 rounded-lg shadow-lg">
        <div className="flex space-x-2 w-full">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            placeholder="Type your message..."
            disabled={isProcessing}
          />
          <div className="flex space-x-2">
            {isProcessing ? (
              <button onClick={stopResponse} className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600">
                <FaRegStopCircle size={20} />
              </button>
            ) : (
              <button onClick={getResponse} className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                <FaArrowUp size={20} />
              </button>
            )}

            <button onClick={handleReason} className="p-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
              Reason
            </button>

            <button onClick={handleSearch} className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
              <TbWorld size={25} />
            </button>

            <button onClick={startVoiceInput} className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500">
              <HiMicrophone size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
