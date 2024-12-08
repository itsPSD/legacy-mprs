"use client";

import { useState, useEffect } from "react";
import axios from "axios";

type SalesLog = {
  _id: string;
  date: string;
  time: string;
  soldBy: string;
  customerName: string;
  customerId: string;
  vehicleName: string;
  plateNumber: string;
  vehicleCategory: string;
  items: Array<{
    name: string;
    category: string;
    quantity: number;
    price: number;
    damageLevel: string | null;
    totalPrice: number;
  }>;
  totalSales: number;
  totalProfit: number;
  discount: number;
};

type TimeLog = {
  _id: string;
  UserID: string;
  TotalTime: number; // Total time in seconds
  createdAt: string;
  updatedAt: string;
};

export default function YourSalesLogs() {
  const [loggedInUserLogs, setLoggedInUserLogs] = useState<SalesLog[]>([]);
  const [characterName, setCharacterName] = useState<string>(""); // Logged-in user's character name
  const [totalSalesCount, setTotalSalesCount] = useState<number>(0); // Total sales count
  const [totalDutyTime, setTotalDutyTime] = useState<number>(0); // Total duty time in seconds
  const [currentPage, setCurrentPage] = useState<number>(1); // Current page
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<SalesLog | null>(null);
  const logsPerPage = 10; // Logs per page

  useEffect(() => {
    // Fetch the logged-in user's details, including their character name
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get("/api/auth/session");
        const name = response.data?.user?.characterName || "User";
        const discordId = response.data?.user?.discordId;
        setCharacterName(name);

        // Fetch the user's total duty time
        const timeResponse = await axios.get("/api/time");
        const timeLogs: TimeLog[] = timeResponse.data;

        const userTimeLog = timeLogs.find((log) => log.UserID === discordId);
        if (userTimeLog) {
          setTotalDutyTime(userTimeLog.TotalTime);
        }
      } catch (_error) {
        // Handle error silently in production
      }
    };

    fetchUserDetails();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/sales/chart");
        const { salesLogs }: { salesLogs: SalesLog[] } = response.data;

        // Filter logs for the logged-in employee by characterName
        if (characterName) {
          const userLogs = salesLogs
            .filter((log) => log.soldBy.trim().toLowerCase() === characterName.trim().toLowerCase())
            .sort((a, b) => {
              // Parse date in DD/MM/YYYY format
              const [dayA, monthA, yearA] = a.date.split("/").map(Number);
              const [dayB, monthB, yearB] = b.date.split("/").map(Number);
              const [hoursA, minutesA] = a.time.split(":").map(Number);
              const [hoursB, minutesB] = b.time.split(":").map(Number);
              
              const dateTimeA = new Date(yearA, monthA - 1, dayA, hoursA, minutesA);
              const dateTimeB = new Date(yearB, monthB - 1, dayB, hoursB, minutesB);
              
              // Sort in descending order (newest first)
              return dateTimeB.getTime() - dateTimeA.getTime();
            });
          setLoggedInUserLogs(userLogs);
          setTotalSalesCount(userLogs.length); // Set total sales count
        }
      } catch (_error) {
        // Handle error silently in production
      }
    };

    fetchData();
  }, [characterName]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  const totalPages = Math.ceil(totalSalesCount / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const currentLogs = loggedInUserLogs.slice(startIndex, startIndex + logsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  const totalIncome = loggedInUserLogs.reduce((sum, log) => sum + (log.totalSales || 0), 0);
  const totalProfit = loggedInUserLogs.reduce((sum, log) => sum + (log.totalProfit || 0), 0);

  return (
    <div className="space-y-6">
      {/* Greeting Section */}
      <div className="bg-black/40 backdrop-blur-lg border border-orange-500/20 p-6 rounded-xl shadow-[0_8px_30px_rgba(251,146,60,0.1)]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text">
              Hello, {characterName}
            </h1>
            <p className="text-orange-200/80 mt-1">Here's an overview of your repairs</p>
            {(() => {
              // Calculate current week's repairs (starting from Monday)
              const today = new Date();
              const startOfWeek = new Date(today);
              // Adjust to Monday (0 = Sunday, 1 = Monday)
              startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));
              startOfWeek.setHours(0, 0, 0, 0);

              const currentWeekRepairs = loggedInUserLogs.filter(log => {
                // Parse the log's date
                const [day, month, year] = log.date.split("/").map(Number);
                const logDate = new Date(year, month - 1, day);
                
                return logDate >= startOfWeek && logDate <= today;
              });

              return (
                <p className="text-orange-200/80 mt-1">
                  Repairs this Week: <span className="text-orange-400 font-bold">{currentWeekRepairs.length}</span>
                </p>
              );
            })()}
          </div>
          <div className="text-orange-200/80">
            Current Duty Time: <span className="text-orange-400">{formatTime(totalDutyTime)}</span>
          </div>
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-lg border border-orange-500/20 p-6 rounded-xl shadow-[0_8px_30px_rgba(251,146,60,0.1)]">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text">
          Your Repair Logs
        </h2>
        <p className="text-orange-200/80 mb-4">Total Repairs: {totalSalesCount}</p>

        {currentLogs.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse border border-orange-500/20">
                <thead>
                  <tr className="bg-black/60">
                    <th className="border border-orange-500/20 px-4 py-2 text-orange-100">Date</th>
                    <th className="border border-orange-500/20 px-4 py-2 text-orange-100">Time</th>
                    <th className="border border-orange-500/20 px-4 py-2 text-orange-100">Customer</th>
                    <th className="border border-orange-500/20 px-4 py-2 text-orange-100">Vehicle</th>
                    <th className="border border-orange-500/20 px-4 py-2 text-orange-100">Total Cost</th>
                    <th className="border border-orange-500/20 px-4 py-2 text-orange-100">Total Profit</th>
                    <th className="border border-orange-500/20 px-4 py-2 text-orange-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-500/20">
                  {currentLogs.map((log, index) => (
                    <tr key={index} className="hover:bg-orange-500/5 transition-colors duration-150">
                      <td className="border border-orange-500/20 px-4 py-2 text-orange-100">{log.date}</td>
                      <td className="border border-orange-500/20 px-4 py-2 text-orange-100">{log.time}</td>
                      <td className="border border-orange-500/20 px-4 py-2 text-orange-100">
                        {log.customerName} ({log.customerId})
                      </td>
                      <td className="border border-orange-500/20 px-4 py-2 text-orange-100">
                        {log.vehicleName} ({log.plateNumber})
                      </td>
                      <td className="border border-orange-500/20 px-4 py-2 text-orange-100">
                        ${log.totalSales !== undefined ? log.totalSales.toFixed(2) : "N/A"}
                      </td>
                      <td className="border border-orange-500/20 px-4 py-2 text-orange-100">
                        ${log.totalProfit !== undefined ? log.totalProfit.toFixed(2) : "N/A"}
                      </td>
                      <td className="border border-orange-500/20 px-4 py-2 text-orange-100">
                        <button
                          onClick={() => {
                            setSelectedRepair(log);
                            setShowRepairModal(true);
                          }}
                          className="text-orange-400 hover:text-orange-500 transition-colors duration-200"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Section */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/60 backdrop-blur-sm border border-orange-500/20 p-4 rounded-lg">
                <p className="text-orange-200/80">Total Income</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text">
                  ${totalIncome.toFixed(2)}
                </p>
              </div>
              <div className="bg-black/60 backdrop-blur-sm border border-orange-500/20 p-4 rounded-lg">
                <p className="text-orange-200/80">Total Profit</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text">
                  ${totalProfit.toFixed(2)}
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-orange-200/80">No sales logs available for your account.</p>
        )}

        {/* Repair Details Modal */}
        {showRepairModal && selectedRepair && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-black/90 border border-orange-500/20 rounded-xl p-6 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-orange-400">
                  Repair Details
                </h3>
                <button
                  onClick={() => {
                    setShowRepairModal(false);
                    setSelectedRepair(null);
                  }}
                  className="text-orange-400 hover:text-orange-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-orange-400 font-semibold">Vehicle Information</h4>
                    <div className="space-y-1">
                      <p className="text-white"><span className="text-orange-300">Category:</span> {selectedRepair.vehicleCategory}</p>
                      <p className="text-white"><span className="text-orange-300">Name:</span> {selectedRepair.vehicleName}</p>
                      <p className="text-white"><span className="text-orange-300">Plate Number:</span> {selectedRepair.plateNumber}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-orange-400 font-semibold">Customer Information</h4>
                    <div className="space-y-1">
                      <p className="text-white"><span className="text-orange-300">Name:</span> {selectedRepair.customerName}</p>
                      <p className="text-white"><span className="text-orange-300">CID:</span> {selectedRepair.customerId}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-orange-400 font-semibold">Parts Used</h4>
                  {selectedRepair.items && selectedRepair.items.length > 0 ? (
                    <table className="min-w-full mt-2">
                      <thead>
                        <tr>
                          <th className="text-left text-orange-300">Part Name</th>
                          <th className="text-left text-orange-300">Quantity</th>
                          <th className="text-left text-orange-300">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRepair.items.map((item, index) => (
                          <tr key={index} className="border-t border-orange-500/20">
                            <td className="text-white py-2">{item.name}</td>
                            <td className="text-white py-2">{item.quantity}</td>
                            <td className="text-white py-2">${item.price.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-orange-500/20">
                          <td colSpan={2} className="text-right text-orange-400 font-semibold py-2">Total:</td>
                          <td className="text-white py-2">${selectedRepair.totalSales.toFixed(2)}</td>
                        </tr>
                        {selectedRepair.discount > 0 && (
                          <tr>
                            <td colSpan={2} className="text-right text-orange-400 font-semibold py-2">Discount:</td>
                            <td className="text-white py-2">${selectedRepair.discount.toFixed(2)}</td>
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  ) : (
                    <p className="text-white">No parts listed</p>
                  )}
                </div>

                <div className="flex justify-between mt-6 pt-4 border-t border-orange-500/20">
                  <div>
                    <span className="text-orange-400 font-semibold">Date: </span>
                    <span className="text-white">{selectedRepair.date} {selectedRepair.time}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="bg-black/40 border border-orange-500/20 hover:border-orange-500/40 text-orange-100 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-orange-100">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="bg-black/40 border border-orange-500/20 hover:border-orange-500/40 text-orange-100 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
