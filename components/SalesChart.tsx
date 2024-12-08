"use client";

import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";
import { useSession } from "next-auth/react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type SalesByEmployee = {
  employee: string;
  totalSales: number;
  totalProfit: number;
};

type SalesLog = {
  _id: string;
  date: string;
  time: string;
  soldBy: string;
  soldByDiscordId: string;
  customerName: string;
  customerId: string;
  vehicleName: string;
  plateNumber: string;
  totalSales: number;
  totalProfit: number;
  vehicleCategory: string;
  items: Array<{
    name: string;
    category: string;
    quantity: number;
    price: number;
    damageLevel: string | null;
    totalPrice: number;
  }>;
  discount: number;
};

type TimeLog = {
  _id: string;
  UserID: string;
  DepartmentID: string;
  TotalTime: number;
  createdAt: string;
  updatedAt: string;
};

type EmployeeTime = {
  characterName: string;
  totalTime: number;
};

const initialOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
      labels: {
        color: "rgba(200, 200, 200, 0.9)",
      },
    },
    title: {
      display: true,
      text: "Sales and Profit Per Employee",
      color: "rgba(200, 200, 200, 0.9)",
    },
  },
  scales: {
    x: {
      ticks: {
        color: "rgba(200, 200, 200, 0.9)",
      },
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
      },
    },
    y: {
      ticks: {
        color: "rgba(200, 200, 200, 0.9)",
        callback: function (tickValue: string | number) {
          if (typeof tickValue === "number") {
            return tickValue.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            });
          }
          return tickValue;
        },
      },
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
      },
    },
  },
};

export default function SalesDashboard() {
  const { data: session } = useSession();
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: "Total Sales",
        data: [] as number[],
        backgroundColor: "rgba(251, 146, 60, 0.6)",
        borderColor: "rgba(251, 146, 60, 0.8)",
        borderWidth: 2,
      },
      {
        label: "Total Profit",
        data: [] as number[],
        backgroundColor: "rgba(249, 115, 22, 0.6)",
        borderColor: "rgba(249, 115, 22, 0.8)",
        borderWidth: 2,
      },
    ],
  });

  const [salesLogs, setSalesLogs] = useState<SalesLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SalesLog[]>([]);
  const [filterUser, setFilterUser] = useState("All");
  const [employeeNames, setEmployeeNames] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSalesCount, setTotalSalesCount] = useState(0);
  const [employeeTimes, setEmployeeTimes] = useState<EmployeeTime[]>([]);
  const logsPerPage = 10;

  const [salesFilterStartDate, setSalesFilterStartDate] = useState("");
  const [salesFilterEndDate, setSalesFilterEndDate] = useState("");
  const [chartFilter, setChartFilter] = useState("today");
  const [goToPage, setGoToPage] = useState("");
  const [options, setOptions] = useState(initialOptions);

  const [selectedRepair, setSelectedRepair] = useState<SalesLog | null>(null);
  const [showRepairModal, setShowRepairModal] = useState(false);

  const [filteredTotalSales, setFilteredTotalSales] = useState(0);
  const [filteredTotalProfit, setFilteredTotalProfit] = useState(0);

  const getThisWeekLogs = (logs: SalesLog[]) => {
    const today = new Date();
    const day = today.getDay();
    // Adjust to get Monday (1 for Monday, so if it's Sunday (0), we need to go back 6 days)
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    return logs.filter(log => {
      const [day, month, year] = log.date.split('/').map(Number);
      const logDate = new Date(year, month - 1, day);
      logDate.setHours(0, 0, 0, 0);
      return logDate >= startOfWeek;
    });
  };

  const getFilteredLogs = (logs: SalesLog[], startDate?: string, endDate?: string) => {
    let filteredLogs = logs;

    // Apply date filter if dates are selected
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      filteredLogs = filteredLogs.filter((log) => {
        const [day, month, year] = log.date.split('/').map(Number);
        const logDate = new Date(year, month - 1, day);
        return logDate >= start && logDate <= end;
      });
    }

    return filteredLogs;
  };

  const getRepairCounts = (logs: SalesLog[]) => {
    const customerCounts = new Map<string, number>();
    const employeeCounts = new Map<string, number>();

    logs.forEach(log => {
      // Count customer repairs
      customerCounts.set(log.customerName, (customerCounts.get(log.customerName) || 0) + 1);
      // Count employee repairs
      employeeCounts.set(log.soldBy, (employeeCounts.get(log.soldBy) || 0) + 1);
    });

    return { customerCounts, employeeCounts };
  };

  const sortMapByValue = (map: Map<string, number>) => {
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sales data first
        const salesResponse = await axios.get("/api/sales/chart");
        const { salesByEmployee, salesLogs } = salesResponse.data;

        if (!Array.isArray(salesLogs)) {
          console.error('Sales logs is not an array:', salesLogs);
          return;
        }

        setSalesLogs(salesLogs);
        setFilteredLogs(salesLogs);
        setTotalSalesCount(salesLogs.length);

        // Set employee names for filter
        const uniqueNames = ["All", ...new Set(salesLogs.map((log) => log.soldBy))];
        setEmployeeNames(uniqueNames);

        // Update chart data based on the selected filter
        if (salesByEmployee && salesByEmployee[chartFilter]) {
          const periodData = salesByEmployee[chartFilter];
          setChartData({
            labels: periodData.map((item: SalesByEmployee) => item.employee),
            datasets: [
              {
                label: "Total Sales",
                data: periodData.map((item: SalesByEmployee) => item.totalSales),
                backgroundColor: "rgba(251, 146, 60, 0.6)",
                borderColor: "rgba(251, 146, 60, 0.8)",
                borderWidth: 2,
              },
              {
                label: "Total Profit",
                data: periodData.map((item: SalesByEmployee) => item.totalProfit),
                backgroundColor: "rgba(249, 115, 22, 0.6)",
                borderColor: "rgba(249, 115, 22, 0.8)",
                borderWidth: 2,
              },
            ],
          });
        }

        // Fetch time data separately to handle potential errors
        try {
          const timeResponse = await axios.get("/api/time");
          if (timeResponse.data && Array.isArray(timeResponse.data)) {
            const employeeTimesData = timeResponse.data.map((timeLog: TimeLog) => ({
              characterName: timeLog.UserID,
              totalTime: timeLog.TotalTime || 0,
            }));
            setEmployeeTimes(employeeTimesData);
          } else {
            console.error('Invalid time logs data:', timeResponse.data);
            setEmployeeTimes([]);
          }
        } catch (timeError) {
          console.error('Error fetching time data:', timeError);
          setEmployeeTimes([]);
        }

      } catch (error) {
        console.error('Error fetching sales data:', error);
        setSalesLogs([]);
        setFilteredLogs([]);
        setTotalSalesCount(0);
        setEmployeeNames(["All"]);
        setChartData({
          labels: [],
          datasets: [
            {
              label: "Total Sales",
              data: [],
              backgroundColor: "rgba(251, 146, 60, 0.6)",
              borderColor: "rgba(251, 146, 60, 0.8)",
              borderWidth: 2,
            },
            {
              label: "Total Profit",
              data: [],
              backgroundColor: "rgba(249, 115, 22, 0.6)",
              borderColor: "rgba(249, 115, 22, 0.8)",
              borderWidth: 2,
            },
          ],
        });
      }
    };

    fetchData();
  }, [chartFilter]);

  useEffect(() => {
    let filtered = [...salesLogs];

    // Apply employee filter
    if (filterUser !== "All") {
      filtered = filtered.filter((log) => log.soldBy === filterUser);
    }

    // Apply date filter if dates are selected
    if (salesFilterStartDate && salesFilterEndDate) {
      const startDate = new Date(salesFilterStartDate);
      const endDate = new Date(salesFilterEndDate);
      filtered = filtered.filter((log) => {
        const [day, month, year] = log.date.split("/").map(Number);
        const logDate = new Date(year, month - 1, day);
        return logDate >= startDate && logDate <= endDate;
      });
    }

    // Calculate totals for filtered logs
    const totals = filtered.reduce(
      (acc, log) => ({
        sales: acc.sales + log.totalSales,
        profit: acc.profit + log.totalProfit,
      }),
      { sales: 0, profit: 0 }
    );

    setFilteredTotalSales(totals.sales);
    setFilteredTotalProfit(totals.profit);
    setFilteredLogs(filtered);
    setTotalSalesCount(filtered.length);
    setCurrentPage(1); // Reset to first page when filters change
  }, [salesLogs, filterUser, salesFilterStartDate, salesFilterEndDate]);

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + logsPerPage);

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

  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPage);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setGoToPage("");
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!saleId) {
      alert("Invalid sale ID");
      return;
    }

    if (window.confirm("Are you sure you want to delete this sale?")) {
      try {
        const response = await axios.delete(`/api/sales/delete/${saleId}`);
        
        if (response.status === 200) {
          const updatedSalesLogs = salesLogs.filter(log => log._id !== saleId);
          setSalesLogs(updatedSalesLogs);
          setFilteredLogs(prevLogs => prevLogs.filter(log => log._id !== saleId));
          setTotalSalesCount(prevCount => prevCount - 1);
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string }, statusText?: string } };
        const errorMessage = err.response?.data?.error || 
                           err.response?.statusText || 
                           "Failed to delete sale. Please try again.";
        alert(errorMessage);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-black/40 backdrop-blur-lg border border-orange-500/20 p-6 rounded-xl shadow-[0_8px_30px_rgba(251,146,60,0.1)]">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text">
          Sales and Profit Per Employee
        </h2>
        <div className="flex justify-end mb-4">
          <select
            value={chartFilter}
            onChange={(e) => setChartFilter(e.target.value)}
            className="p-2 border border-orange-500/20 rounded-lg bg-black/40 text-orange-100 backdrop-blur-sm hover:border-orange-500/40 transition-colors duration-200"
          >
            <option value="allTime">All Time</option>
            <option value="today">Today</option>
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
            <option value="lastWeek">Last Week</option>
            <option value="lastMonth">Last Month</option>
          </select>
        </div>
        <Bar data={chartData} options={options} className="backdrop-blur-sm" />
      </div>

      <div className="bg-black/40 backdrop-blur-lg border border-orange-500/20 p-6 rounded-xl shadow-[0_8px_30px_rgba(251,146,60,0.1)]">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text">
          Employee Duty Time
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-orange-500/20">
            <thead>
              <tr className="bg-black/60">
                <th className="border border-orange-500/20 px-4 py-2 text-orange-100">Character Name</th>
                <th className="border border-orange-500/20 px-4 py-2 text-orange-100">Total Duty Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-500/20">
              {employeeTimes.map((employee, index) => (
                <tr key={index} className="hover:bg-orange-500/5 transition-colors duration-150">
                  <td className="border border-orange-500/20 px-4 py-2 text-orange-100">{employee.characterName}</td>
                  <td className="border border-orange-500/20 px-4 py-2 text-orange-100">{formatTime(employee.totalTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly Repair Details Section */}
      <div className="mt-8 bg-black/40 backdrop-blur-lg border border-orange-500/20 p-6 rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text">
            Weekly Repair Details
          </h2>
          <div className="flex items-center space-x-2 bg-black/30 p-2 rounded-lg">
            <input
              type="date"
              value={salesFilterStartDate}
              onChange={(e) => setSalesFilterStartDate(e.target.value)}
              className="bg-transparent text-white p-1 rounded border border-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
            <span className="text-gray-400 mx-2">to</span>
            <input
              type="date"
              value={salesFilterEndDate}
              onChange={(e) => setSalesFilterEndDate(e.target.value)}
              className="bg-transparent text-white p-1 rounded border border-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
            {(salesFilterStartDate || salesFilterEndDate) && (
              <button
                onClick={() => {
                  setSalesFilterStartDate("");
                  setSalesFilterEndDate("");
                }}
                className="ml-2 bg-orange-500/20 text-orange-300 p-1 rounded hover:bg-orange-500/40 transition-colors duration-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top 5 Customers */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-400">Top 5 Customers</h3>
            <div className="space-y-2">
              {sortMapByValue(
                getRepairCounts(
                  getFilteredLogs(
                    salesLogs, 
                    salesFilterStartDate, 
                    salesFilterEndDate
                  )
                ).customerCounts
              )
                .slice(0, 5)
                .map(({ name, count }, index) => (
                  <div key={index} className="text-white">
                    {name} <span className="text-orange-300">(Repair Count: {count})</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Employees with Highest Repairs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-400">Employees with Highest Repairs</h3>
            <div className="space-y-2">
              {sortMapByValue(
                getRepairCounts(
                  getFilteredLogs(
                    salesLogs, 
                    salesFilterStartDate, 
                    salesFilterEndDate
                  )
                ).employeeCounts
              )
                .map(({ name, count }, index) => (
                  <div key={index} className="text-white">
                    {name} <span className="text-orange-300">(Repair Count: {count})</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Employees Completed 60 Repairs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-400">Employees who have Completed 60 Repairs</h3>
            <div className="space-y-2">
              {sortMapByValue(
                getRepairCounts(
                  getFilteredLogs(
                    salesLogs, 
                    salesFilterStartDate, 
                    salesFilterEndDate
                  )
                ).employeeCounts
              )
                .filter(({ count }) => count >= 60)
                .map(({ name, count }, index) => (
                  <div key={index} className="text-white">
                    {name} <span className="text-orange-300">(Repair Count: {count})</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Employees Not Completed 60 Repairs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-400">Employees who have Not Completed 60 Repairs</h3>
            <div className="space-y-2">
              {sortMapByValue(
                getRepairCounts(
                  getFilteredLogs(
                    salesLogs, 
                    salesFilterStartDate, 
                    salesFilterEndDate
                  )
                ).employeeCounts
              )
                .filter(({ count }) => count < 60)
                .map(({ name, count }, index) => (
                  <div key={index} className="text-white">
                    {name} <span className="text-orange-300">(Repair Count: {count})</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Repair Logs Section */}
      <div className="bg-black/40 backdrop-blur-lg border border-orange-500/20 p-6 rounded-xl mt-8">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text">
          Repair Logs
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="w-full p-2 border border-orange-500/20 rounded-lg bg-black/40 text-orange-100 backdrop-blur-sm hover:border-orange-500/40 transition-colors duration-200"
          >
            {employeeNames.map((name, index) => (
              <option key={index} value={name}>
                {name}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={salesFilterStartDate}
            onChange={(e) => setSalesFilterStartDate(e.target.value)}
            className="w-full p-2 border border-orange-500/20 rounded-lg bg-black/40 text-orange-100 backdrop-blur-sm hover:border-orange-500/40 transition-colors duration-200"
          />

          <input
            type="datetime-local"
            value={salesFilterEndDate}
            onChange={(e) => setSalesFilterEndDate(e.target.value)}
            className="w-full p-2 border border-orange-500/20 rounded-lg bg-black/40 text-orange-100 backdrop-blur-sm hover:border-orange-500/40 transition-colors duration-200"
          />
        </div>

        <p className="text-orange-200/80 mb-2">
          Showing {filteredLogs.length} of {totalSalesCount} Total Repairs
        </p>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-200">Repair Logs</h2>
          <div className="flex items-center space-x-4">
            <div className="text-gray-200">
              <span className="font-semibold">Total Sales:</span>{" "}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(filteredTotalSales)}
            </div>
            <div className="text-gray-200">
              <span className="font-semibold">Total Profit:</span>{" "}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(filteredTotalProfit)}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-orange-500/20">
            <thead>
              <tr className="bg-black/60">
                <th className="border border-orange-500/20 px-4 py-2 text-orange-100">Date & Time</th>
                <th className="border border-orange-500/20 px-4 py-2 text-orange-100">Repaired By</th>
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
                  <td className="border border-orange-500/20 px-4 py-2 text-orange-100">{log.date} {log.time}</td>
                  <td className="border border-orange-500/20 px-4 py-2 text-orange-100">{log.soldBy}</td>
                  <td className="border border-orange-500/20 px-4 py-2 text-orange-100">
                    {log.customerName} ({log.customerId})
                  </td>
                  <td className="border border-orange-500/20 px-4 py-2 text-orange-100">
                    {log.vehicleName} ({log.plateNumber})
                  </td>
                  <td className="border border-orange-500/20 px-4 py-2 text-orange-100">
                    {log.totalSales !== undefined ? `$${log.totalSales.toFixed(2)}` : "N/A"}
                  </td>
                  <td className="border border-orange-500/20 px-4 py-2 text-orange-100">
                    {log.totalProfit !== undefined ? `$${log.totalProfit.toFixed(2)}` : "N/A"}
                  </td>
                  <td className="border border-orange-500/20 px-4 py-2 text-orange-100 space-x-2">
                    <button
                      onClick={() => {
                        setSelectedRepair(log);
                        setShowRepairModal(true);
                      }}
                      className="bg-orange-500/80 hover:bg-orange-600/80 text-white font-semibold py-1 px-3 rounded-lg transition-colors duration-200"
                    >
                      Repair Details
                    </button>
                    {session?.user.role === "root" && (
                      <button
                        onClick={() => handleDeleteSale(log._id)}
                        className="bg-red-500/80 hover:bg-red-600/80 text-white font-semibold py-1 px-3 rounded-lg transition-colors duration-200"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4">
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
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={goToPage}
              onChange={(e) => setGoToPage(e.target.value)}
              className="w-20 p-2 border border-orange-500/20 rounded-lg bg-black/40 text-orange-100 backdrop-blur-sm hover:border-orange-500/40 transition-colors duration-200"
              min="1"
              max={totalPages}
            />
            <button
              onClick={handleGoToPage}
              className="bg-black/40 border border-orange-500/20 hover:border-orange-500/40 text-orange-100 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Go
            </button>
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
                  <span className="text-orange-400 font-semibold">Mechanic: </span>
                  <span className="text-white">{selectedRepair.soldBy}</span>
                </div>
                <div>
                  <span className="text-orange-400 font-semibold">Date: </span>
                  <span className="text-white">{selectedRepair.date} {selectedRepair.time}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
