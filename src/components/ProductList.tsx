import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/useAuth";
import AddProductForm from "./AddProductForm";
import toast from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  url?: string;
}

const ProductList = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false); // Toggle for AddProductForm

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("https://react-store-2wpq.onrender.com/products");
      const fetchedProducts: Product[] = response.data;
      console.log("Fetched response:", response.data);
      setProducts(fetchedProducts);
      fetchedProducts.forEach((product) => {
        if (product.stock < 10) {
          toast.error(`Low stock alert: ${product.name} has only ${product.stock} units left!`, {
            id: `low-stock-${product.id}`,
          });
        }
      });
    } catch (error) {
      toast.error("Failed to fetch products!");
      console.error("Fetch products error:", error);
    }
  };

  const addProduct = async (product: Omit<Product, "id">) => {
    if (products.some((p) => p.name.toLowerCase() === product.name.toLowerCase())) {
      toast.error(`Duplicate entry: "${product.name}" already exists!`);
      return;
    }
    try {
      const response = await axios.post("https://react-store-2wpq.onrender.com/products", product);
      setProducts([...products, response.data]);
      toast.success(`Product "${product.name}" added successfully!`);
      setIsAddFormOpen(false); // Close form after adding
    } catch (error) {
      toast.error("Failed to add product!");
      console.error("Add product error:", error);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    if (
      products.some(
        (p) =>
          p.name.toLowerCase() === updatedProduct.name.toLowerCase() &&
          p.id !== updatedProduct.id
      )
    ) {
      toast.error(`Duplicate entry: "${updatedProduct.name}" already exists!`);
      return;
    }
    try {
      const response = await axios.put(
        `https://react-store-2wpq.onrender.com/products/${updatedProduct.id}`,
        updatedProduct
      );
      setProducts(products.map((p) => (p.id === updatedProduct.id ? response.data : p)));
      toast.success(`Product "${updatedProduct.name}" updated successfully!`);
      if (response.data.stock < 10) {
        toast.error(`Low stock alert: ${response.data.name} has only ${response.data.stock} units left!`, {
          id: `low-stock-${response.data.id}`,
        });
      }
      setEditingProduct(null);
    } catch (error) {
      toast.error("Failed to update product!");
      console.error("Update product error:", error);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const productToDelete = products.find((p) => p.id === id);
      await axios.delete(`https://react-store-2wpq.onrender.com/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
      toast.success(`Product "${productToDelete?.name}" deleted successfully!`);
    } catch (error) {
      toast.error("Failed to delete product!");
      console.error("Delete product error:", error);
    }
  };

  const filteredProducts = products
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => (categoryFilter ? p.category === categoryFilter : true))
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      return 0;
    });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) updateProduct(editingProduct);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Product Management</h1>
          {user?.role === "admin" && (
            <button
              onClick={() => setIsAddFormOpen(!isAddFormOpen)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 hover:scale-105 transition-all duration-200"
            >
              {isAddFormOpen ? "Close Form" : "Add New Product"}
            </button>
          )}
        </div>

        {/* Add Product Form (Collapsible) */}
        {user?.role === "admin" && isAddFormOpen && (
          <div className="mb-8">
            <AddProductForm onAdd={addProduct} />
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 bg-white p-6 rounded-xl shadow-md flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search products..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Books">Books</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="">Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A-Z</option>
              <option value="name-desc">Name: Z-A</option>
            </select>
          </div>
        </div>

        {/* Edit Modal */}
        {editingProduct && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50"
            onClick={(e) => { if (e.target === e.currentTarget) setEditingProduct(null); }}
          >
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-95">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Product</h2>
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
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
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stock</label>
                    <input
                      type="number"
                      value={editingProduct.stock}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      min="0"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      rows={4}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product URL (optional)</label>
                    <input
                      type="url"
                      value={editingProduct.url || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, url: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      placeholder="https://example.com/product"
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-4 justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 hover:scale-105 transition-all duration-200"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 hover:scale-105 transition-all duration-200"
                    onClick={() => setEditingProduct(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Product List */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Product Inventory</h2>
          {filteredProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No products found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-gray-50 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 hover:scale-102"
                >
                  {product.url ? (
                    <img
                      src={product.url}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                      onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/200x300?text=No+Image"; }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 font-medium">No Image</span>
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{product.category}</p>
                    <p className="text-lg font-semibold text-green-600 mt-2">₹{product.price.toFixed(2)}</p>
                    <p className={`text-sm mt-1 ${product.stock < 10 ? "text-red-600 font-semibold" : "text-gray-700"}`}>
                      Stock: {product.stock}
                    </p>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{product.description}</p>
                    {product.url && (
                      <p className="mt-3">
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium"
                        >
                          View Product
                        </a>
                      </p>
                    )}
                    {user?.role === "admin" && (
                      <div className="mt-4 flex gap-3">
                        <button
                          className="flex-1 bg-yellow-600 text-white py-2 rounded-lg font-semibold hover:bg-yellow-700 hover:scale-105 transition-all duration-200"
                          onClick={() => setEditingProduct(product)}
                        >
                          Edit
                        </button>
                        <button
                          className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-600/90 hover:scale-105 transition-all duration-200"
                          onClick={() => deleteProduct(product.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;