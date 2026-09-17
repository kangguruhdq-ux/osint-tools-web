"use client";

import React from "react";
import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-1 min-h-screen flex flex-col"
    >
      {children}
    </motion.div>
  );
}
