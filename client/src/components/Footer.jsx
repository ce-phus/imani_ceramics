import React from 'react';
import { logo } from '../assets';
import { MdMarkEmailUnread } from 'react-icons/md';
import { AiFillInstagram } from 'react-icons/ai';
import { BsTwitterX } from 'react-icons/bs';
import { FaFacebookF } from 'react-icons/fa';
import { PiYoutubeLogoFill } from "react-icons/pi";
import { Link } from 'react-router-dom';
import { 
  FaWheelchair, 
  FaHands, 
  FaPalette, 
  FaClock,
  FaCalendarAlt,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaInstagram,
  FaFacebook,
  FaEnvelope
} from 'react-icons/fa';

const socials = [
  {
    id: '0',
    title: 'Instagram',
    icon: AiFillInstagram,
    url: '#',
  },
  {
    id: '1',
    title: 'Twitter',
    icon: BsTwitterX,
    url: '#',
  },
  {
    id: '2',
    title: 'Facebook',
    icon: FaFacebookF,
    url: '#',
  },
  {
    id: '3',
    title: 'YouTube',
    icon: PiYoutubeLogoFill,
    url: '#',
  },
];

const Footer = () => {
  return (
      <section className="py-16 px-4 bg-ceramic-800 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-2xl font-display font-bold mb-6">Imani Ceramic Studio</h3>
              <p className="text-ceramic-200 mb-6">
                Where creativity meets clay. Book your hands-on pottery experience today.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-ceramic-200 hover:text-white transition-colors">
                  <FaInstagram size={24} />
                </a>
                <a href="#" className="text-ceramic-200 hover:text-white transition-colors">
                  <FaFacebook size={24} />
                </a>
                <a href="#" className="text-ceramic-200 hover:text-white transition-colors">
                  <FaEnvelope size={24} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li><Link to="/packages" className="text-ceramic-200 hover:text-white transition-colors">Packages</Link></li>
                <li><Link to="/booking" className="text-ceramic-200 hover:text-white transition-colors">Book Now</Link></li>
                <li><Link to="/booking-history" className="text-ceramic-200 hover:text-white transition-colors">Booking History</Link></li>
                <li><Link to="/pricing" className="text-ceramic-200 hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-6">Contact Info</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-ceramic-200">
                  <FaPhoneAlt />
                  <span>+254 762 196 696 (WhatsApp)</span>
                </div>
                <div className="flex items-center gap-3 text-ceramic-200">
                  <FaMapMarkerAlt />
                  <span>Nairobi, Kenya</span>
                </div>
                <div className="flex items-center gap-3 text-ceramic-200">
                  <FaClock />
                  <span>Mon-Sun: 8AM - 6PM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-ceramic-700 mt-12 pt-8 text-center text-ceramic-400">
            <p>© {new Date().getFullYear()} Imani Ceramic Studio. All rights reserved.</p>
            <p className="text-sm mt-2">Stay Calm and Potter With Imani Ceramic</p>
          </div>
        </div>
      </section>
  );
};

export default Footer;