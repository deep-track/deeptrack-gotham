// import React from 'react';
import Link from 'next/link';
import { Linkedin, Twitter } from 'lucide-react';



export default function Footer() {
  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          {/* Solutions Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-6">Solutions</h3>
            <nav className="flex flex-col space-y-4">
              <Link href="/image-authentication" className="text-gray-400 hover:text-white transition-colors">
                Image Authentication
              </Link>
              <Link href="/audio-authentication" className="text-gray-400 hover:text-white transition-colors">
                Audio Authentication
              </Link>
              <Link href="/text-detection" className="text-gray-400 hover:text-white transition-colors">
                Realtime Fact Checking
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                Disinformation
              </Link>
              
            </nav>
          </div>


          {/*Compliance Framework column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-6">Privacy & Compliance</h3>
            <nav className="flex flex-col space-y-4">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                SOC2 Compliance
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                GDPR
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
              Kenya Data Protection
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
              Compute on Device
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
              Privacy Secure
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-800">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2025 All Rights Reserved
          </p>

          {/* Social Media Icons */}
          <div className="flex space-x-6">
            <Link target='_blank' href="https://x.com/deeptrck" className="text-gray-400 hover:text-white transition-colors">
              <Twitter size={20} />
            </Link>
            <Link target='_blank' href="https://www.linkedin.com/company/deeptrck/" className="text-gray-400 hover:text-white transition-colors">
              <Linkedin size={20} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}