/**
 * @module MobileNav
 * 
 * Bottom navigation bar for mobile devices.
 * Provides quick access to main views and add task action.
 * Hidden on desktop (lg breakpoint and above).
 */

import { memo } from 'react';
import { Calendar, CheckCircle, Sparkles, Plus, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import haptics from '../utils/haptics';

/**
 * Navigation button component
 */
function NavButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={() => {
        haptics.light();
        onClick();
      }}
      className={`flex flex-col items-center justify-center px-1 py-1 rounded-lg transition-all duration-200 min-w-[3.5rem] ${
        active 
          ? 'text-primary bg-primary/10' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      }`}
    >
      <span className={`transition-transform ${active ? 'scale-110' : ''}`}>
        {icon}
      </span>
      <span className={`text-[10px] mt-1 font-medium ${active ? 'text-primary' : ''}`}>
        {label}
      </span>
    </button>
  );
}

/**
 * Floating action button for adding tasks
 */
function FloatingAddButton({ onClick }) {
  return (
    <motion.button
      onClick={() => {
        haptics.medium();
        onClick();
      }}
      className="w-14 h-14 -mt-7 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-10"
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Plus className="h-6 w-6" />
    </motion.button>
  );
}

/**
 * MobileNav component
 * Bottom navigation bar for mobile devices
 * 
 * @param {Object} props
 * @param {string} props.currentView - Currently active view
 * @param {Function} props.setCurrentView - View change handler
 * @param {Function} props.onAddTask - Add task handler
 * @param {Function} props.onOpenSettings - Settings handler
 */
function MobileNav({ 
  currentView, 
  setCurrentView, 
  onAddTask, 
  onOpenSettings 
}) {
  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 lg:hidden safe-area-bottom pb-2"
    >
      <div className="flex justify-between items-end h-16 px-4 w-full mx-auto pb-2">
        <NavButton
          icon={<Calendar className="h-5 w-5" />}
          label="Calendar"
          active={currentView === 'calendar'}
          onClick={() => setCurrentView('calendar')}
        />
        
        <NavButton
          icon={<CheckCircle className="h-5 w-5" />}
          label="Tasks"
          active={currentView === 'tasks'}
          onClick={() => setCurrentView('tasks')}
        />
        
        <div className="flex justify-center items-end px-2">
            <FloatingAddButton onClick={onAddTask} />
        </div>
        
        <NavButton
          icon={<Sparkles className="h-5 w-5" />}
          label="Schedule"
          active={currentView === 'scheduler'}
          onClick={() => setCurrentView('scheduler')}
        />
        
        <NavButton
          icon={<BarChart2 className="h-5 w-5" />}
          label="Stats"
          active={currentView === 'statistics'}
          onClick={() => setCurrentView('statistics')}
        />
      </div>
    </motion.nav>
  );
}

export default memo(MobileNav);
