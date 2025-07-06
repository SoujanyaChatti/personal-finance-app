import CategoryManager from '../components/CategoryManager';

export default function Settings() {
  return (
    <div className="bg-white p-6 rounded shadow w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Settings & Category Management</h2>
      <CategoryManager />
    </div>
  );
} 