// components/ui/loading-spinner.tsx

import { motion } from "framer-motion";
import { Crop } from "lucide-react";
import IridescentIcon from "@/components/ui/iridescent-icon";

interface LoadingSpinnerProps {
  message: string;
}

export const LoadingSpinner = ({ message }: LoadingSpinnerProps) => (
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
      <p className="text-sm text-muted-foreground">This may take a moment...</p>
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