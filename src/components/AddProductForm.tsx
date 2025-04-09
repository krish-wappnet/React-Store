import { useState } from "react";
import axios, { AxiosError } from "axios";
import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { 
  FaPlus, 
  FaFileCsv, 
  FaFilePdf, 
  FaUpload, 
  FaMagic 
} from "react-icons/fa"

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  url?: string;
  updatedAt?: string; // Added for AdminDashboard compatibility
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
  const [isGenerating, setIsGenerating] = useState(false);

  const HUGGINGFACE_API_KEY = import.meta.env.VITE_API_KEY; // Vite env variable

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.name || !product.category || product.price <= 0 || product.stock < 0) {
      toast.error("Please fill all required fields with valid values!");
      return;
    }
    const newProduct = { ...product, updatedAt: new Date().toISOString() };
    onAdd(newProduct);
    setProduct({ name: "", category: "", price: 0, stock: 0, description: "", url: "" });
    toast.success("Product added successfully!");
  };

  const generateDescription = async () => {
    if (!product.name || !product.category) {
      toast.error("Please enter a product name and category first!");
      return;
    }

    if (!HUGGINGFACE_API_KEY) {
      toast.error("Hugging Face API key is missing. Please configure VITE_API_KEY in .env!");
      console.error("Missing VITE_API_KEY in .env");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post(
        "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1", // Using GPT-2; swap to a better model if needed
        {
          inputs: `Create a concise product description (50-70 words) for a ${product.category} product named "${product.name}". Highlight key features and appeal: `,
          parameters: {
            max_length: 120, // Slightly higher to ensure full output
            temperature: 0.7,
            top_k: 50,
            top_p: 0.95,
            return_full_text: false, // Only get the generated part
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          },
        }
      );

      const description = response.data[0].generated_text.trim();
      setProduct({ ...product, description });
      toast.success("Description generated successfully!");
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
    
      if (axiosError.response?.status === 429) {
        toast.error("Rate limit exceeded. Please wait and try again.");
      } else if (axiosError.response?.status === 503) {
        toast.error("Model is loading. Please try again in a few seconds.");
      } else {
        toast.error("Failed to generate description. Please try again later.");
      }
      console.error("Hugging Face API error:", axiosError.response?.data || axiosError.message);
    }finally {
      setIsGenerating(false);
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await axios.get("/api/products");
      const products: Product[] = response.data;
      const headers = ["ID,Name,Category,Price,Stock,Description,URL,UpdatedAt"];
      const rows = products.map((p) =>
        `"${p.id}","${p.name}","${p.category}","${p.price}","${p.stock}","${p.description.replace(/"/g, '""')}","${p.url || ""}","${p.updatedAt || ""}"`
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

  const exportToPDF = async () => {
    try {
      const response = await axios.get("/api/products");
      const products: Product[] = response.data;
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Product List", 20, 20);
      doc.setFontSize(12);
      let y = 30;
      products.forEach((p) => {
        const text = `${p.id} | ${p.name} | ${p.category} | ₹${p.price.toFixed(2)} | Stock: ${p.stock} | ${p.description} | ${p.url || "No URL"} | Updated: ${p.updatedAt || "N/A"}`;
        doc.text(text, 20, y, { maxWidth: 170 });
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

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").slice(1);
      const newProducts = lines
        .map((line) => {
          const [id, name, category, price, stock, description, url, updatedAt] = line.split(",");
          if (!id || !name || !category || !price || !stock) return null;
          return {
            id,
            name,
            category,
            price: Number(price),
            stock: Number(stock),
            description: description || "",
            url: url || undefined,
            updatedAt: updatedAt || new Date().toISOString(),
          } as Product;
        })
        .filter((p) => p !== null) as Product[];

      let successCount = 0;
      for (const product of newProducts) {
        try {
          await axios.post("/api/products", product);
          onAdd({
            name: product.name,
            category: product.category,
            price: product.price,
            stock: product.stock,
            description: product.description,
            url: product.url,
            updatedAt: product.updatedAt,
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
    <div className="mb-8 bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 max-w-4xl mx-auto">
    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Add New Product</h2>
    
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Product Name *</label>
          <input
            type="text"
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            placeholder="Enter product name"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Category *</label>
          <select
            value={product.category}
            onChange={(e) => setProduct({ ...product, category: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
            required
          >
            <option value="">Select Category</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Books">Books</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Price (₹) *</label>
          <input
            type="number"
            value={product.price || ""}
            onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            min="0"
            step="0.01"
            placeholder="Enter price"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Stock *</label>
          <input
            type="number"
            value={product.stock || ""}
            onChange={(e) => setProduct({ ...product, stock: Number(e.target.value) })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            min="0"
            placeholder="Enter stock quantity"
            required
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-700">Description</label>
            <button
              type="button"
              onClick={generateDescription}
              disabled={isGenerating}
              className={`flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:bg-indigo-400 disabled:cursor-not-allowed`}
            >
              {isGenerating ? (
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
                  />
                </svg>
              ) : (
                <FaMagic className="mr-2" />
              )}
              {isGenerating ? "Generating..." : "Generate Description"}
            </button>
          </div>
          <textarea
            value={product.description}
            onChange={(e) => setProduct({ ...product, description: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 disabled:bg-gray-100"
            rows={4}
            placeholder="Enter product description or generate one"
            disabled={isGenerating}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Product URL (optional)</label>
          <input
            type="url"
            value={product.url || ""}
            onChange={(e) => setProduct({ ...product, url: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            placeholder="https://example.com/product"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center"
      >
        <FaPlus className="mr-2" />
        Add Product
      </button>
    </form>

    <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
      <button
        onClick={exportToCSV}
        className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 flex items-center justify-center"
      >
        <FaFileCsv className="mr-2" />
        Export to CSV
      </button>
      <button
        onClick={exportToPDF}
        className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center justify-center"
      >
        <FaFilePdf className="mr-2" />
        Export to PDF
      </button>
      <label className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-200 cursor-pointer text-center flex items-center justify-center">
        <FaUpload className="mr-2" />
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