import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { MedicalDocument, MedicationReminder, AnalysisResult, DetectedReminder } from '../types';
import { UploadIcon, FileTextIcon, TrashIcon, SparklesIcon } from './icons';

interface MedicalDocsProps {
  documents: Omit<MedicalDocument, 'data'>[];
  documentData: Record<string, string>;
  addDocument: (doc: MedicalDocument) => void;
  deleteDocument: (id: string) => void;
  setMedications: React.Dispatch<React.SetStateAction<MedicationReminder[]>>;
  analysisResults: { [docId: string]: { analysis?: AnalysisResult; isLoading: boolean } };
  setAnalysisResults: React.Dispatch<React.SetStateAction<{ [docId: string]: { analysis?: AnalysisResult; isLoading: boolean } }>>;
}

const AnalysisDisplay: React.FC<{ analysis: AnalysisResult; onClear: () => void; onAddReminders: (reminders: DetectedReminder[]) => void; }> = ({ analysis, onClear, onAddReminders }) => {
    if (analysis.error) {
        return (
             <div className="flex justify-between items-start">
                <p className="text-red-500">{analysis.error}</p>
                <button onClick={onClear} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex-shrink-0 ml-4">Close</button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {analysis.summary && (
                <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">AI Analysis Summary</h4>
                    <p>{analysis.summary}</p>
                </div>
            )}
             {analysis.medication_reminders && analysis.medication_reminders.length > 0 && (
                <div className="bg-violet-50 dark:bg-violet-900/50 p-3 rounded-md">
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">Detected Medications</h4>
                    <ul className="list-disc list-inside space-y-1 mt-1 text-sm">
                        {analysis.medication_reminders.map((r, i) => <li key={i}>{r.name} - {r.dosage} ({r.time})</li>)}
                    </ul>
                    <button onClick={() => onAddReminders(analysis.medication_reminders || [])} className="mt-3 px-3 py-1 bg-violet-600 text-white rounded-md hover:bg-violet-700 text-sm font-semibold">
                        Add to Reminders
                    </button>
                </div>
            )}
             <button onClick={onClear} className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 pt-2">
                Delete Analysis
             </button>
        </div>
    );
};


export const MedicalDocs: React.FC<MedicalDocsProps> = ({ documents, documentData, addDocument, deleteDocument, setMedications, analysisResults, setAnalysisResults }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const newDocument: MedicalDocument = {
          id: Date.now().toString(),
          name: file.name,
          type: file.type,
          data: e.target?.result as string,
          uploadedAt: new Date().toISOString(),
        };
        addDocument(newDocument);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearAnalysis = (id: string) => {
    setAnalysisResults(prev => {
      const newResults = { ...prev };
      delete newResults[id];
      return newResults;
    });
  };

  const handleStartAnalysis = async (doc: MedicalDocument) => {
    if (!doc.data) {
        alert("Document content is not available for analysis. Please re-upload the file.");
        return;
    }
    setAnalysisResults(prev => ({ ...prev, [doc.id]: { isLoading: true } }));

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const base64Data = doc.data.split(',')[1];
        const filePart = { inlineData: { data: base64Data, mimeType: doc.type } };

        const prompt = `Generate a highly precise and brief summary of the attached medical document. The summary MUST be under 200 words. Focus strictly on the most critical information: primary diagnosis, key quantitative results, prescribed medications with dosages, and follow-up actions. Avoid conversational language and introductory phrases. The summary should be a dense, factual overview.
Also, if you identify any medication schedules (e.g., "take 1 pill twice a day"), extract them into a "medication_reminders" key. This should be an array of objects, each with "name", "dosage", and "time" (in "HH:mm" 24-hour format if possible, otherwise describe the frequency like "Twice daily").
The response must be in a valid JSON format. If the file is unreadable, return a JSON object with an "error" key.`;
        
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: "A concise summary of the medical document, up to 200 words." },
                medication_reminders: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            dosage: { type: Type.STRING },
                            time: { type: Type.STRING }
                        }
                    }
                },
                error: { type: Type.STRING }
            }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }, filePart] },
            config: {
                responseMimeType: "application/json",
                responseSchema,
            }
        });
        
        const responseText = response.text;
        let analysis: AnalysisResult = JSON.parse(responseText);
        
        setAnalysisResults(prev => ({ ...prev, [doc.id]: { analysis, isLoading: false } }));

    } catch (error) {
        console.error("Error analyzing document:", error);
        const errorMessage = error instanceof Error ? error.message : "Sorry, an error occurred during analysis. Please try again.";
        setAnalysisResults(prev => ({ ...prev, [doc.id]: { analysis: { error: errorMessage }, isLoading: false } }));
    }
  };

  const handleAddReminders = (reminders: DetectedReminder[]) => {
      const newMedicationReminders = reminders.map(r => ({
          ...r,
          id: `${Date.now()}-${r.name}`,
          active: true
      }));
      setMedications(prev => [...prev, ...newMedicationReminders]);
      alert(`${reminders.length} reminder(s) have been added!`);
  };


  const acceptedFileTypes = "image/*,application/pdf,text/plain,text/csv,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Medical Documents</h1>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
        <label htmlFor="file-upload" className="relative cursor-pointer flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          <UploadIcon className="h-10 w-10 text-slate-400 mb-2" />
          <span className="text-slate-500 dark:text-slate-400 text-center px-2">
            {isUploading ? 'Uploading...' : 'Click to upload reports, prescriptions, etc.'}
          </span>
          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} disabled={isUploading} accept={acceptedFileTypes} />
        </label>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Uploaded Documents</h2>
        {documents.length > 0 ? (
          <ul className="space-y-3">
            {documents.map(doc => {
              const data = documentData[doc.id];
              const fullDoc: MedicalDocument = { ...doc, data };

              return (
              <li key={doc.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <FileTextIcon className="h-8 w-8 text-violet-500 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <a href={data} download={doc.name} className={`font-semibold truncate block ${!data ? 'text-slate-400 cursor-not-allowed' : 'hover:underline'}`} onClick={(e) => !data && e.preventDefault()}>{doc.name}</a>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-2">
                    <button
                        onClick={() => handleStartAnalysis(fullDoc)}
                        className="p-2 text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 rounded-full hover:bg-violet-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={analysisResults[doc.id]?.isLoading || !data}
                        title={data ? "Analyze with AI" : "Re-upload to analyze"}
                    >
                        <SparklesIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => deleteDocument(doc.id)} className="p-2 text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" title="Delete document">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {!data && (
                    <div className="px-4 pb-3 text-xs text-amber-600 dark:text-amber-400">
                        Note: File content is not available in this session. Re-upload to download or analyze.
                    </div>
                )}

                {analysisResults[doc.id] && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-200 dark:border-slate-700 prose prose-sm dark:prose-invert max-w-none">
                      {analysisResults[doc.id].isLoading && (
                          <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
                              <span className="text-slate-500">AI is analyzing your document...</span>
                          </div>
                      )}
                      {analysisResults[doc.id].analysis && <AnalysisDisplay analysis={analysisResults[doc.id].analysis!} onClear={() => clearAnalysis(doc.id)} onAddReminders={handleAddReminders} />}
                  </div>
                )}
              </li>
            )})}
          </ul>
        ) : (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">No documents uploaded yet.</p>
        )}
      </div>
    </div>
  );
};