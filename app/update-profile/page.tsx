"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function UpdateProfile() {
  const [characterName, setCharacterName] = useState("");
  const [cid, setCid] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { update } = useSession();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const logoVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/users/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ characterName, cid }),
      });

      if (res.ok) {
        await update();
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push("/");
        router.refresh();
      } else {
        const { error } = await res.json();
        setError(error || "An error occurred");
      }
    } catch {
      setError("Failed to update profile");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black p-4 relative overflow-hidden">
      {/* Animated background elements - Gears and Tools */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gear animations */}
        <div className="absolute top-20 -left-20 w-80 h-80 border-[16px] border-orange-500/20 rounded-full animate-spin-slow"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 border-[20px] border-orange-600/20 rounded-full animate-spin-reverse-slow"></div>
        
        {/* Tool outlines */}
        <div className="absolute top-1/4 right-10 w-20 h-20 border-2 border-orange-500/20 transform rotate-45 animate-float"></div>
        <div className="absolute bottom-1/4 left-10 w-16 h-16 border-2 border-orange-400/20 transform -rotate-12 animate-float-delay"></div>
        
        {/* Garage texture */}
        <div className="absolute inset-0 bg-[url('/images/garage-texture.png')] opacity-5"></div>
      </div>

      <AnimatePresence>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative px-8 py-12 bg-zinc-900/80 backdrop-blur-xl rounded-3xl max-w-lg w-full border-2 border-orange-500/30 shadow-[0_0_50px_rgba(251,146,60,0.15)] overflow-hidden"
        >
          {/* Decorative corner brackets */}
          <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-orange-500/40 rounded-tl-xl"></div>
          <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 border-orange-500/40 rounded-tr-xl"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 border-orange-500/40 rounded-bl-xl"></div>
          <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-orange-500/40 rounded-br-xl"></div>

          {/* Logo with gear background */}
          <motion.div
            variants={logoVariants}
            className="flex justify-center mb-8 relative"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 border-8 border-orange-500/20 rounded-full animate-spin-slow"></div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-1 rounded-full shadow-[0_0_30px_rgba(251,146,60,0.3)] relative z-10">
              <div className="bg-black p-3 rounded-full">
                <Image
                  src="/images/logo.png"
                  alt="Logo"
                  width={100}
                  height={100}
                  className="rounded-full hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3 relative z-10">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-center mb-2 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text px-4"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Enter Your Details
            </motion.h1>
            <motion.p 
              className="text-center text-orange-200/80 mb-8 text-lg"
              variants={itemVariants}
            >
              Please provide your information to continue
            </motion.p>
          </motion.div>

          <motion.form 
            variants={itemVariants} 
            onSubmit={handleSubmit}
            className="space-y-6 relative z-10"
          >
            <motion.div variants={itemVariants}>
              <label
                htmlFor="characterName"
                className="block text-lg font-medium text-orange-200/90 mb-2"
              >
                Name
              </label>
              <div className="relative">
                <input
                  id="characterName"
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900/50 border border-orange-500/30 rounded-xl text-orange-100 placeholder-orange-200/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your name"
                  required
                />
                <div className="absolute inset-0 bg-[url('/images/metal-texture.png')] opacity-5 pointer-events-none rounded-xl"></div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label 
                htmlFor="cid" 
                className="block text-lg font-medium text-orange-200/90 mb-2"
              >
                CID
              </label>
              <div className="relative">
                <input
                  id="cid"
                  type="text"
                  value={cid}
                  onChange={(e) => setCid(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900/50 border border-orange-500/30 rounded-xl text-orange-100 placeholder-orange-200/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your CID"
                  required
                />
                <div className="absolute inset-0 bg-[url('/images/metal-texture.png')] opacity-5 pointer-events-none rounded-xl"></div>
              </div>
            </motion.div>

            {error && (
              <motion.p 
                variants={itemVariants}
                className="text-red-400 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-8 py-4 text-lg font-semibold text-white relative overflow-hidden rounded-xl transition-all duration-300 ease-out bg-zinc-800/50 border border-orange-500/30 hover:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-[url('/images/metal-texture.png')] opacity-10"></div>
              <span className="relative">Continue</span>
            </motion.button>
          </motion.form>

          <motion.div 
            variants={itemVariants}
            className="mt-8 text-center space-y-4 relative z-10"
          >
            <div className="pt-2 border-t border-orange-500/20">
              <motion.p 
                className="text-xs text-orange-200/40 font-medium tracking-wider"
                whileHover={{ opacity: 0.8 }}
              >
                Created By <span className="bg-gradient-to-r from-orange-400 to-orange-500 text-transparent bg-clip-text font-bold">PSD</span>
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

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
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-spin-reverse-slow {
          animation: spin-reverse-slow 25s linear infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delay {
          animation: float-delay 5s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
