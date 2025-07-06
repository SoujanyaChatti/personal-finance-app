import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL;

export default function HistoryUpload() {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`${API_URL}/receipts/upload-history`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded shadow w-full max-w-lg mb-8">
      <h3 className="text-xl font-bold mb-4">Upload Transaction History (PDF)</h3>
      <form onSubmit={handleUpload} className="flex flex-col gap-4">
        <input type="file" accept=".pdf" onChange={handleFile} className="" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload & Import'}
        </button>
      </form>
      {error && <div className="mt-4 text-red-500">{error}</div>}
      {result && (
        <div className="mt-4">
          <h4 className="font-bold mb-2">Imported Transactions</h4>
          <div className="bg-gray-100 p-2 rounded text-sm">{result.count} transactions created.</div>
        </div>
      )}
    </div>
  );
} 