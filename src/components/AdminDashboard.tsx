import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import toast from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  url?: string;
  updatedAt?: string; // Optional field for recent updates
}

const COLORS = ["#ef4444", "#f97316", "#10b981", "#3b82f6"]; // Red, Orange, Green, Blue

const AdminDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("/api/products");
        // Mock updatedAt if not present in your data
        const fetchedProducts = response.data.map((p: Product) => ({
          ...p,
          updatedAt: p.updatedAt || new Date().toISOString(), // Mock date
        }));
        setProducts(fetchedProducts);
      } catch (error) {
        toast.error("Failed to fetch products!");
        console.error("Fetch products error:", error);
      }
    };
    fetchProducts();
  }, []);

  // Metrics
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.stock < 10).length;
  const totalValue = products.reduce((acc, p) => acc + p.price * p.stock, 0).toFixed(2);

  // Stock Distribution
  const stockDistribution = [
    { name: "0-10", value: products.filter((p) => p.stock <= 10).length },
    { name: "11-50", value: products.filter((p) => p.stock > 10 && p.stock <= 50).length },
    { name: "51+", value: products.filter((p) => p.stock > 50).length },
  ].filter((d) => d.value > 0);

  // Category-wise Breakdown
  const categoryBreakdown = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const categoryChartData = Object.entries(categoryBreakdown).map(([name, value]) => ({
    name,
    value,
  }));

  // Low Stock Products
  const lowStockProducts = products
    .filter((p) => p.stock < 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  // Recent Product Updates
  const recentUpdates = products
    .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Products</h2>
            <p className="text-2xl font-bold text-blue-600">{totalProducts}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Low Stock Alerts</h2>
            <p className={`text-2xl font-bold ${lowStockCount > 0 ? "text-red-600" : "text-green-600"}`}>
              {lowStockCount}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Inventory Value</h2>
            <p className="text-2xl font-bold text-green-600">₹{totalValue}</p>
          </div>
        </div>

        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Stock Distribution (Pie Chart) */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Stock Distribution</h2>
            {stockDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stockDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {stockDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-4">No stock data available</p>
            )}
          </div>

          {/* Category-wise Breakdown (Bar Chart) */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Category-wise Breakdown</h2>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" name="Products" barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-4">No category data available</p>
            )}
          </div>

          {/* Low Stock Products */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Low Stock Products (Top 5)</h2>
            {lowStockProducts.length > 0 ? (
              <ul className="space-y-4">
                {lowStockProducts.map((product) => (
                  <li key={product.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-600">{product.category}</p>
                    </div>
                    <p className="text-sm font-semibold text-red-600">Stock: {product.stock}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">No low stock products</p>
            )}
          </div>

          {/* Recent Product Updates (Table) */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Product Updates</h2>
            {recentUpdates.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-sm font-semibold text-gray-700">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUpdates.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-3 px-4 text-sm text-gray-800">{product.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{product.category}</td>
                        <td className="py-3 px-4 text-sm text-green-600">₹{product.price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{product.stock}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(product.updatedAt!).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent updates available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;