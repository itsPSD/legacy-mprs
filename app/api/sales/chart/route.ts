import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { format } from "date-fns";

interface Item {
  _id: ObjectId;
  name: string;
  category: string;
  price: number;
  stockPrice: number;
}

interface SaleItem {
  itemId: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  stockPrice: number;
  damageLevel: string | null;
  totalPrice: number;
  totalProfit: number;
}

interface Sale {
  _id: ObjectId;
  timestamp: Date;
  customerDetails: {
    name: string;
    cid: string;
    discordId: string;
    vehicleName?: string;
    plateNumber?: string;
  };
  vehicleDetails: {
    vehicleCategory: string;
    engineDamage: string;
    bodyDamage: string;
  };
  soldBy: string;
  soldByDiscordId: string;
  items: SaleItem[];
  totalBill: number;
  profit: number;
  discount: number;
}

export async function GET() {
  const client = await clientPromise;
  const db = client.db("MPRS");

  // Fetch all sales
  const sales = await db.collection<Sale>("sales").find({}).toArray();

  // Helper function to format date as DD/MM/YYYY
  const formatDate = (date: Date) => {
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  // Calculate start dates for different periods
  const mostRecentDate = new Date(Math.max(...sales.map(sale => new Date(sale.timestamp).getTime())));
  const startOfToday = new Date(Date.UTC(mostRecentDate.getUTCFullYear(), mostRecentDate.getUTCMonth(), mostRecentDate.getUTCDate()));
  
  // Calculate start of week (Monday)
  const startOfWeek = new Date(mostRecentDate);
  const day = startOfWeek.getUTCDay();
  const diff = startOfWeek.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  startOfWeek.setUTCDate(diff);
  startOfWeek.setUTCHours(0, 0, 0, 0);

  const startOfMonth = new Date(Date.UTC(mostRecentDate.getUTCFullYear(), mostRecentDate.getUTCMonth(), 1));
  
  // Calculate start of last week (previous Monday)
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setUTCDate(startOfLastWeek.getUTCDate() - 7);
  
  const startOfLastMonth = new Date(Date.UTC(mostRecentDate.getUTCFullYear(), mostRecentDate.getUTCMonth() - 1, 1));

  // Helper function to calculate sales for a specific period
  const calculateSalesForPeriod = (startDate: Date, endDate: Date = mostRecentDate) => {
    return sales.reduce((acc, sale) => {
      const saleDate = new Date(sale.timestamp);
      if (saleDate >= startDate && saleDate <= endDate) {
        const employee = sale.soldBy || "Unknown";
        if (!acc[employee]) {
          acc[employee] = { totalSales: 0, totalProfit: 0 };
        }
        acc[employee].totalSales += sale.totalBill;
        acc[employee].totalProfit += sale.profit;
      }
      return acc;
    }, {} as Record<string, { totalSales: number; totalProfit: number }>);
  };

  // Calculate sales for different periods
  const allTimeSales = calculateSalesForPeriod(new Date(0));
  const todaySales = calculateSalesForPeriod(startOfToday);
  const thisWeekSales = calculateSalesForPeriod(startOfWeek);
  const thisMonthSales = calculateSalesForPeriod(startOfMonth);
  const lastWeekSales = calculateSalesForPeriod(startOfLastWeek, startOfWeek);
  const lastMonthSales = calculateSalesForPeriod(startOfLastMonth, startOfMonth);

  // Helper function to format sales data
  const formatSalesData = (salesData: Record<string, { totalSales: number; totalProfit: number }>) => {
    return Object.entries(salesData).map(([employee, data]) => ({
      employee,
      totalSales: data.totalSales,
      totalProfit: data.totalProfit,
    }));
  };

  // Format sales logs
  const formattedSalesLogs = sales.map((sale) => ({
    _id: sale._id.toString(),
    date: formatDate(new Date(sale.timestamp)),
    time: format(new Date(sale.timestamp), "HH:mm:ss"),
    customerName: sale.customerDetails.name,
    customerId: sale.customerDetails.cid,
    vehicleName: sale.customerDetails.vehicleName || "Not specified",
    plateNumber: sale.customerDetails.plateNumber || "Not specified",
    vehicleCategory: sale.vehicleDetails.vehicleCategory,
    soldBy: sale.soldBy,
    soldByDiscordId: sale.soldByDiscordId,
    items: sale.items.map((item) => ({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      price: item.price,
      damageLevel: item.damageLevel,
      totalPrice: item.totalPrice
    })),
    totalSales: sale.totalBill,
    totalProfit: sale.profit,
    discount: sale.discount
  }));

  // Format the final result
  const result = {
    salesByEmployee: {
      allTime: formatSalesData(allTimeSales),
      today: formatSalesData(todaySales),
      thisWeek: formatSalesData(thisWeekSales),
      thisMonth: formatSalesData(thisMonthSales),
      lastWeek: formatSalesData(lastWeekSales),
      lastMonth: formatSalesData(lastMonthSales),
    },
    salesLogs: formattedSalesLogs,
  };

  return NextResponse.json(result);
}
