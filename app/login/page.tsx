"use client";

import { signIn } from "next-auth/react";
import { FaDiscord } from "react-icons/fa";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const handleSignIn = async () => {
    await signIn("discord", { callbackUrl: "/" });
  };

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
              Mirror Park Repair Shop
            </motion.h1>
            <motion.p 
              className="text-center text-orange-200/80 mb-8 text-lg"
              variants={itemVariants}
            >
            </motion.p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative z-10"
          >
            <button
              onClick={handleSignIn}
              className="group w-full px-8 py-4 text-lg font-semibold text-white relative overflow-hidden rounded-xl transition-all duration-300 ease-out bg-zinc-800/50 border border-orange-500/30 hover:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-[url('/images/metal-texture.png')] opacity-10"></div>
              <motion.span 
                className="relative flex items-center justify-center gap-3"
                whileHover={{ y: -2 }}
              >
                <FaDiscord className="text-2xl" />
                <span className="tracking-wide">Sign in with Discord</span>
              </motion.span>
            </button>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="mt-8 text-center space-y-4 relative z-10"
          >
            <p className="text-orange-200/60 text-sm">
              Making your work easier
            </p>
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
