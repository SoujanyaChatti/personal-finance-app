export default function TransactionList({ transactions, page, total, limit, onPageChange, onDelete }) {
  const totalPages = Math.ceil(total / limit);
  return (
    <div className="bg-white p-6 rounded shadow w-full max-w-3xl mb-6">
      <h3 className="text-xl font-bold mb-4">Transactions</h3>
      <table className="w-full mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Date</th>
            <th className="p-2">Type</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Category</th>
            <th className="p-2">Description</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr><td colSpan="6" className="text-center p-4">No transactions found.</td></tr>
          ) : (
            transactions.map(tx => (
              <tr key={tx._id} className="border-b">
                <td className="p-2">{tx.date ? new Date(tx.date).toLocaleDateString() : ''}</td>
                <td className="p-2 capitalize">{tx.type}</td>
                <td className="p-2">₹{tx.amount}</td>
                <td className="p-2">{tx.category}</td>
                <td className="p-2">{tx.description}</td>
                <td className="p-2">
                  <button onClick={() => onDelete(tx._id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="flex justify-between items-center">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
} 