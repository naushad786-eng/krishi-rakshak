import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Dashboard({ onLogout }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  const [lang, setLang] = useState('en');
  const [farmerNotes, setFarmerNotes] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Use a ref to safely store the microphone instance without causing React re-render errors
  const recognitionRef = useRef(null);

  const uiText = {
    en: { title: "Crop Diagnostics", upload: "Upload leaf photo", btn: "Run AI Diagnosis", notes: "Any observations about the plant?", mic: "Speak", stopMic: "Listening...", speak: "Read Aloud", stopSpeak: "Stop Audio" },
    hi: { title: "फसल निदान", upload: "पत्ती की फोटो अपलोड करें", btn: "एआई विश्लेषण चलाएं", notes: "पौधे के बारे में कोई जानकारी?", mic: "बोलें", stopMic: "सुन रहा हूँ...", speak: "जोर से पढ़ें", stopSpeak: "ऑडियो रोकें" },
    ta: { title: "பயிர் கண்டறிதல்", upload: "இலை புகைப்படத்தை பதிவேற்றவும்", btn: "பகுப்பாய்வு செய்", notes: "தாவரத்தைப் பற்றிய தகவல்கள்?", mic: "பேசு", stopMic: "கேட்கிறது...", speak: "படியுங்கள்", stopSpeak: "நிறுத்து" }
  };

  // Safely clean up audio if the user navigates away
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null); 
      setError(''); 
      if (window.speechSynthesis) window.speechSynthesis.cancel(); 
      setIsSpeaking(false);
    }
  };

  // --- SAFE MICROPHONE API ---
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice typing is not supported in this browser. Please type your notes instead.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = lang === 'hi' ? 'hi-IN' : (lang === 'ta' ? 'ta-IN' : 'en-IN');
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      setFarmerNotes(prev => prev + (prev ? " " : "") + e.results[0][0].transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true); setError(''); setResult(null); 
    if (window.speechSynthesis) window.speechSynthesis.cancel(); 
    setIsSpeaking(false);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (farmerNotes) formData.append('notes', farmerNotes);

    try {
      const response = await axios.post('https://krishi-rakshak-r6hs.onrender.com/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.status === 'success') {
        setResult(response.data);
      } else {
        setError(response.data.detail || 'Analysis failed.');
      }
    } catch (err) {
      setError('Failed to connect to the server. Make sure your FastAPI backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // --- SAFE SPEAKER API ---
  const handleSpeak = () => {
    if (!window.speechSynthesis) {
      alert("Voice output is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (!result) return;
      
      // BULLETPROOF CHECK: Safely extract data even if the backend hasn't updated perfectly yet
      const fallbackName = result.disease || "Unknown Disease";
      const fallbackTreatment = result.treatment || "Please consult a local expert.";
      const data = result[lang] || { name: fallbackName, treatment: fallbackTreatment };
      
      const textToSpeak = `${data.name}. ${data.treatment}`;
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = lang === 'hi' ? 'hi-IN' : (lang === 'ta' ? 'ta-IN' : 'en-IN');
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <header className="bg-green-800 text-white shadow-md py-4 px-6 flex justify-between items-center">
        <span className="text-2xl font-bold tracking-wide">Krishi-Rakshak</span>
        <div className="flex gap-2">
          <select 
            value={lang} 
            onChange={(e) => { 
              setLang(e.target.value); 
              if (window.speechSynthesis) window.speechSynthesis.cancel(); 
              setIsSpeaking(false); 
            }} 
            className="bg-green-700 text-white text-sm px-2 py-1 rounded-md outline-none"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="ta">தமிழ்</option>
          </select>
          <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-sm px-4 py-1 rounded-md">Logout</button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col items-center">
        <h1 className="text-3xl font-extrabold text-gray-800 my-4">{uiText[lang]?.title || "Diagnostics"}</h1>

        <div className="w-full bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center">
          
          <div className="w-full mb-4">
            {previewUrl ? (
              <div className="relative w-full max-w-md mx-auto h-64 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                <img src={previewUrl} alt="Selected Leaf" className="w-full h-full object-contain" />
                <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); setResult(null); }} className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full text-xs">✕ Clear</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-green-400 rounded-2xl cursor-pointer bg-green-50/50">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 mb-3 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-2xl font-bold">📷</div>
                  <p className="font-semibold text-gray-700">{uiText[lang]?.upload}</p>
                </div>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>

          <div className="w-full max-w-md mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1">{uiText[lang]?.notes}</label>
            <div className="relative">
              <textarea 
                value={farmerNotes} 
                onChange={(e) => setFarmerNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none h-20"
                placeholder="..."
              ></textarea>
              <button 
                onClick={toggleListening}
                className={`absolute bottom-2 right-2 text-xs font-bold px-3 py-1 rounded-full text-white shadow-md transition-colors ${isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isListening ? uiText[lang]?.stopMic : `🎤 ${uiText[lang]?.mic}`}
              </button>
            </div>
          </div>

          {error && <div className="w-full max-w-md mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center">{error}</div>}

          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || loading}
            className={`w-full max-w-md py-3 px-6 rounded-xl font-bold text-white shadow-lg transition duration-300 ${!selectedFile || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {loading ? 'Processing...' : uiText[lang]?.btn}
          </button>
        </div>

        {result && (
          <div className="w-full max-w-4xl mt-6 bg-white rounded-2xl shadow-xl p-6 border-l-8 border-green-600 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Diagnosis Report</h2>
              <button 
                onClick={handleSpeak} 
                className={`font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors ${isSpeaking ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
              >
                {isSpeaking ? `⏹ ${uiText[lang]?.stopSpeak}` : `🔊 ${uiText[lang]?.speak}`}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold uppercase">Detected Condition</p>
                <p className="text-2xl font-black text-green-800">
                  {result[lang]?.name || result.disease || "Unknown"}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold uppercase">AI Confidence</p>
                <p className="text-2xl font-black text-green-800">{result.confidence}%</p>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <p className="text-xs text-green-800 font-semibold uppercase mb-1">Recommended Treatment</p>
              <p className="text-lg text-gray-800">
                {result[lang]?.treatment || result.treatment || "No treatment data available."}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}