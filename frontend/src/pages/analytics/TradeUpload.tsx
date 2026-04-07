import React, { useState, useRef } from 'react';
import { tradeService } from '../../services/api';
import { UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';

const TradeUpload: React.FC = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setResult(null);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const response = await tradeService.uploadHistory(files);
      setResult({
        inserted: response.inserted_rows,
        skipped: response.skipped_rows,
        message: response.message
      });
      setFiles([]); // Reset after success
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || 'An unexpected error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setFiles([]);
    setError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-full flex flex-col relative z-10 max-w-4xl mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-100 font-outfit mb-4">
          Data Pipeline Ingestion
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Upload bulk Excel or CSV shipment records. Our engine automatically parses columns, maps aliased fields, and scrubs duplicate shipments securely into the database.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {result && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/50 rounded-xl text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-emerald-400 mb-2">Upload Complete!</h3>
            <p className="text-slate-300 mb-4">{result.message}</p>
            
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-mono font-bold text-slate-100">{result.inserted.toLocaleString()}</p>
                <p className="text-xs font-medium text-emerald-500 uppercase tracking-wider">New Records</p>
              </div>
              <div className="w-px bg-slate-700/50"></div>
              <div className="text-center">
                <p className="text-3xl font-mono font-bold text-slate-100">{result.skipped.toLocaleString()}</p>
                <p className="text-xs font-medium text-amber-500 uppercase tracking-wider">Duplicates Skipped</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div 
        className={`bg-slate-900/50 backdrop-blur-xl border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${isDragOver ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-700/50 hover:border-slate-600'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {files.length === 0 ? (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <UploadCloud className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">Drag and drop your file here</h3>
            <p className="text-slate-400 mb-8">Supported formats: .csv, .xls, .xlsx (Max 100MB)</p>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".csv, .xls, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              multiple
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors border border-slate-700"
            >
              Browse Files
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <FileSpreadsheet className="w-16 h-16 text-emerald-500 mb-4" />
            <h3 className="text-xl font-semibold text-slate-100 mb-1">
              {files.length === 1 ? files[0].name : `${files.length} files selected`}
            </h3>
            <p className="text-slate-400 mb-8">
              ({(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB total)
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={handleCancel}
                disabled={isUploading}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors border border-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpload}
                disabled={isUploading}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  'Start Upload'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8 text-center text-sm text-slate-500">
        Note: Large files (100,000+ rows) may take several moments to process and insert. Do not refresh the page during upload.
      </div>
    </div>
  );
};

export default TradeUpload;
