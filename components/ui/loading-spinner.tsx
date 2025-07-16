// components/ui/loading-spinner.tsx

import { motion } from "framer-motion";
import { Crop, Sparkles } from "lucide-react";
import IridescentIcon from "@/components/ui/iridescent-icon";

interface LoadingSpinnerProps {
  message: string;
  variant?: "default" | "mission";
  description?: string;
}

export const LoadingSpinner = ({ 
  message, 
  variant = "default",
  description 
}: LoadingSpinnerProps) => {
  if (variant === "mission") {
    // Mission-specific variant with Sparkles and gradient background
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex flex-col items-center justify-center space-y-6 py-12"
      >
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 via-purple-500 to-rose-400 flex items-center justify-center shadow-2xl"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-white">{message}</h3>
          <motion.div 
            className="flex items-center justify-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-white/60 rounded-full"
                animate={{ 
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  delay: i * 0.2 
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Default variant with IridescentIcon
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center py-16 space-y-6"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="inline-block"
      >
        <IridescentIcon icon={Crop} className="h-16 w-16" />
      </motion.div>
      <div className="text-center space-y-2">
        <p className="text-lg font-medium">{message}</p>
        <p className="text-sm text-muted-foreground">
          {description || "This may take a moment..."}
        </p>
      </div>
      <motion.div 
        className="flex justify-center gap-1"
        initial="hidden"
        animate="visible"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary rounded-full"
            variants={{
              hidden: { opacity: 0.3 },
              visible: { opacity: 1 }
            }}
            transition={{
              repeat: Infinity,
              duration: 0.8,
              delay: i * 0.2,
              repeatType: "reverse"
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};