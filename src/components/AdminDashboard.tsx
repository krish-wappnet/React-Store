import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const AdminDashboard = () => {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await axios.get("http://localhost:3001/products");
      setProducts(response.data);
    };
    fetchProducts();
  }, []);

  const lowStock = products.filter((p) => p.stock < 10).length;
  const categoryBreakdown = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryBreakdown).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="border p-4">
          <h2>Total Products</h2>
          <p>{products.length}</p>
        </div>
        <div className="border p-4">
          <h2>Low Stock Alerts</h2>
          <p>{lowStock}</p>
        </div>
        <div className="border p-4">
          <h2>Categories</h2>
          <p>{Object.keys(categoryBreakdown).length}</p>
        </div>
      </div>
      <BarChart width={500} height={300} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#8884d8" />
      </BarChart>
    </div>
  );
};

export default AdminDashboard;