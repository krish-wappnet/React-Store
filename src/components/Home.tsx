import { useAuth } from "../context/useAuth";
import { Link } from "react-router-dom";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 animate-fade-in">
            Welcome to My Store
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 animate-fade-in-delay">
            Discover a curated collection of premium products tailored just for you.
          </p>
          <Link
            to="/products"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 hover:scale-105 transition-all duration-300 shadow-lg"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold mb-3">Wide Selection</h3>
            <p className="text-gray-300">Explore electronics, clothing, books, and more.</p>
          </div>
          <div className="p-6 bg-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold mb-3">Fast Delivery</h3>
            <p className="text-gray-300">Get your orders delivered in record time.</p>
          </div>
          <div className="p-6 bg-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold mb-3">Secure Payments</h3>
            <p className="text-gray-300">Shop with confidence using secure checkout.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      {user?.role === "admin" && (
        <section className="py-12 px-4 bg-blue-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Manage Your Store</h2>
            <p className="text-lg text-gray-200 mb-6">
              Add, edit, or remove products with ease.
            </p>
            <Link
              to="/admin"
              className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 hover:scale-105 transition-all duration-300"
            >
              Go to Admin Dashboard
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-6 px-4 bg-gray-900 text-center text-gray-400">
        <p>&copy; 2025 My Store. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;