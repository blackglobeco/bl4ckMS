"use client";
import { motion } from "framer-motion";
import Home from "@/components/Home";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Home />
        </motion.div>
      </motion.div>
    </div>
  );
}
