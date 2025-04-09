import { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import toast from "react-hot-toast"; // Add react-hot-toast for notifications

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  url?: string;
}

interface AddProductFormProps {
  onAdd: (product: Omit<Product, "id">) => void;
}

const AddProductForm: React.FC<AddProductFormProps> = ({ onAdd }) => {
  const [product, setProduct] = useState<Omit<Product, "id">>({
    name: "",
    category: "",
    price: 0,
    stock: 0,
    description: "",
    url: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.name || !product.category || product.price <= 0 || product.stock < 0) {
      toast.error("Please fill all required fields correctly!");
      return;
    }
    onAdd(product);
    setProduct({ name: "", category: "", price: 0, stock: 0, description: "", url: "" });
    toast.success("Product added successfully!"); // Success toast
  };

  // Export to CSV
  const exportToCSV = async () => {
    try {
      const response = await axios.get("http://localhost:3001/products");
      const products: Product[] = response.data;
      const headers = ["ID,Name,Category,Price,Stock,Description,URL"];
      const rows = products.map((p) =>
        `${p.id},${p.name},${p.category},${p.price},${p.stock},${p.description},${p.url || ""}`.replace(/,/g, " ")
      );
      const csvContent = [...headers, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "products.csv";
      link.click();
      toast.success("Products exported to CSV!");
    } catch (error) {
      toast.error("Failed to export to CSV!");
      console.error("Export to CSV error:", error);
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      const response = await axios.get("http://localhost:3001/products");
      const products: Product[] = response.data;
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Product List", 20, 20);
      doc.setFontSize(12);
      let y = 30;
      products.forEach((p) => {
        const text = `${p.id} | ${p.name} | ${p.category} | ₹${p.price.toFixed(2)} | Stock: ${p.stock} | ${p.description} | ${p.url || "No URL"}`;
        doc.text(text, 20, y, { maxWidth: 170 }); // Wrap text if too long
        y += 10;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
      doc.save("products.pdf");
      toast.success("Products exported to PDF!");
    } catch (error) {
      toast.error("Failed to export to PDF!");
      console.error("Export to PDF error:", error);
    }
  };

  // Bulk Upload via CSV
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").slice(1); // Skip header
      const newProducts = lines
        .map((line) => {
          const [id, name, category, price, stock, description, url] = line.split(",");
          if (!id || !name || !category || !price || !stock) return null;
          return {
            id,
            name,
            category,
            price: Number(price),
            stock: Number(stock),
            description: description || "",
            url: url || undefined,
          } as Product;
        })
        .filter((p) => p !== null) as Product[];

      let successCount = 0;
      for (const product of newProducts) {
        try {
          await axios.post("http://localhost:3001/products", product);
          onAdd({
            name: product.name,
            category: product.category,
            price: product.price,
            stock: product.stock,
            description: product.description,
            url: product.url,
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to upload product ${product.id}:`, error);
          toast.error(`Failed to upload "${product.name}"`);
        }
      }
      if (successCount > 0) {
        toast.success(`${successCount} product(s) uploaded successfully!`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mb-8 bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Products</h2>
      <form onSubmit={handleSubmit} className="space-y-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              placeholder="Enter product name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <select
              value={product.category}
              onChange={(e) => setProduct({ ...product, category: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              required
            >
              <option value="">Select Category</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Books">Books</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
            <input
              type="number"
              value={product.price}
              onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              min="0"
              step="0.01"
              placeholder="Enter price"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Stock</label>
            <input
              type="number"
              value={product.stock}
              onChange={(e) => setProduct({ ...product, stock: Number(e.target.value) })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              min="0"
              placeholder="Enter stock"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={product.description}
              onChange={(e) => setProduct({ ...product, description: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              rows={4}
              placeholder="Enter product description"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Product URL (optional)</label>
            <input
              type="url"
              value={product.url || ""}
              onChange={(e) => setProduct({ ...product, url: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              placeholder="https://example.com/product"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Product
        </button>
      </form>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={exportToCSV}
          className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 hover:scale-105 transition-all duration-200"
        >
          Export to CSV
        </button>
        <button
          onClick={exportToPDF}
          className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 hover:scale-105 transition-all duration-200"
        >
          Export to PDF
        </button>
        <label className="w-full sm:w-auto bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 hover:scale-105 transition-all duration-200 cursor-pointer text-center">
          Bulk Upload CSV
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleBulkUpload}
          />
        </label>
      </div>
    </div>
  );
};

export default AddProductForm;