import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); // State for mobile menu toggle

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Brand Logo */}
        <Link
          to="/"
          className="text-2xl font-extrabold tracking-tight hover:text-blue-200 transition-colors duration-200"
        >
          My Store
        </Link>

        {/* Hamburger Menu Button (Mobile) */}
        <button
          className="md:hidden text-3xl focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? "✕" : "☰"}
        </button>

        {/* Navigation Links */}
        <div
          className={`${
            isOpen ? "flex" : "hidden"
          } md:flex flex-col md:flex-row items-center gap-6 absolute md:static top-16 left-0 right-0 bg-blue-800 md:bg-transparent p-4 md:p-0 transition-all duration-300 ease-in-out`}
        >
          <Link
            to="/"
            className="text-lg font-medium hover:text-blue-200 hover:scale-105 transform transition-all duration-200"
            onClick={() => setIsOpen(false)} // Close menu on click (mobile)
          >
            Products
          </Link>
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="text-lg font-medium hover:text-blue-200 hover:scale-105 transform transition-all duration-200"
              onClick={() => setIsOpen(false)}
            >
              Admin Dashboard
            </Link>
          )}
          {user ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-2 rounded-lg font-semibold text-white hover:bg-red-600 hover:shadow-md transition-all duration-200"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-green-500 px-4 py-2 rounded-lg font-semibold text-white hover:bg-green-600 hover:shadow-md transition-all duration-200"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;