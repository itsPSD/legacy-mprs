"use client";

import { useState, useEffect, useCallback } from "react";
import { getSession } from "next-auth/react"; // Import session function
import axios from "axios";
import debounce from 'lodash.debounce';

interface Item {
  _id: string;
  name: string;
  price: number;
  stockPrice: number; // Include stockPrice
  category: string;
  damageLevel?: string;
}

interface SelectedItem extends Item {
  quantity: number;
}

interface Character {
  character_id: number;
  first_name: string;
  last_name: string;
}

interface CustomerDetails {
  cid: string;
  name: string;
  characterName: string;
  discordId: string;
  vehicleName: string;    // Added
  plateNumber: string;    // Added
}

interface VehicleDetails {
  vehicleCategory: string;
  engineDamage: string;
  bodyDamage: string;
  numberOfDoors: number;
  numberOfWindows: number;
  numberOfTyres: number;
  motorOil: boolean;
  numberOfRepairKits: number;
  discount: number;
}

export default function SalesForm() {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [totalBill, setTotalBill] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0); // Total profit calculation
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    cid: "",
    name: "",
    characterName: "",
    discordId: "",
    vehicleName: "",    // Added
    plateNumber: ""     // Added
  });
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails>({
    vehicleCategory: "Compacts",
    engineDamage: "",
    bodyDamage: "",
    numberOfDoors: 0,
    numberOfWindows: 0,
    numberOfTyres: 0,
    motorOil: false,
    numberOfRepairKits: 0,
    discount: 0
  });
  const [popupMessage, setPopupMessage] = useState<string | null>(null); // Popup message for alerts
  const [vehicleSuggestions, setVehicleSuggestions] = useState<any[]>([]);
  const [showVehicleSuggestions, setShowVehicleSuggestions] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vehicleData, setVehicleData] = useState<any[]>([]);

  const CACHE_KEY = "characterData";
  const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
  const VEHICLE_CACHE_KEY = "vehicleData";
  const VEHICLE_CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

  const fetchAndCacheCharacters = async () => {
    try {
      const response = await fetch("/api/characters");
      const data = await response.json();
      
      const cacheData = {
        timestamp: Date.now(),
        data: data.responsive
      };
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      return data.responsive;
    } catch (_error) {
      return null;
    }
  };

  const getCharacterData = async () => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      
      if (cachedData) {
        const { timestamp, data } = JSON.parse(cachedData);
        const isExpired = Date.now() - timestamp > CACHE_DURATION;
        
        if (!isExpired) {
          return data;
        }
      }
      
      return await fetchAndCacheCharacters();
    } catch (_error) {
      return await fetchAndCacheCharacters();
    }
  };

  const fetchCharacterName = async () => {
    try {
      const characters = await getCharacterData();
      
      if (!characters) {
        setCustomerDetails(prev => ({ ...prev, name: "" }));
        return;
      }

      const character = characters.find((char: Character) => 
        char.character_id === parseInt(customerDetails.cid)
      );
      
      if (character) {
        const fullName = `${character.first_name} ${character.last_name}`;
        setCustomerDetails(prev => ({ ...prev, name: fullName }));
      } else {
        setCustomerDetails(prev => ({ ...prev, name: "" }));
      }
    } catch (_error) {
      setCustomerDetails(prev => ({ ...prev, name: "" }));
    }
  };

  useEffect(() => {
    if (customerDetails.cid.trim() === "") {
      setCustomerDetails(prev => ({ ...prev, name: "" }));
    } else {
      fetchCharacterName();
    }
  }, [customerDetails.cid]);

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  useEffect(() => {
    fetchItems();
    fetchUserDetails();
  }, []);

  useEffect(() => {
    const total = selectedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const profit = selectedItems.reduce(
      (sum, item) =>
        sum + (item.price - item.stockPrice) * item.quantity,
      0
    );
    setTotalBill(total);
    setTotalProfit(profit);
  }, [selectedItems]);

  const fetchItems = async () => {
    try {
      const response = await axios.get("/api/items");
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error); // eslint-disable-line no-console
    }
  };

  const fetchUserDetails = async () => {
    try {
      const session = await getSession(); // Fetch session details
      if (session) {
        const { user } = session;
        setCustomerDetails(prev => ({ ...prev, characterName: user.characterName || "", discordId: user.discordId || "" }));
      }
    } catch (error) {
      console.error("Error fetching user details:", error); // eslint-disable-line no-console
    }
  };

  const fetchAndCacheVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      if (!response.ok) throw new Error('Failed to fetch vehicle data');
      const data = await response.json();
      
      localStorage.setItem(
        VEHICLE_CACHE_KEY,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
      
      setVehicleData(data);
      return data;
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      return [];
    }
  };

  const searchVehicles = (search: string) => {
    if (!search) {
      setVehicleSuggestions([]);
      setShowVehicleSuggestions(false);
      return;
    }

    const filteredData = vehicleData.filter((vehicle: any) =>
      vehicle.name.toLowerCase().includes(search.toLowerCase())
    );
    setVehicleSuggestions(filteredData);
    setShowVehicleSuggestions(true);
  };

  const debouncedVehicleSearch = useCallback(
    debounce((search: string) => {
      if (search.length >= 2) {
        searchVehicles(search);
      } else {
        setVehicleSuggestions([]);
        setShowVehicleSuggestions(false);
      }
    }, 300),
    [vehicleData] // Add vehicleData as dependency
  );

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setCustomerDetails(prev => ({
      ...prev,
      vehicleName: vehicle.name
    }));
    setVehicleDetails(prev => ({
      ...prev,
      vehicleCategory: vehicle.category
    }));
    setShowVehicleSuggestions(false);
    
    // Save to recent vehicles
    const savedVehicles = JSON.parse(localStorage.getItem('recentVehicles') || '[]');
    const updatedVehicles = [vehicle, ...savedVehicles.filter((v: any) => v.name !== vehicle.name)].slice(0, 5);
    localStorage.setItem('recentVehicles', JSON.stringify(updatedVehicles));
  };

  useEffect(() => {
    const loadVehicleData = async () => {
      const cachedData = localStorage.getItem(VEHICLE_CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < VEHICLE_CACHE_DURATION) {
          setVehicleData(data);
        } else {
          // Cache expired, fetch fresh data
          await fetchAndCacheVehicles();
        }
      } else {
        // No cache, fetch fresh data
        await fetchAndCacheVehicles();
      }
    };

    loadVehicleData();

    // Set up refresh interval
    const refreshInterval = setInterval(fetchAndCacheVehicles, VEHICLE_CACHE_DURATION);

    return () => clearInterval(refreshInterval);
  }, []);

  const calculatePrice = async () => {
    let totalPrice = 0;
    const category = vehicleDetails.vehicleCategory;

    // Fetch Engine price if there's engine damage
    if (vehicleDetails.engineDamage) {
      const engineItem = items.find(
        item => item.name === "Engine" && 
        item.category === category && 
        item.damageLevel === vehicleDetails.engineDamage
      );
      if (engineItem) {
        totalPrice += engineItem.price;
      }
    }

    // Fetch Body price if there's body damage
    if (vehicleDetails.bodyDamage) {
      const bodyItem = items.find(
        item => item.name === "Body" && 
        item.category === category && 
        item.damageLevel === vehicleDetails.bodyDamage
      );
      if (bodyItem) {
        totalPrice += bodyItem.price;
      }
    }

    // Calculate Door price based on number of doors
    if (vehicleDetails.numberOfDoors > 0) {
      const doorItem = items.find(
        item => item.name === "Door" && 
        item.category === category
      );
      if (doorItem) {
        totalPrice += doorItem.price * vehicleDetails.numberOfDoors;
      }
    }

    // Calculate Windows price based on number of windows
    if (vehicleDetails.numberOfWindows > 0) {
      const windowItem = items.find(
        item => item.name === "Windows" && 
        item.category === category
      );
      if (windowItem) {
        totalPrice += windowItem.price * vehicleDetails.numberOfWindows;
      }
    }

    // Calculate Tyres price based on number of tyres
    if (vehicleDetails.numberOfTyres > 0) {
      const tyreItem = items.find(
        item => item.name === "Tyres" && 
        item.category === category
      );
      if (tyreItem) {
        totalPrice += tyreItem.price * vehicleDetails.numberOfTyres;
      }
    }

    // Add Motor Oil price if selected
    if (vehicleDetails.motorOil) {
      const oilItem = items.find(item => item.name === "Motor Oil");
      if (oilItem) {
        totalPrice += oilItem.price;
      }
    }

    // Add Advanced Repair Kit price if selected
    if (vehicleDetails.numberOfRepairKits > 0) {
      const kitItem = items.find(item => item.name === "Advanced Repair Kit");
      if (kitItem) {
        totalPrice += kitItem.price * vehicleDetails.numberOfRepairKits;
      }
    }

    // Apply discount if any
    if (vehicleDetails.discount > 0) {
      totalPrice = totalPrice * (1 - vehicleDetails.discount / 100);
    }

    return totalPrice;
  };

  const handleAddItem = async () => {
    const category = vehicleDetails.vehicleCategory;
    const newItems: SelectedItem[] = [];

    // Helper function to find item and its prices
    const findItemPrices = (itemName: string, damageLevel?: string) => {
      const item = items.find(
        item => item.name === itemName && 
        (!item.category || item.category === category) &&
        (!damageLevel || item.damageLevel === damageLevel)
      );
      return item ? { price: item.price, stockPrice: item.stockPrice } : null;
    };

    // Add Engine if damaged
    if (vehicleDetails.engineDamage && vehicleDetails.engineDamage !== "None") {
      const prices = findItemPrices("Engine", vehicleDetails.engineDamage);
      if (prices) {
        newItems.push({
          _id: `${Date.now()}_engine`,
          name: `Engine (${vehicleDetails.engineDamage})`,
          price: prices.price,
          stockPrice: prices.stockPrice,
          category: category,
          quantity: 1
        });
      }
    }

    // Add Body if damaged
    if (vehicleDetails.bodyDamage && vehicleDetails.bodyDamage !== "None") {
      const prices = findItemPrices("Body", vehicleDetails.bodyDamage);
      if (prices) {
        newItems.push({
          _id: `${Date.now()}_body`,
          name: `Body (${vehicleDetails.bodyDamage})`,
          price: prices.price,
          stockPrice: prices.stockPrice,
          category: category,
          quantity: 1
        });
      }
    }

    // Add doors if needed
    if (vehicleDetails.numberOfDoors > 0) {
      const prices = findItemPrices("Door");
      if (prices) {
        newItems.push({
          _id: `${Date.now()}_door`,
          name: "Door",
          price: prices.price,
          stockPrice: prices.stockPrice,
          category: category,
          quantity: vehicleDetails.numberOfDoors
        });
      }
    }

    // Add windows if needed
    if (vehicleDetails.numberOfWindows > 0) {
      const prices = findItemPrices("Windows");
      if (prices) {
        newItems.push({
          _id: `${Date.now()}_window`,
          name: "Windows",
          price: prices.price,
          stockPrice: prices.stockPrice,
          category: category,
          quantity: vehicleDetails.numberOfWindows
        });
      }
    }

    // Add tyres if needed
    if (vehicleDetails.numberOfTyres > 0) {
      const prices = findItemPrices("Tyres");
      if (prices) {
        newItems.push({
          _id: `${Date.now()}_tyre`,
          name: "Tyres",
          price: prices.price,
          stockPrice: prices.stockPrice,
          category: category,
          quantity: vehicleDetails.numberOfTyres
        });
      }
    }

    // Add Motor Oil if selected
    if (vehicleDetails.motorOil) {
      const prices = findItemPrices("Motor Oil");
      if (prices) {
        newItems.push({
          _id: `${Date.now()}_oil`,
          name: "Motor Oil",
          price: prices.price,
          stockPrice: prices.stockPrice,
          category: category,
          quantity: 1
        });
      }
    }

    // Add Advanced Repair Kit if selected
    if (vehicleDetails.numberOfRepairKits > 0) {
      const prices = findItemPrices("Advanced Repair Kit");
      if (prices) {
        newItems.push({
          _id: `${Date.now()}_kit`,
          name: "Advanced Repair Kit",
          price: prices.price,
          stockPrice: prices.stockPrice,
          category: category,
          quantity: vehicleDetails.numberOfRepairKits
        });
      }
    }

    // Apply discount if any
    if (vehicleDetails.discount > 0) {
      newItems.forEach(item => {
        item.price = item.price * (1 - vehicleDetails.discount / 100);
      });
    }

    // Add all new items to the bill
    setSelectedItems(prev => [...prev, ...newItems]);
    
    // Reset vehicle details form
    setVehicleDetails({
      vehicleCategory: "Compacts",
      engineDamage: "",
      bodyDamage: "",
      numberOfDoors: 0,
      numberOfWindows: 0,
      numberOfTyres: 0,
      motorOil: false,
      numberOfRepairKits: 0,
      discount: 0
    });

    setPopupMessage("Vehicle repair details added successfully!");
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item._id !== id));
  };

  const handleCopyReceipt = () => {
    const session = getSession();
    const receipt = `Mirror Park Repair Shop Receipt
------------------------
Customer: ${customerDetails.name} (${customerDetails.cid})
Repaired by: ${customerDetails.characterName || 'Unknown Mechanic'}
Total Bill: $${totalBill.toFixed(2)}
------------------------
Thank you for choosing MPRS!`;

    navigator.clipboard.writeText(receipt).then(() => {
      setPopupMessage("Receipt copied to clipboard!");
      setTimeout(() => setPopupMessage(null), 3000);
    }).catch(err => {
      console.error('Failed to copy receipt:', err);
      setPopupMessage("Failed to copy receipt");
      setTimeout(() => setPopupMessage(null), 3000);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate mandatory fields
    if (!customerDetails.cid || !customerDetails.name) {
      setPopupMessage("Please enter a valid Customer ID");
      return;
    }

    // Validate Vehicle Name and Plate Number
    if (!customerDetails.vehicleName || !customerDetails.plateNumber) {
      setPopupMessage("Vehicle Name and Plate Number are mandatory");
      return;
    }

    // Enforce uppercase plate number
    const uppercasePlateNumber = customerDetails.plateNumber.toUpperCase();
    const validPlateNumber = /^[A-Z0-9]+$/.test(uppercasePlateNumber);

    if (!validPlateNumber) {
      setPopupMessage("Plate Number must contain only uppercase letters and numbers");
      return;
    }

    // Update customerDetails with uppercase plate number
    setCustomerDetails(prev => ({
      ...prev,
      plateNumber: uppercasePlateNumber
    }));

    try {
      const session = await getSession();
      if (!session?.user) {
        setPopupMessage("User session not found");
        return;
      }

      // Format items for Discord message
      const formattedRepairs: string[] = [];
      const formattedItems: string[] = [];

      // Process selected items into appropriate categories
      selectedItems.forEach(item => {
        const itemPrice = (item.price * item.quantity).toFixed(2);
        
        if (item.name.includes('Engine')) {
          formattedRepairs.push(`- Engine: ${item.name.split('(')[1].replace(')', '')} ($${itemPrice})`);
        }
        else if (item.name.includes('Body')) {
          formattedRepairs.push(`- Body: ${item.name.split('(')[1].replace(')', '')} ($${itemPrice})`);
        }
        else if (item.name === 'Door') {
          formattedRepairs.push(`- Doors: ${item.quantity} ($${itemPrice})`);
        }
        else if (item.name === 'Windows') {
          formattedRepairs.push(`- Windows: ${item.quantity} ($${itemPrice})`);
        }
        else if (item.name === 'Tyres') {
          formattedRepairs.push(`- Tyres: ${item.quantity} ($${itemPrice})`);
        }
        else if (item.name === 'Motor Oil') {
          formattedRepairs.push(`- Motor Oil: Yes ($${itemPrice})`);
        }
        else if (item.name === 'Advanced Repair Kit') {
          formattedItems.push(`- ${item.name}: ${item.quantity} ($${itemPrice})`);
        }
      });

      // Create Discord message
      const discordMessage = [
        `**Customer Name:** ${customerDetails.name}`,
        `**Customer ID:** ${customerDetails.cid}`,
        `**Vehicle Name:** ${customerDetails.vehicleName}`,
        `**Plate Number:** ${customerDetails.plateNumber}`,
        `**Total Cost:** $${totalBill.toFixed(2)}`,
        `**Profit:** $${totalProfit.toFixed(2)}`,
        formattedRepairs.length > 0 ? `**Repairs Done:**\n${formattedRepairs.join('\n')}` : null,
        formattedItems.length > 0 ? `**Items:**\n${formattedItems.join('\n')}` : null,
        `**Repaired By:** <@${session.user.discordId}>`
      ].filter(Boolean).join('\n');

      console.log('Debug - Selected Items:', selectedItems);
      console.log('Debug - Formatted Repairs:', formattedRepairs);
      console.log('Debug - Discord Message:', discordMessage);

      // Send to Discord webhook
      await axios.post("/api/discord-webhook", {
        content: discordMessage
      });

      // Save the sale
      const response = await axios.post("/api/sales", {
        customerDetails: {
          ...customerDetails,
          plateNumber: uppercasePlateNumber
        },
        vehicleDetails,
        items: selectedItems,
        totalSales: totalBill,
        totalProfit,
        time: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString()
      });

      // Reset form after successful submission
      setSelectedItems([]);
      setCustomerDetails({
        cid: "",
        name: "",
        characterName: "",
        discordId: "",
        vehicleName: "",
        plateNumber: ""
      });
      setVehicleDetails({
        vehicleCategory: "Compacts",
        engineDamage: "",
        bodyDamage: "",
        numberOfDoors: 0,
        numberOfWindows: 0,
        numberOfTyres: 0,
        motorOil: false,
        numberOfRepairKits: 0,
        discount: 0
      });

      setPopupMessage("Sale recorded successfully!");
    } catch (error) {
      console.error("Error submitting sale:", error); // eslint-disable-line no-console
      setPopupMessage("Error submitting sale. Please try again.");
    }
  };

  const showPopup = (message: string) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(null), 3000); // Hide after 3 seconds
  };

  // Add damage level options constant
  const DAMAGE_LEVELS = ["None", "Minor", "Moderate", "Heavy", "Severe", "Extreme"];

  return (
    <div className="space-y-6">
      {popupMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black/80 border border-orange-500/20 text-orange-100 py-2 px-4 rounded-lg shadow-[0_8px_30px_rgba(251,146,60,0.1)] backdrop-blur-lg">
          {popupMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-orange-100">
        {/* Customer Information Section */}
        <div className="bg-black/40 backdrop-blur-lg border border-orange-500/20 p-6 rounded-xl shadow-[0_8px_30px_rgba(251,146,60,0.1)]">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text">
            Customer Information
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="cid" className="block text-sm font-medium text-orange-200">
                CID
              </label>
              <input
                type="number"
                id="cid"
                value={customerDetails.cid}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, cid: e.target.value }))}
                className="mt-1 block w-full h-11 px-3 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
                min="0"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-orange-200">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full h-11 px-3 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
              />
            </div>

            <div className="relative">
              <label htmlFor="vehicleName" className="block text-sm font-medium text-orange-200">
                Vehicle Name
              </label>
              <input
                type="text"
                name="vehicleName"
                id="vehicleName"
                value={customerDetails.vehicleName || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setCustomerDetails(prev => ({ ...prev, vehicleName: newValue }));
                  if (!newValue) {
                    setVehicleDetails(prev => ({ ...prev, vehicleCategory: '' }));
                    setSelectedVehicle(null);
                    setShowVehicleSuggestions(false);
                  } else if (selectedVehicle?.name !== newValue) {
                    // Only search if the value doesn't match selected vehicle
                    debouncedVehicleSearch(newValue);
                  }
                }}
                onFocus={(e) => {
                  if (e.target.value.length >= 2) {
                    debouncedVehicleSearch(e.target.value);
                  }
                }}
                placeholder="Vehicle Name"
                className="mt-1 block w-full h-11 px-3 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
                required
              />
              {showVehicleSuggestions && vehicleSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 rounded-lg shadow-lg bg-zinc-900/95 border border-orange-500/20 max-h-60 overflow-auto">
                  {vehicleSuggestions.map((vehicle, index) => (
                    <div
                      key={index}
                      onClick={() => handleVehicleSelect(vehicle)}
                      className="px-4 py-2 cursor-pointer hover:bg-orange-500/10 text-orange-100 transition-colors duration-200"
                    >
                      {vehicle.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="plateNumber" className="block text-sm font-medium text-orange-200">
                Plate Number
              </label>
              <input
                type="text"
                id="plateNumber"
                value={customerDetails.plateNumber}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, plateNumber: e.target.value.toUpperCase() }))}
                className="mt-1 block w-full h-11 px-3 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
                required
              />
            </div>
          </div>
        </div>

        {/* Vehicle Details Section */}
        <div className="bg-black/40 backdrop-blur-lg border border-orange-500/20 p-6 rounded-xl shadow-[0_8px_30px_rgba(251,146,60,0.1)]">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text">
            Vehicle Details
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="vehicleCategory" className="block text-sm font-medium text-orange-200">
                Vehicle Category
              </label>
              <input
                type="text"
                id="vehicleCategory"
                value={vehicleDetails.vehicleCategory || ''}
                className="mt-1 block w-full h-11 px-3 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
                readOnly
                required
              />
            </div>
            <div>
              <label htmlFor="engineDamage" className="block text-sm font-medium text-orange-200">
                Engine Damage
              </label>
              <select
                id="engineDamage"
                value={vehicleDetails.engineDamage}
                onChange={(e) => setVehicleDetails(prev => ({ ...prev, engineDamage: e.target.value }))}
                className="mt-1 block w-full h-11 px-3 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
              >
                <option value="">Select Damage Level</option>
                {DAMAGE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="bodyDamage" className="block text-sm font-medium text-orange-200">
                Body Damage
              </label>
              <select
                id="bodyDamage"
                value={vehicleDetails.bodyDamage}
                onChange={(e) => setVehicleDetails(prev => ({ ...prev, bodyDamage: e.target.value }))}
                className="mt-1 block w-full h-11 px-3 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
              >
                <option value="">Select Damage Level</option>
                {DAMAGE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="numberOfDoors" className="block text-sm font-medium text-orange-200">
                Number of Doors
              </label>
              <input
                type="number"
                id="numberOfDoors"
                value={vehicleDetails.numberOfDoors}
                onChange={(e) => setVehicleDetails(prev => ({ ...prev, numberOfDoors: parseInt(e.target.value) || 0 }))}
                className="mt-1 block w-full h-11 px-3 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
                required
                min="0"
              />
            </div>
            <div>
              <label htmlFor="numberOfWindows" className="block text-sm font-medium text-orange-200">
                Number of Windows
              </label>
              <input
                type="number"
                id="numberOfWindows"
                value={vehicleDetails.numberOfWindows}
                onChange={(e) => setVehicleDetails(prev => ({ ...prev, numberOfWindows: parseInt(e.target.value) || 0 }))}
                className="mt-1 block w-full h-11 px-3 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
                required
                min="0"
              />
            </div>
            <div>
              <label htmlFor="numberOfTyres" className="block text-sm font-medium text-orange-200">
                Number of Tyres
              </label>
              <input
                type="number"
                id="numberOfTyres"
                value={vehicleDetails.numberOfTyres}
                onChange={(e) => setVehicleDetails(prev => ({ ...prev, numberOfTyres: parseInt(e.target.value) || 0 }))}
                className="mt-1 block w-full h-11 px-3 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
                required
                min="0"
              />
            </div>
            <div>
              <label htmlFor="motorOil" className="block text-sm font-medium text-orange-200">
                Motor Oil
              </label>
              <select
                id="motorOil"
                value={vehicleDetails.motorOil.toString()}
                onChange={(e) => setVehicleDetails(prev => ({ ...prev, motorOil: e.target.value === "true" }))}
                className="mt-1 block w-full h-11 px-3 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
                required
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label htmlFor="numberOfRepairKits" className="block text-sm font-medium text-orange-200">
                Advanced Repair Kits
              </label>
              <input
                type="number"
                id="numberOfRepairKits"
                value={vehicleDetails.numberOfRepairKits}
                onChange={(e) => setVehicleDetails(prev => ({ 
                  ...prev, 
                  numberOfRepairKits: Math.max(0, parseInt(e.target.value) || 0)
                }))}
                min="0"
                className="mt-1 block w-full h-11 px-3 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
              />
            </div>
            <div>
              <label htmlFor="discount" className="block text-sm font-medium text-orange-200">
                Discount (%)
              </label>
              <input
                type="number"
                id="discount"
                value={vehicleDetails.discount}
                onChange={(e) => setVehicleDetails(prev => ({ ...prev, discount: parseInt(e.target.value) || 0 }))}
                className="mt-1 block w-full h-11 px-3 rounded-lg border border-orange-500/20 bg-black text-orange-100 focus:outline-none focus:border-orange-500/40 transition-colors duration-200"
                required
                min="0"
                max="100"
              />
            </div>
          </div>
          <div className="col-span-2 flex justify-end mt-4">
            <button
              type="button"
              onClick={handleAddItem}
              className="whitespace-nowrap bg-black/40 border border-orange-500/20 hover:border-orange-500 text-orange-400 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Add to Bill
            </button>
          </div>
        </div>

        {selectedItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full mb-6 text-orange-100">
              <thead>
                <tr className="bg-black/60">
                  <th className="px-4 py-2 text-white text-left font-medium uppercase tracking-wider border-b border-orange-500/20">Item</th>
                  <th className="px-4 py-2 text-white text-left font-medium uppercase tracking-wider border-b border-orange-500/20">Price</th>
                  <th className="px-4 py-2 text-white text-left font-medium uppercase tracking-wider border-b border-orange-500/20">Quantity</th>
                  <th className="px-4 py-2 text-white text-left font-medium uppercase tracking-wider border-b border-orange-500/20">Total</th>
                  <th className="px-4 py-2 text-white text-left font-medium uppercase tracking-wider border-b border-orange-500/20">Profit</th>
                  <th className="px-4 py-2 text-white text-left font-medium uppercase tracking-wider border-b border-orange-500/20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-500/20">
                {selectedItems.map((item) => (
                  <tr key={item._id} className="hover:bg-orange-500/5 transition-colors duration-150">
                    <td className="text-gray-300 px-4 py-2">
                      <div>
                        <div className="text-gray-300">{item.name}</div>
                      </div>
                    </td>
                    <td className="text-gray-300 px-4 py-2">${item.price.toFixed(2)}</td>
                    <td className="text-gray-300 px-4 py-2">{item.quantity}</td>
                    <td className="text-gray-300 px-4 py-2">${(item.price * item.quantity).toFixed(2)}</td>
                    <td className="text-gray-300 px-4 py-2">${((item.price - item.stockPrice) * item.quantity).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        className="bg-black/40 border border-red-500/40 hover:border-red-500 text-red-400 py-1 px-3 rounded-lg transition-colors duration-200"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-orange-200/80 mb-6">No items added to the bill yet.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-black/60 backdrop-blur-sm border border-orange-500/20 p-4 rounded-lg">
            <p className="text-orange-200/80">Total Bill</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text">
              ${totalBill.toFixed(2)}
            </p>
          </div>
          <div className="bg-black/60 backdrop-blur-sm border border-orange-500/20 p-4 rounded-lg">
            <p className="text-orange-200/80">Total Profit</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text">
              ${totalProfit.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex-1 bg-black/40 border border-orange-500/20 hover:border-orange-500 text-orange-400 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedItems.length === 0}
          >
            Submit Sale
          </button>
          <button
            type="button"
            onClick={handleCopyReceipt}
            className="flex-1 bg-black/40 border border-orange-500/20 hover:border-orange-500 text-orange-400 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Copy Receipt
          </button>
        </div>
      </form>
    </div>
  );
}
