import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL;

export default function ReceiptUpload() {
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
      const res = await axios.post(`${API_URL}/receipts/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(res.data);
    } catch (err) {
      setError({
        message: err.response?.data?.error || 'Upload failed',
        details: err.response?.data?.details,
        extractedText: err.response?.data?.extractedText,
      });
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded shadow w-full max-w-lg mb-8">
      <h3 className="text-xl font-bold mb-4">Upload Receipt (Image or PDF)</h3>
      <form onSubmit={handleUpload} className="flex flex-col gap-4">
        <input type="file" accept=".jpg,.jpeg,.png,.bmp,.pdf" onChange={handleFile} className="" />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Uploading...' : 'Upload & Process'}
        </button>
      </form>
      {error && (
        <div className="mt-4 text-red-500">
          <p>{error.message}</p>
          {error.details && (
            <p>
              Details: Amount {error.details.amountExtracted ? 'found' : 'missing'}, Date{' '}
              {error.details.dateExtracted ? 'found' : 'missing'}
            </p>
          )}
          {error.extractedText && (
            <details className="mt-2">
              <summary>Extracted Text</summary>
              <pre className="bg-gray-100 p-2 text-sm">{error.extractedText}</pre>
            </details>
          )}
        </div>
      )}
      {result && (
        <div className="mt-4">
          <h4 className="font-bold mb-2">Processed Receipt</h4>
          <div className="bg-gray-100 p-2 rounded text-sm">
            Amount: ${result.extracted.amount}
            <br />
            Date: {new Date(result.extracted.date).toLocaleDateString()}
            <br />
            Category: {result.extracted.category}
          </div>
        </div>
      )}
    </div>
  );
}