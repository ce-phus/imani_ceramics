import React, { useState } from 'react';
import { HiMenu, HiX } from 'react-icons/hi';
import { logo } from '../assets';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo on the left */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center">
              <img
                className="w-20 h-auto"
                src={logo}
                alt="Pottery Studio Logo"
              />
              {/* Optional text logo */}
              {/* <span className="ml-3 text-2xl font-bold text-gray-800">Pottery Studio</span> */}
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="/pottery-process"
              className="text-gray-700 hover:text-gray-900 font-medium transition duration-150 ease-in-out"
            >
              Pottery Process
            </a>
            <a
              href="/booking"
              className="text-gray-700 hover:text-gray-900 font-medium transition duration-150 ease-in-out"
            >
              Booking
            </a>
            <a
              href="/booking-policy"
              className="text-gray-700 hover:text-gray-900 font-medium transition duration-150 ease-in-out"
            >
              Booking Policy
            </a>
            <a
              href="/packages"
              className="text-gray-700 hover:text-gray-900 font-medium transition duration-150 ease-in-out"
            >
              Packages
            </a>
            <a
              href="/qa"
              className="text-gray-700 hover:text-gray-900 font-medium transition duration-150 ease-in-out"
            >
              Q/A
            </a>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <HiX className="h-7 w-7" />
              ) : (
                <HiMenu className="h-7 w-7" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a
              href="/pottery-process"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition"
              onClick={() => setIsOpen(false)}
            >
              Pottery Process
            </a>
            <a
              href="/booking"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition"
              onClick={() => setIsOpen(false)}
            >
              Booking
            </a>
            <a
              href="/booking-policy"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition"
              onClick={() => setIsOpen(false)}
            >
              Booking Policy
            </a>
            <a
              href="/packages"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition"
              onClick={() => setIsOpen(false)}
            >
              Packages
            </a>
            <a
              href="/qa"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition"
              onClick={() => setIsOpen(false)}
            >
              Q/A
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;