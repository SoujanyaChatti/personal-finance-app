import { useState, useEffect } from 'react';
import axios from 'axios';
import UPIIntegration from '../components/UPIIntegration';

export default function Profile() {
  const [user, setUser] = useState({ name: '', email: '' });
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch user info from API (placeholder)
    axios.get(`${import.meta.env.VITE_API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => {
        setUser(res.data);
        setForm({ name: res.data.name || '', email: res.data.email || '' });
      })
      .catch(() => setMessage('Failed to load profile'));
  }, []);

  const handleEdit = () => setEdit(true);
  const handleCancel = () => {
    setEdit(false);
    setForm({ name: user.name, email: user.email });
    setMessage('');
  };
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSave = e => {
    e.preventDefault();
    // Update profile API (placeholder)
    axios.put(`${import.meta.env.VITE_API_URL}/auth/profile`, form, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => {
        setUser(res.data);
        setEdit(false);
        setMessage('Profile updated!');
      })
      .catch(() => setMessage('Failed to update profile'));
  };

  const handlePasswordChange = e => setPasswords(p => ({ ...p, [e.target.name]: e.target.value }));
  const handlePasswordReset = e => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage('New passwords do not match');
      return;
    }
    // Password reset API (placeholder)
    axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password`, passwords, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(() => setMessage('Password updated!'))
      .catch(() => setMessage('Failed to update password'));
  };

  return (
    <div className="bg-white p-6 rounded shadow w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      {message && <div className="mb-4 text-blue-600">{message}</div>}
      <form onSubmit={handleSave} className="mb-8">
        <div className="mb-4">
          <label className="block font-semibold mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            disabled={!edit}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            disabled={!edit}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        {edit ? (
          <div className="flex gap-4">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
            <button type="button" onClick={handleCancel} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
          </div>
        ) : (
          <button type="button" onClick={handleEdit} className="bg-blue-600 text-white px-4 py-2 rounded">Edit Profile</button>
        )}
      </form>
      <form onSubmit={handlePasswordReset}>
        <h3 className="font-bold mb-2">Change Password</h3>
        <div className="mb-2">
          <label className="block mb-1">Current Password</label>
          <input
            type="password"
            name="current"
            value={passwords.current}
            onChange={handlePasswordChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1">New Password</label>
          <input
            type="password"
            name="new"
            value={passwords.new}
            onChange={handlePasswordChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Confirm New Password</label>
          <input
            type="password"
            name="confirm"
            value={passwords.confirm}
            onChange={handlePasswordChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Update Password</button>
      </form>
      
      {/* UPI Integration Section */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">🔗 UPI Integration</h3>
        <UPIIntegration />
      </div>
    </div>
  );
} 