import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="fixed inset-0 z-50 serene-gradient flex items-center justify-center p-4">
      {/* Background decorative shapes */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1 }}
        className="absolute w-[500px] h-[500px] rounded-full bg-primary blur-[100px] -top-20 -left-20"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="absolute w-[400px] h-[400px] rounded-full bg-secondary blur-[80px] bottom-0 right-0"
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center relative z-10"
      >
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-gray-100 dark:border-gray-800">
          <div className="flex justify-center mb-8">
            <div className="p-6 bg-destructive/10 rounded-full">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
          </div>
          
          <motion.h1 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-8xl font-bold mb-2 bg-gradient-to-r from-destructive to-destructive/60 bg-clip-text text-transparent"
          >
            404
          </motion.h1>
          <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col gap-3">
            <Link to="/calendar">
              <Button size="lg" className="w-full text-lg">
                <Home className="h-5 w-5 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="lg" className="w-full text-lg">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
