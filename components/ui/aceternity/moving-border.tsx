import { cn } from "@/utils/cn";
import { motion } from "framer-motion";

export const MovingBorder = ({
  children,
  duration = 2000,
  rx = "20px",
  className,
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative w-fit h-fit flex items-center justify-center",
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-sky-500 to-pink-500">
          <div className="absolute inset-px bg-black" />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-gradient-to-r from-violet-600 via-sky-500 to-pink-500"
          style={{
            WebkitMaskImage: `radial-gradient(circle at 50% 50%, transparent 15%, black 60%)`,
          }}
        >
          <svg className="absolute h-full w-full">
            <rect
              width="100%"
              height="100%"
              rx={rx}
              fill="none"
              stroke="url(#border-gradient)"
              strokeWidth="2"
              strokeDasharray="8,8"
              strokeDashoffset="0"
            >
              <animate
                attributeName="stroke-dashoffset"
                dur={`${duration}ms`}
                repeatCount="indefinite"
                values="0;-32"
              />
            </rect>
            <defs>
              <linearGradient id="border-gradient" gradientTransform="rotate(90)">
                <stop stopColor="#7c3aed" />
                <stop offset="0.5" stopColor="#0ea5e9" />
                <stop offset="1" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
        <div className="relative">{children}</div>
      </motion.div>
    </div>
  );
}; 