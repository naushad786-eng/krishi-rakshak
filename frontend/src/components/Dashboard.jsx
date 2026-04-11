import { useState, useRef } from 'react';

export default function Dashboard({ onLogout }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  // New State Variables for Voice Module
  const [language, setLanguage] = useState('hi');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [audioResponseReady, setAudioResponseReady] = useState(false);

  // Handle file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setResult(null); 
      setAudioResponseReady(false); // Reset voice state
    }
  };

  // Simulate sending image to the AI backend
  const handleAnalyze = () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    
    setTimeout(() => {
      setIsAnalyzing(false);
      setResult({
        status: "Diseased",
        diseaseName: "Tomato Early Blight",
        confidence: "94.2%",
        treatment: "Remove infected lower leaves immediately. Apply a copper-based fungicide spray. Ensure adequate spacing between plants to improve airflow."
      });
    }, 2500);
  };

  // Simulate Voice Recording and Processing
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording and simulate processing
      setIsRecording(false);
      setIsProcessingAudio(true);
      
      setTimeout(() => {
        setIsProcessingAudio(false);
        setAudioResponseReady(true);
      }, 2000);
    } else {
      // Start recording
      setIsRecording(true);
      setAudioResponseReady(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      {/* Navigation Bar */}
      <nav className="bg-green-700 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-wide">Krishi-Rakshak</h1>
        <button 
          onClick={onLogout}
          className="bg-green-600 hover:bg-green-800 px-4 py-2 rounded text-sm font-medium transition-colors border border-green-500"
        >
          Logout
        </button>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
          Plant Disease Diagnostic Tool
        </h2>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center bg-green-50 hover:bg-green-100 transition-colors">
          {!selectedImage ? (
            <div className="flex flex-col items-center">
              <svg className="w-16 h-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-gray-600 mb-2">Upload a clear photo of the affected plant leaf</p>
              <label className="cursor-pointer bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 shadow-sm transition-colors">
                Browse Files
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
          ) : (
             <div className="flex flex-col items-center">
               <img src={selectedImage} alt="Selected Leaf" className="max-h-64 rounded-md shadow-sm mb-4 border border-gray-200" />
               <label className="cursor-pointer text-sm text-green-700 hover:text-green-800 hover:underline font-medium">
                 Change Image
                 <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
               </label>
             </div>
          )}
        </div>

        {/* Analyze Button */}
        {selectedImage && !result && (
          <div className="mt-8 flex justify-center">
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={`px-8 py-3 rounded-md text-white font-medium text-lg shadow-md transition-all ${
                isAnalyzing ? 'bg-gray-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
              }`}
            >
              {isAnalyzing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Analyzing Image...
                </span>
              ) : 'Run AI Diagnosis'}
            </button>
          </div>
        )}

        {/* Results Card */}
        {result && (
          <div className="mt-8 p-6 rounded-lg border border-red-200 bg-red-50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-800 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Threat Detected
              </h3>
              <span className="bg-red-200 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-300">
                {result.confidence} Confidence
              </span>
            </div>
            
            <div className="space-y-3 text-sm text-gray-800 mb-6">
              <p><span className="font-semibold text-gray-900">Diagnosis:</span> {result.diseaseName}</p>
              <div className="bg-white p-4 rounded border border-red-100 shadow-inner">
                <p className="font-semibold text-green-800 mb-1">Recommended Action:</p>
                <p>{result.treatment}</p>
              </div>
            </div>
            
            {/* === MODULE 3: MULTILINGUAL VOICE INTERFACE === */}
            <div className="pt-5 border-t border-red-200">
              <h4 className="font-semibold text-gray-800 mb-3 text-sm">Ask a question about this diagnosis:</h4>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
                
                {/* Language Selector */}
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full sm:w-auto bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-green-500 focus:border-green-500 block p-2.5"
                >
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="en">English</option>
                  <option value="bho">भोजपुरी (Bhojpuri)</option>
                </select>

                {/* Microphone Button */}
                <button 
                  onClick={toggleRecording}
                  disabled={isProcessingAudio}
                  className={`flex items-center justify-center w-12 h-12 rounded-full text-white shadow-md transition-all ${
                    isRecording 
                      ? 'bg-red-500 animate-pulse hover:bg-red-600' 
                      : isProcessingAudio
                        ? 'bg-gray-400 cursor-wait'
                        : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isRecording ? (
                     <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg>
                  ) : (
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                  )}
                </button>

                {/* Status Text */}
                <span className="text-sm font-medium text-gray-600 flex-1">
                  {isRecording ? "Listening..." : isProcessingAudio ? "Translating..." : "Tap to speak"}
                </span>
              </div>

              {/* Simulated Audio Playback */}
              {audioResponseReady && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md flex items-center justify-between animate-fade-in-up">
                  <div className="flex items-center text-blue-800">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                    <span className="text-sm font-semibold">Audio Response Ready</span>
                  </div>
                  <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 shadow-sm transition-colors">
                    Play Audio
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}