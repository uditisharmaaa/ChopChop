import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Fridge() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const [newExpiryForEdit, setNewExpiryForEdit] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error("Error getting user:", error);
      else setUser(data.user);
      setLoading(false);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) fetchItems();
  }, [user]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('fridge')
      .select('id, item_name, expires_on')
      .eq('user_id', user.id)
      .order('expires_on', { ascending: true });

    if (error) console.error('Error fetching items:', error);
    else setItems(data);
  };

  const handleAddItem = async () => {
    if (!newItem || !expiryDate) return alert("Fill both fields!");
    const { error } = await supabase.from('fridge').insert([
      {
        user_id: user.id,
        item_name: newItem,
        added_on: new Date().toISOString(),
        expires_on: new Date(expiryDate).toISOString(),
      },
    ]);
    if (error) console.error('Insert error:', error);
    else {
      setNewItem('');
      setExpiryDate('');
      fetchItems();
    }
  };

  const handleDeleteItem = async (itemId) => {
    const { error } = await supabase.from('fridge').delete().eq('id', itemId);
    if (error) console.error('Delete error:', error);
    else fetchItems();
  };

  const handleClearExpired = async () => {
    const today = new Date().toISOString();
    const { error } = await supabase
      .from('fridge')
      .delete()
      .eq('user_id', user.id)
      .lte('expires_on', today);
    if (error) console.error('Error clearing expired:', error);
    else fetchItems();
  };

  const handleEditClick = (itemId, currentExpiry) => {
    setEditingItemId(itemId);
    setNewExpiryForEdit(currentExpiry ? currentExpiry.split('T')[0] : '');
  };

  const handleSaveEdit = async () => {
    if (!newExpiryForEdit) return alert("Please select a new date.");
    const { error } = await supabase
      .from('fridge')
      .update({ expires_on: new Date(newExpiryForEdit).toISOString() })
      .eq('id', editingItemId);
    if (error) console.error('Update error:', error);
    else {
      setEditingItemId(null);
      setNewExpiryForEdit('');
      fetchItems();
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "No expiry set";
    const parsed = new Date(dateStr);
    return isNaN(parsed) ? "Invalid Date" : parsed.toLocaleDateString();
  };

  const daysLeft = (dateStr) => {
    if (!dateStr) return null;
    const expiry = new Date(dateStr);
    const today = new Date();
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getColorClass = (days) => {
    if (days === null) return "bg-gray-200 text-gray-800";
    if (days < 0) return "bg-red-200 text-red-800";
    if (days <= 2) return "bg-red-100 text-red-800";
    if (days <= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const filteredItems = items.filter((item) =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-4">

      {/* Search and Clear */}
      <div className="flex flex-col md:flex-row md:space-x-4 mb-6">
        <input
          type="text"
          placeholder="Search items..."
          className="border p-2 rounded mb-2 md:mb-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          onClick={handleClearExpired}
        >
          Clear Expired Items
        </button>
      </div>

      {/* Fridge Items */}
      {filteredItems.length === 0 ? (
        <p className="text-gray-600">No items found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const days = daysLeft(item.expires_on);
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl shadow hover:scale-105 transition-transform ${getColorClass(days)}`}
              >
                <h3 className="text-lg font-bold">{item.item_name}</h3>
                <p className="text-sm">
                  Expires on: <span className="font-medium">{formatDate(item.expires_on)}</span>
                </p>
                {days !== null && (
                  <p className="text-sm">
                    {days >= 0 ? `${days} day${days === 1 ? "" : "s"} left` : "Expired"}
                  </p>
                )}

                {/* Edit Mode */}
                {editingItemId === item.id ? (
                  <>
                    <input
                      type="date"
                      className="border p-1 rounded mt-2 w-full text-sm"
                      value={newExpiryForEdit}
                      onChange={(e) => setNewExpiryForEdit(e.target.value)}
                    />
                    <button
                      className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                      onClick={handleSaveEdit}
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <button
                    className="mt-2 text-sm text-blue-600 hover:underline"
                    onClick={() => handleEditClick(item.id, item.expires_on)}
                  >
                    ✏️ Edit  
                  </button>
                )}

                {/* Delete */}
                <button
                  className="mt-1 text-sm text-red-600 hover:underline"
                  onClick={() => handleDeleteItem(item.id)}
                >
                    🗑️ Delete
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Item Form */}
      <div className="mt-8 p-4 bg-green-50 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-2 text-emerald-700">Add New Item</h3>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <input
            className="border p-2 rounded flex-1"
            type="text"
            placeholder="e.g. tofu"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
          <input
            className="border p-2 rounded"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
          <button
            className="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={handleAddItem}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
