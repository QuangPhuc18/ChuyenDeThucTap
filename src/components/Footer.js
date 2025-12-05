'use client'

import { Twitter, Instagram, Facebook, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-neutral-800 text-gray-300">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
          {/* Logo Section */}
          <div className="md:col-span-1">
            <h2 className="text-white text-2xl font-serif italic mb-4">Coffee</h2>
          </div>

          {/* Privacy Section */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase mb-4 tracking-wider">
              PRIVACY
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition">
                  Terms of use
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Privacy policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Cookies
                </a>
              </li>
            </ul>
          </div>

          {/* Services Section */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase mb-4 tracking-wider">
              SERVICES
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition">
                  Shop
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Order ahead
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Menu
                </a>
              </li>
            </ul>
          </div>

          {/* About Us Section */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase mb-4 tracking-wider">
              ABOUT US
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition">
                  Find a location
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  About us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Out story
                </a>
              </li>
            </ul>
          </div>

          {/* Info/Nation Section */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase mb-4 tracking-wider">
              INFOTNATION
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition">
                  Plans & pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Sell your products
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Jobs
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media Section */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase mb-4 tracking-wider">
              SOCIAL MEDIA
            </h3>
            <div className="flex gap-3">
              <a 
                href="#" 
                className="hover:text-white transition"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="hover:text-white transition"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="hover:text-white transition"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="hover:text-white transition"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-neutral-700">
        <div className="container mx-auto px-6 py-4">
          <p className="text-sm text-gray-400 text-center">
            © {new Date().getFullYear()} Coffee. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}