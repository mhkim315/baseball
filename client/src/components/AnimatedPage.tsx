import { motion } from "framer-motion";

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

const variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
