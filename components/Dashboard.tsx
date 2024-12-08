"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { 
  FaTools, 
  FaCarSide, 
  FaCogs, 
  FaUserCog, 
  FaSignOutAlt, 
  FaMoon, 
  FaSun, 
  FaBars,
  FaWrench,
  FaClipboardList,
  FaChartLine,
  FaUserFriends,
  FaChevronRight
} from "react-icons/fa";
import axios from "axios";
import Image from "next/image";
import EmployeeSalesChart from "./EmployeeSalesChart";
import SalesChart from "./SalesChart";
import ItemManagement from "./ItemManagement";
import SalesForm from "./SalesForm";
import UserManagement from "./UserManagement";

const sections = [
  { 
    name: "Mechanic Dashboard", 
    icon: FaWrench, 
    component: EmployeeSalesChart, 
    roles: ["root", "boss","manager","veteran mechanic","expert mechanic","lead mechanic","mechanic","intern mechanic"],
    description: "View your repair statistics and performance"
  },
  { 
    name: "Workshop Overview", 
    icon: FaChartLine, 
    component: SalesChart, 
    roles: ["root", "boss", "manager"],
    description: "Monitor workshop performance and analytics"
  },
  { 
    name: "Parts Inventory", 
    icon: FaCogs, 
    component: ItemManagement, 
    roles: ["root", "boss", "manager"],
    description: "Manage vehicle parts and supplies"
  },
  { 
    name: "New Repair", 
    icon: FaClipboardList, 
    component: SalesForm, 
    roles: ["root", "boss","manager","veteran mechanic","expert mechanic","lead mechanic","mechanic","intern mechanic", "employee"],
    description: "Record new vehicle repairs and services"
  },
  { 
    name: "Staff Management", 
    icon: FaUserFriends, 
    component: UserManagement, 
    roles: ["root","boss","manager"],
    description: "Manage mechanics and staff members"
  },
];

export default function Dashboard() {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [userDetails, setUserDetails] = useState<{ avatar: string; characterName: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.role) {
      const userRole = session.user.role;
      const availableSections = sections.filter(section => section.roles.includes(userRole));
      setActiveSection(availableSections[0]?.name || "");
    }
  }, [session?.user?.role]);

  useEffect(() => {
    if (session?.user?.id) {
      const fetchUser = async () => {
        try {
          const response = await axios.get(`/api/users?id=${session.user.id}`);
          const userData = response.data.find(
            (user: { discordId: string }) => user.discordId === session.user.discordId
          );
          if (userData) {
            setUserDetails({
              avatar: userData.image,
              characterName: userData.characterName,
            });
          }
        } catch (_error) {
          // Handle error silently in production
        }
      };
      fetchUser();
    }
  }, [session?.user?.id, session?.user?.discordId]);

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    setIsDarkMode(savedMode === null ? true : savedMode === "true");
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());
  };

  const ActiveComponent = sections.find((section) => {
    const userRole = session?.user?.role;
    return section.name === activeSection && userRole && section.roles.includes(userRole);
  })?.component || null;

  return (
    <div className={`flex h-screen ${
      isDarkMode 
        ? "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black via-zinc-950 to-black"
        : "bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200"
    } text-gray-100 transition-colors duration-300 relative overflow-hidden`}>
      {/* Animated Background Elements */}
      {isDarkMode && (
        <div className="fixed inset-0 pointer-events-none">
          {/* Large Rotating Gears */}
          <div className="absolute -top-20 -left-20 w-96 h-96 border-[24px] border-orange-500/20 rounded-full animate-spin-slow"></div>
          <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] border-[28px] border-orange-600/20 rounded-full animate-spin-reverse-slow"></div>
          <div className="absolute top-1/4 left-1/3 w-72 h-72 border-[20px] border-orange-400/20 rounded-full animate-spin-slow delay-150"></div>
          
          {/* Tool Outlines */}
          <div className="absolute top-20 right-40 w-28 h-28 border-3 border-orange-500/20 transform rotate-45 animate-float"></div>
          <div className="absolute bottom-40 left-20 w-24 h-24 border-3 border-orange-400/20 transform -rotate-12 animate-float-delay"></div>
          
          {/* Garage Texture */}
          <div className="absolute inset-0 bg-[url('/images/garage-texture.png')] opacity-[0.03] mix-blend-overlay"></div>
          
          {/* Gradient Overlays */}
          <div className="absolute inset-0">
            <div className="absolute -inset-[10px] top-0 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent blur-3xl"></div>
            <div className="absolute -inset-[10px] bottom-0 bg-gradient-to-t from-orange-600/10 via-transparent to-transparent blur-3xl"></div>
          </div>
          
          {/* Spark Effects */}
          <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-orange-400 rounded-full animate-spark"></div>
          <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-orange-500 rounded-full animate-spark-delay"></div>
          <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-orange-300 rounded-full animate-spark-delay-2"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed md:relative md:flex ${
        isSidebarOpen ? "flex" : "hidden"
      } w-80 h-full ${
        isDarkMode 
          ? "bg-gradient-to-b from-black via-zinc-950 to-black" 
          : "bg-gradient-to-b from-gray-50 to-white"
      } backdrop-blur-xl border-r ${
        isDarkMode ? "border-zinc-800/50" : "border-gray-200"
      } text-white flex-col justify-between z-50 transition-all duration-500 ease-in-out transform ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      } shadow-2xl shadow-orange-500/10 relative overflow-hidden`}>
        {/* Mechanic-themed decorative elements */}
        {isDarkMode && (
          <>
            {/* Rivets */}
            <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-orange-500/30 shadow-lg shadow-orange-500/20"></div>
            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-orange-500/30 shadow-lg shadow-orange-500/20"></div>
            <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-orange-500/30 shadow-lg shadow-orange-500/20"></div>
            <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-orange-500/30 shadow-lg shadow-orange-500/20"></div>
            
            {/* Diagonal stripes */}
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(251,146,60,0.05)_25%,rgba(251,146,60,0.05)_50%,transparent_50%,transparent_75%,rgba(251,146,60,0.05)_75%)] bg-[length:8px_8px]"></div>

            {/* Glowing lines */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"></div>
            
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-20 border-t-2 border-l-2 border-orange-500/20 rounded-br-xl"></div>
            <div className="absolute top-0 right-0 w-20 border-t-2 border-r-2 border-orange-500/20 rounded-bl-xl"></div>
            <div className="absolute bottom-0 left-0 w-20 border-b-2 border-l-2 border-orange-500/20 rounded-tr-xl"></div>
            <div className="absolute bottom-0 right-0 w-20 border-b-2 border-r-2 border-orange-500/20 rounded-tl-xl"></div>
          </>
        )}

        <div className="relative z-10">
          {/* Logo Section */}
          <div className="p-4">
            <div className={`flex items-center justify-center ${
              isDarkMode 
                ? "bg-gradient-to-br from-zinc-950 via-black to-zinc-950" 
                : "bg-gradient-to-br from-gray-50 to-white"
            } p-4 rounded-xl border ${
              isDarkMode 
                ? "border-orange-500/30 shadow-[0_0_30px_rgba(251,146,60,0.15)]" 
                : "border-orange-200"
            } relative overflow-hidden group hover:border-orange-500/50 transition-all duration-500`}>
              {/* Gear background */}
              <div className="absolute -right-6 -top-6 w-24 h-24 border-[8px] border-orange-500/10 rounded-full animate-spin-reverse-slow"></div>
              <div className="absolute -left-6 -bottom-6 w-24 h-24 border-[8px] border-orange-500/10 rounded-full animate-spin-slow"></div>

              {/* Animated Corner Brackets */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-orange-500/50 rounded-tl-xl transform -translate-x-full -translate-y-full group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700"></div>
              <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-orange-500/50 rounded-tr-xl transform translate-x-full -translate-y-full group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-orange-500/50 rounded-bl-xl transform -translate-x-full translate-y-full group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-orange-500/50 rounded-br-xl transform translate-x-full translate-y-full group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700"></div>

              <div className="flex items-center gap-3 relative z-10">
                <div className={`${
                  isDarkMode 
                    ? "bg-gradient-to-br from-orange-500 to-orange-600" 
                    : "bg-gradient-to-br from-orange-400 to-orange-500"
                  } p-[2px] rounded-full shadow-[0_0_20px_rgba(251,146,60,0.3)] group-hover:shadow-[0_0_30px_rgba(251,146,60,0.4)] transition-all duration-500`}>
                  <div className={`${isDarkMode ? "bg-black" : "bg-white"} p-1 rounded-full relative overflow-hidden`}>
                    {/* Metallic overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 mix-blend-overlay"></div>
                    <Image 
                      src="/images/logo.png" 
                      alt="MPRS Logo" 
                      width={40} 
                      height={40} 
                      className="rounded-full transform group-hover:scale-110 transition-transform duration-500 relative z-10" 
                    />
                  </div>
                </div>
                <h1 className={`text-2xl font-bold ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400" 
                    : "bg-gradient-to-r from-orange-500 to-orange-600"
                } text-transparent bg-clip-text tracking-tight transform group-hover:scale-110 transition-transform duration-500`}>
                  MPRS
                </h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-2">
            {sections.map((section) => {
              const userRole = session?.user?.role;
              if (!userRole || !section.roles.includes(userRole)) return null;

              return (
                <button
                  key={section.name}
                  onClick={() => {
                    setActiveSection(section.name);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg flex items-center space-x-3 transition-all duration-500 hover:scale-[1.02] relative group overflow-hidden ${
                    activeSection === section.name
                      ? isDarkMode
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_0_30px_rgba(251,146,60,0.2)]"
                        : "bg-orange-500 text-white"
                      : isDarkMode
                      ? "text-white hover:bg-zinc-900/70"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {/* Background patterns */}
                  <div className="absolute inset-0 bg-[url('/images/metal-texture.png')] opacity-[0.04] mix-blend-overlay"></div>
                  {activeSection !== section.name && (
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(251,146,60,0.03)_25%,rgba(251,146,60,0.03)_50%,transparent_50%,transparent_75%,rgba(251,146,60,0.03)_75%)] bg-[length:5px_5px]"></div>
                  )}
                  
                  {/* Hover effect overlay */}
                  <div className={`absolute inset-0 ${
                    activeSection !== section.name ? "bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 opacity-0 group-hover:opacity-20" : ""
                  } transition-opacity duration-500`}></div>

                  {/* Side accent */}
                  <div className={`absolute left-0 top-0 h-full w-1 ${
                    activeSection === section.name
                      ? "bg-white"
                      : "bg-orange-500/30 group-hover:bg-orange-500/50"
                  } transition-colors duration-300`}></div>

                  {/* Icon with glow effect */}
                  <div className="relative">
                    <div className={`absolute inset-0 ${
                      activeSection === section.name
                        ? "bg-white"
                        : "bg-orange-500"
                    } blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
                    <section.icon className={`w-5 h-5 relative z-10 ${
                      activeSection === section.name ? "text-white" : "text-orange-500"
                    } group-hover:scale-110 transition-transform duration-300`} />
                  </div>

                  {/* Text content */}
                  <div className="flex-1 text-left relative z-10">
                    <div className={`font-semibold text-base ${
                      isDarkMode ? "text-white" : "text-gray-700"
                    }`}>
                      {section.name}
                    </div>
                  </div>

                  {/* Animated arrow */}
                  <div className={`transform transition-transform duration-300 ${
                    activeSection === section.name ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                  }`}>
                    <FaChevronRight className={`w-4 h-4 ${
                      activeSection === section.name ? "text-white" : "text-orange-500"
                    }`} />
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className={`p-6 ${
          isDarkMode ? "border-t border-zinc-800/50" : "border-t border-gray-200"
        } relative`}>
          {/* Footer accent */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"></div>
          
          <div className="text-center relative">
            <p className={`text-sm font-medium ${
              isDarkMode ? "text-white" : "text-gray-600"
            } hover:scale-110 transition-transform duration-300`}>
              Created By{" "}
              <span className="bg-gradient-to-r from-orange-400 to-orange-500 text-transparent bg-clip-text font-bold">
                PSD
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <div className={`${
          isDarkMode ? "bg-gradient-to-r from-black via-zinc-950 to-black" : "bg-white/50"
        } backdrop-blur-xl border-b ${
          isDarkMode ? "border-zinc-800/50" : "border-gray-200"
        } p-4 flex justify-between items-center shadow-lg relative overflow-hidden`}>
          {/* Mechanic-themed decorative elements */}
          {isDarkMode && (
            <>
              {/* Rivets */}
              <div className="absolute top-2 left-4 w-1.5 h-1.5 rounded-full bg-orange-500/30 shadow-lg shadow-orange-500/20"></div>
              <div className="absolute top-2 right-4 w-1.5 h-1.5 rounded-full bg-orange-500/30 shadow-lg shadow-orange-500/20"></div>
              <div className="absolute bottom-2 left-4 w-1.5 h-1.5 rounded-full bg-orange-500/30 shadow-lg shadow-orange-500/20"></div>
              <div className="absolute bottom-2 right-4 w-1.5 h-1.5 rounded-full bg-orange-500/30 shadow-lg shadow-orange-500/20"></div>

              {/* Diagonal stripes */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(251,146,60,0.03)_25%,rgba(251,146,60,0.03)_50%,transparent_50%,transparent_75%,rgba(251,146,60,0.03)_75%)] bg-[length:6px_6px]"></div>

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-16 border-t-2 border-l-2 border-orange-500/20 rounded-br-lg"></div>
              <div className="absolute top-0 right-0 w-16 border-t-2 border-r-2 border-orange-500/20 rounded-bl-lg"></div>
              <div className="absolute bottom-0 left-0 w-16 border-b-2 border-l-2 border-orange-500/20 rounded-tr-lg"></div>
              <div className="absolute bottom-0 right-0 w-16 border-b-2 border-r-2 border-orange-500/20 rounded-tl-lg"></div>

              {/* Gear accents */}
              <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-20 h-20 border-[6px] border-orange-500/5 rounded-full animate-spin-slow"></div>
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-20 h-20 border-[6px] border-orange-500/5 rounded-full animate-spin-reverse-slow"></div>
            </>
          )}

          {/* Metallic texture overlay */}
          <div className="absolute inset-0 bg-[url('/images/metal-texture.png')] opacity-[0.03] mix-blend-overlay"></div>

          <div className="flex items-center space-x-4 relative z-10">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`md:hidden p-2 rounded-lg transition-all duration-300 ${
                isDarkMode 
                  ? "text-orange-500 hover:text-orange-400 hover:bg-zinc-900/70" 
                  : "text-orange-600 hover:text-orange-500 hover:bg-gray-100"
              }`}
            >
              <FaBars className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-lg font-semibold ${
                isDarkMode 
                  ? "bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text" 
                  : "text-gray-900"
              }`}>
                {activeSection}
              </h1>
              <p className={`text-sm mt-0.5 ${
                isDarkMode ? "text-orange-300/80" : "text-gray-500"
              }`}>
                {sections.find(section => section.name === activeSection)?.description}
              </p>
            </div>
          </div>

          {/* User Profile and Theme Toggle */}
          <div className="flex items-center space-x-3 relative z-10">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg flex items-center space-x-2 transition-all duration-300 ${
                isDarkMode 
                  ? "text-orange-400 hover:text-orange-300 hover:bg-zinc-900/70" 
                  : "text-orange-600 hover:text-orange-500 hover:bg-gray-100"
              } relative group`}
            >
              {isDarkMode ? (
                <FaSun className="w-5 h-5 relative z-10" />
              ) : (
                <FaMoon className="w-5 h-5 relative z-10" />
              )}
              <div className="absolute inset-0 bg-orange-500 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-300"></div>
            </button>

            {userDetails && (
              <div className="flex items-center space-x-3">
                <div className="relative w-8 h-8 flex-shrink-0 transform hover:scale-110 transition-transform duration-300">
                  <div className={`absolute inset-0 ${
                    isDarkMode 
                      ? "bg-gradient-to-br from-orange-500 to-orange-600" 
                      : "bg-gradient-to-br from-orange-400 to-orange-500"
                  } rounded-full blur-sm opacity-70 group-hover:opacity-90 transition-opacity duration-300`}></div>
                  <Image
                    src={userDetails.avatar}
                    alt="User Avatar"
                    fill
                    className="rounded-full object-cover ring-2 ring-orange-500/70 hover:ring-orange-500 transition-all duration-300 relative z-10"
                  />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <div className={`font-bold tracking-wide ${
                    isDarkMode 
                      ? "bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text" 
                      : "text-gray-900"
                  } transform hover:scale-105 transition-transform duration-300 relative group`}>
                    {userDetails.characterName}
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300"></div>
                  </div>
                  <div className={`text-xs font-medium ${
                    isDarkMode 
                      ? "text-orange-500/90" 
                      : "text-orange-600/90"
                  } uppercase tracking-wider`}>
                    {session?.user?.role && 
                      session.user.role.charAt(0).toUpperCase() + session.user.role.slice(1)
                    }
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => signOut()}
              className={`p-2 rounded-lg flex items-center space-x-2 transition-all duration-300 ${
                isDarkMode 
                  ? "text-orange-400 hover:text-orange-300 hover:bg-zinc-900/70" 
                  : "text-orange-600 hover:text-orange-500 hover:bg-gray-100"
              } relative group`}
            >
              <FaSignOutAlt className="w-5 h-5 relative z-10" />
              <div className="absolute inset-0 bg-orange-500 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-300"></div>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {ActiveComponent && (
            <div className={`${
              isDarkMode ? "bg-black/90" : "bg-white/50"
            } backdrop-blur-xl rounded-xl border ${
              isDarkMode ? "border-zinc-800/50" : "border-gray-200"
            } p-6 shadow-xl transition-all duration-300 relative overflow-hidden group hover:shadow-orange-500/5`}>
              {/* Metallic texture overlay */}
              <div className="absolute inset-0 bg-[url('/images/metal-texture.png')] opacity-[0.03] mix-blend-overlay"></div>
              
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-orange-500/30 rounded-tl-xl"></div>
              <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-orange-500/30 rounded-tr-xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-orange-500/30 rounded-bl-xl"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-orange-500/30 rounded-br-xl"></div>

              <div className="relative z-10">
                <ActiveComponent />
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse-slow {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(45deg); }
          50% { transform: translateY(-20px) rotate(45deg); }
        }
        @keyframes float-delay {
          0%, 100% { transform: translateY(0) rotate(-12deg); }
          50% { transform: translateY(-15px) rotate(-12deg); }
        }
        @keyframes spark {
          0%, 100% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1); opacity: 1; }
        }
        .animate-spin-slow {
          animation: spin-slow 25s linear infinite;
        }
        .animate-spin-reverse-slow {
          animation: spin-reverse-slow 30s linear infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delay {
          animation: float-delay 5s ease-in-out infinite;
          animation-delay: 1s;
        }
        .animate-spark {
          animation: spark 2s ease-in-out infinite;
        }
        .animate-spark-delay {
          animation: spark 2s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        .animate-spark-delay-2 {
          animation: spark 2s ease-in-out infinite;
          animation-delay: 1s;
        }
        .delay-150 {
          animation-delay: 150ms;
        }
      `}</style>
    </div>
  );
}