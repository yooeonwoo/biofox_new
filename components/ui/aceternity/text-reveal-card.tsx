"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const TextRevealCard = ({
  text,
  revealText,
  children,
  className,
}: {
  text: string;
  revealText: string;
  children?: React.ReactNode;
  className?: string;
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        ease: "easeInOut",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "w-full bg-transparent backdrop-blur-sm p-8",
        className
      )}
    >
      <div className="mx-auto max-w-7xl">
        <motion.div 
          className="flex flex-col items-center justify-center gap-4"
          initial={{ opacity: 0.0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.8,
            ease: "easeInOut",
          }}
        >
          {children}

          <motion.div
            className="relative h-24 w-full overflow-hidden flex items-center justify-center"
          >
            <motion.span
              initial={{ opacity: 1, y: 0 }}
              animate={{ 
                opacity: isHovered ? 0 : 1,
                y: isHovered ? -20 : 0,
              }}
              transition={{
                duration: 0.5,
                ease: "easeInOut",
              }}
              className="absolute text-4xl md:text-7xl font-bold text-white tracking-tighter"
            >
              {text}
            </motion.span>

            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: isHovered ? 1 : 0,
                y: isHovered ? 0 : 20,
              }}
              transition={{
                duration: 0.5,
                ease: "easeInOut",
              }}
              className="absolute text-4xl md:text-7xl font-bold bg-gradient-to-r from-aurora-pink via-aurora-violet to-aurora-blue bg-clip-text text-transparent tracking-tighter"
            >
              {revealText}
            </motion.span>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export const TextRevealCardTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.h2 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.1,
        duration: 0.8,
        ease: "easeInOut",
      }}
      className={cn("text-2xl md:text-4xl font-bold text-neutral-200", className)}
    >
      {children}
    </motion.h2>
  );
};

export const TextRevealCardDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.p 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.2,
        duration: 0.8,
        ease: "easeInOut",
      }}
      className={cn("text-base md:text-4xl font-extralight text-neutral-200", className)}
    >
      {children}
    </motion.p>
  );
}; 