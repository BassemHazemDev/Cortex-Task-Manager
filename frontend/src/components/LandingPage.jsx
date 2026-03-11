import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Sparkles, BarChart2, ArrowRight, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

export default function LandingPage() {
  const { user } = useApp();
  const navigate = useNavigate();

  if (user) {
    return (
      <div className="min-h-screen serene-gradient flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
            <div className="p-4 bg-primary/10 rounded-2xl inline-block mb-4">
              <img
                src="/cortex1.png"
                alt="Cortex"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Cortex</h1>
            <p className="text-muted-foreground mb-8">
              You're already signed in!
            </p>
            <Button onClick={() => navigate('/calendar')} className="w-full" size="lg">
              <ArrowRight className="h-5 w-5 mr-2" />
              Go to App
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const features = [
    {
      icon: <Calendar className="h-6 w-6" />,
      title: 'Drag & Drop Calendar',
      description: 'Easily organize your schedule with intuitive drag and drop functionality',
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: 'Smart Scheduler',
      description: 'Automatically schedule tasks based on duration and priority to eliminate guesswork',
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: 'Recurring Tasks',
      description: 'Set up daily, weekly, or monthly repeating tasks to build lasting habits',
    },
    {
      icon: <BarChart2 className="h-6 w-6" />,
      title: 'Statistics & Insights',
      description: 'Track your productivity and execution rate with detailed visual insights',
    },
  ];

  return (
    <div className="min-h-screen serene-gradient">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <img
                src="/cortex1.png"
                alt="Cortex"
                className="w-10 h-10 object-contain"
              />
            </div>
            <span className="text-2xl font-bold">Cortex</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Stay Organized, Stay Calm
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Cortex is your intelligent task manager that helps you plan, schedule, and complete tasks with ease. 
            Experience the serenity of perfect organization.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link to="/signup">
              <Button size="lg" className="text-lg px-8">
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-3 bg-primary/10 rounded-xl inline-block mb-4 text-primary">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 border border-gray-100 dark:border-gray-800">
            <h2 className="text-3xl font-bold mb-4">Ready to get organized?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of users who have transformed their productivity with Cortex. 
              Start your free account today.
            </p>
            <Link to="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="mt-20 text-center text-muted-foreground text-sm">
          <p>© 2024 Cortex Task Manager. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
