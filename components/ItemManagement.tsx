"use client";

import { useState, useEffect } from "react";
import axios from "axios";

interface Item {
  _id: string;
  name: string;
  price: number;
  stockPrice: number;
  category: string;
  damageLevel?: string;
}

export default function ItemManagement() {
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState({ 
    name: "Engine", 
    price: 0, 
    stockPrice: 0, 
    category: "Compacts",
    damageLevel: "None"
  });
  const [editingItem, setEditingItem] = useState<{
    id: string;
    price: number;
    stockPrice: number;
    category: string;
    damageLevel?: string;
  } | null>(null);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("");

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get("/api/items");
      setItems(response.data);
    } catch (_error) {
      // Handle error silently in production
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({
      ...prev,
      [name]: name === "name" || name === "category" || name === "damageLevel" ? value : Math.max(0, parseFloat(value) || 0),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/items", newItem);
      setNewItem({ name: "Engine", price: 0, stockPrice: 0, category: "Compacts", damageLevel: "None" });
      fetchItems();
      showPopup("Item added successfully!");
    } catch (_error) {
      // Handle error silently in production
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/items/${id}`);
      fetchItems();
      showPopup("Item deleted successfully!");
    } catch (_error) {
      // Handle error silently in production
    }
  };

  const confirmDelete = (id: string, name: string) => {
    setDeleteConfirmation({ id, name });
  };

  const handleEditItem = (
    id: string,
    price: number,
    stockPrice: number,
    category: string,
    damageLevel?: string
  ) => {
    setEditingItem({ id, price, stockPrice, category, damageLevel });
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditingItem((prev) =>
      prev
        ? {
            ...prev,
            [name]: name === "category" || name === "damageLevel" ? value : Math.max(0, parseFloat(value) || 0),
          }
        : null
    );
  };

  const saveItemChanges = async () => {
    if (editingItem) {
      try {
        const updateData = {
          price: Math.max(0, editingItem.price),
          stockPrice: Math.max(0, editingItem.stockPrice),
          category: editingItem.category,
          damageLevel: editingItem.damageLevel
        };
        
        await axios.put(`/api/items/${editingItem.id}`, updateData);
        setEditingItem(null);
        fetchItems();
        showPopup("Item updated successfully!");
      } catch (_error) {
        // Handle error silently in production
      }
    }
  };

  const cancelEdit = () => {
    setEditingItem(null);
  };

  const showPopup = (message: string) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(null), 3000); // Hide after 3 seconds
  };

  return (
    <div className="space-y-6">
      {popupMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black/80 border border-orange-500/20 text-orange-100 py-2 px-4 rounded-lg shadow-[0_8px_30px_rgba(251,146,60,0.1)] backdrop-blur-lg">
          {popupMessage}
        </div>
      )}

      {deleteConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="bg-black/40 backdrop-blur-lg border border-orange-500/20 p-6 rounded-xl shadow-[0_8px_30px_rgba(251,146,60,0.1)] space-y-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text">
              Are you sure you want to delete &quot;{deleteConfirmation.name}&quot;?
            </h2>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  handleDelete(deleteConfirmation.id);
                  setDeleteConfirmation(null);
                }}
                className="bg-black/40 border border-red-500/40 hover:border-red-500 text-red-400 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="bg-black/40 border border-orange-500/20 hover:border-orange-500 text-orange-400 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-black/40 backdrop-blur-lg border border-orange-500/20 p-6 rounded-xl shadow-[0_8px_30px_rgba(251,146,60,0.1)] mb-8">
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text">
          Add New Part
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-orange-200">
              Name
            </label>
            <select
              id="name"
              name="name"
              value={newItem.name}
              onChange={handleInputChange}
              className="mt-1 block w-full h-11 px-3 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
              required
            >
              <option value="Engine">Engine</option>
              <option value="Body">Body</option>
              <option value="Door">Door</option>
              <option value="Tyres">Tyres</option>
              <option value="Windows">Windows</option>
              <option value="Motor Oil">Motor Oil</option>
              <option value="Advanced Repair Kit">Advanced Repair Kit</option>
            </select>
          </div>
          {(newItem.name === "Engine" || newItem.name === "Body") && (
            <div>
              <label htmlFor="damageLevel" className="block text-sm font-medium text-orange-200">
                Damage Level
              </label>
              <select
                id="damageLevel"
                name="damageLevel"
                value={newItem.damageLevel}
                onChange={handleInputChange}
                className="mt-1 block w-full h-11 px-3 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
                required
              >
                <option value="None">None</option>
                <option value="Minor">Minor</option>
                <option value="Moderate">Moderate</option>
                <option value="Heavy">Heavy</option>
                <option value="Severe">Severe</option>
                <option value="Extreme">Extreme</option>
              </select>
            </div>
          )}
          {newItem.name !== "Motor Oil" && newItem.name !== "Advanced Repair Kit" && (
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-orange-200">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={newItem.category}
                onChange={handleInputChange}
                className="mt-1 block w-full h-11 px-3 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
                required
              >
                <option value="Compacts">Compacts</option>
                <option value="Cycles">Cycles</option>
                <option value="EDM">EDM</option>
                <option value="Emergency">Emergency</option>
                <option value="Motorcycles">Motorcycles</option>
                <option value="Muscle">Muscle</option>
                <option value="Off-Road">Off-Road</option>
                <option value="Sedans">Sedans</option>
                <option value="Service & Utility">Service & Utility</option>
                <option value="Sports">Sports</option>
                <option value="Sports Classic">Sports Classic</option>
                <option value="Super">Super</option>
                <option value="SUVs">SUVs</option>
                <option value="Trailers">Trailers</option>
                <option value="Vans">Vans</option>
              </select>
            </div>
          )}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-orange-200">
              Price
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={newItem.price}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full h-11 px-3 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
            />
          </div>
          <div>
            <label htmlFor="stockPrice" className="block text-sm font-medium text-orange-200">
              Stock Price
            </label>
            <input
              type="number"
              id="stockPrice"
              name="stockPrice"
              value={newItem.stockPrice}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
              className="mt-1 block w-full h-11 px-3 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
            />
          </div>
          <div className="col-span-2">
            <button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-white font-semibold rounded-lg hover:from-orange-500 hover:via-orange-600 hover:to-orange-500 transition-all duration-200"
            >
              Add Item
            </button>
          </div>
        </div>
      </form>

      <div className="bg-black/40 backdrop-blur-lg border border-orange-500/20 p-6 rounded-xl shadow-[0_8px_30px_rgba(251,146,60,0.1)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text">
            Parts List
          </h2>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="p-2 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
          >
            <option value="">All Categories</option>
            <option value="Compacts">Compacts</option>
            <option value="Cycles">Cycles</option>
            <option value="EDM">EDM</option>
            <option value="Emergency">Emergency</option>
            <option value="Motorcycles">Motorcycles</option>
            <option value="Muscle">Muscle</option>
            <option value="Off-Road">Off-Road</option>
            <option value="Sedans">Sedans</option>
            <option value="Service & Utility">Service & Utility</option>
            <option value="Sports">Sports</option>
            <option value="Sports Classic">Sports Classic</option>
            <option value="Super">Super</option>
            <option value="SUVs">SUVs</option>
            <option value="Trailers">Trailers</option>
            <option value="Vans">Vans</option>
          </select>
        </div>
        <div className="space-y-4">
          {items
            .filter(item => !selectedFilter || item.category === selectedFilter)
            .map((item) => (
            <div
              key={item._id}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 p-4 border border-orange-500/20 rounded-lg hover:border-orange-500/40 transition-colors duration-200"
            >
              <div className="flex flex-col">
                <span className="text-orange-100 font-medium">{item.name}</span>
                {item.name !== "Motor Oil" && item.name !== "Advanced Repair Kit" && (
                  <span className="text-orange-300/60 text-sm">
                    {capitalizeFirstLetter(item.category)}
                  </span>
                )}
                {(item.name === "Engine" || item.name === "Body") && item.damageLevel && (
                  <span className="text-orange-300/60 text-sm">
                    Damage Level: {item.damageLevel}
                  </span>
                )}
              </div>
              {editingItem?.id === item._id ? (
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="number"
                    name="price"
                    value={editingItem.price}
                    onChange={handleEditChange}
                    placeholder="Price"
                    className="w-24 rounded-lg border border-orange-500/20 bg-black/40 text-orange-100 focus:outline-none focus:border-orange-500/40"
                  />
                  <input
                    type="number"
                    name="stockPrice"
                    value={editingItem.stockPrice}
                    onChange={handleEditChange}
                    placeholder="Stock Price"
                    min="0"
                    className="w-24 rounded-lg border border-orange-500/20 bg-black/40 text-orange-100 focus:outline-none focus:border-orange-500/40"
                  />
                  {item.name !== "Motor Oil" && item.name !== "Advanced Repair Kit" && (
                    <select
                      name="category"
                      value={editingItem.category}
                      onChange={handleEditChange}
                      className="w-24 rounded-lg border border-orange-500/20 bg-black/40 text-orange-100 focus:outline-none focus:border-orange-500/40"
                    >
                      <option value="Compacts">Compacts</option>
                      <option value="Cycles">Cycles</option>
                      <option value="EDM">EDM</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Motorcycles">Motorcycles</option>
                      <option value="Muscle">Muscle</option>
                      <option value="Off-Road">Off-Road</option>
                      <option value="Sedans">Sedans</option>
                      <option value="Service & Utility">Service & Utility</option>
                      <option value="Sports">Sports</option>
                      <option value="Sports Classic">Sports Classic</option>
                      <option value="Super">Super</option>
                      <option value="SUVs">SUVs</option>
                      <option value="Trailers">Trailers</option>
                      <option value="Vans">Vans</option>
                    </select>
                  )}
                  {(item.name === "Engine" || item.name === "Body") && (
                    <select
                      name="damageLevel"
                      value={editingItem.damageLevel || "None"}
                      onChange={handleEditChange}
                      className="w-24 rounded-lg border border-orange-500/20 bg-black/40 text-orange-100 focus:outline-none focus:border-orange-500/40"
                    >
                      <option value="None">None</option>
                      <option value="Minor">Minor</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Heavy">Heavy</option>
                      <option value="Severe">Severe</option>
                      <option value="Extreme">Extreme</option>
                    </select>
                  )}
                  <button
                    onClick={saveItemChanges}
                    className="px-3 py-1 bg-black/40 border border-green-500/40 hover:border-green-500 text-green-400 rounded-lg transition-colors duration-200"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1 bg-black/40 border border-orange-500/20 hover:border-orange-500 text-orange-400 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-orange-100">
                    ${item.price.toFixed(2)}
                  </span>
                  <span className="text-orange-200/60">
                    ${item.stockPrice.toFixed(2)}
                  </span>
                  <button
                    onClick={() =>
                      handleEditItem(
                        item._id,
                        item.price,
                        item.stockPrice,
                        item.category,
                        item.damageLevel
                      )
                    }
                    className="px-3 py-1 bg-black/40 border border-orange-500/20 hover:border-orange-500 text-orange-400 rounded-lg transition-colors duration-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(item._id, item.name)}
                    className="px-3 py-1 bg-black/40 border border-red-500/40 hover:border-red-500 text-red-400 rounded-lg transition-colors duration-200"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
