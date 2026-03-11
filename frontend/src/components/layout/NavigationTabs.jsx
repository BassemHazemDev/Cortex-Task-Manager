import React from "react";
import { NavLink } from "react-router-dom";
import { Button } from "../ui/button";
import { useApp } from "../../contexts/AppContext";
import { Calendar, CheckCircle, Sparkles, BarChart2, Expand, ChevronsDownUp } from "lucide-react";
import { useIsMobile } from "../../hooks/use-mobile";
import { useLocation } from "react-router-dom";

const NavigationTabs = ({ currentView, setCurrentView }) => {
  const { calendarExpanded, setCalendarExpanded } = useApp();
  const isMobile = useIsMobile();
  const location = useLocation();
  
  const isCalendar = location.pathname === "/";
  const isScheduler = location.pathname === "/scheduler";
  const isStatistics = location.pathname === "/statistics";

  return (
    <div className="flex space-x-2 mb-8 navigation-container items-center relative">
      <div className="flex space-x-2 navigation-inner">
        <NavLink to="/" className={({ isActive }) => isActive || isCalendar ? "inline-flex items-center space-x-2 transition-all duration-300 hover:shadow-md active:scale-95 bg-primary text-primary-foreground shadow-xs rounded-md text-sm font-medium h-9 px-4 py-2" : "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2"}>
          <Calendar className="h-4 w-4" />
          <span>Calendar</span>
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => isActive ? "inline-flex items-center space-x-2 transition-all duration-300 hover:shadow-md active:scale-95 bg-primary text-primary-foreground shadow-xs rounded-md text-sm font-medium h-9 px-4 py-2" : "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2"}>
          <CheckCircle className="h-4 w-4" />
          <span>Tasks</span>
        </NavLink>
      </div>
      <NavLink to="/scheduler" className={({ isActive }) => isActive || isScheduler ? "inline-flex items-center space-x-2 transition-all duration-300 hover:shadow-md active:scale-95 bg-primary text-primary-foreground shadow-xs rounded-md text-sm font-medium h-9 px-4 py-2" : "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2"}>
        <Sparkles className="h-4 w-4" />
        <span>Smart Scheduler</span>
      </NavLink>
      <NavLink to="/statistics" className={({ isActive }) => isActive || isStatistics ? "inline-flex items-center space-x-2 transition-all duration-300 hover:shadow-md active:scale-95 bg-primary text-primary-foreground shadow-xs rounded-md text-sm font-medium h-9 px-4 py-2" : "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2"}>
        <BarChart2 className="h-4 w-4" />
        <span>Statistics</span>
      </NavLink>
      {!isMobile && isCalendar && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Button
            variant="outline"
            size="icon"
            className="calendar-expand-btn group transition-all duration-300"
            onClick={() => setCalendarExpanded((v) => !v)}
            style={{
              position: "relative",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label={
              calendarExpanded ? "Collapse Calendar" : "Expand Calendar"
            }
          >
            {calendarExpanded ? (
              <ChevronsDownUp className="h-5 w-5" />
            ) : (
              <Expand className="h-5 w-5" />
            )}
            <span
              className="calendar-expand-text group-hover:opacity-100 opacity-0 absolute right-full top-1/2 -translate-y-1/2 mr-2 bg-card px-2 py-1 rounded shadow text-xs font-medium transition-opacity duration-300"
              style={{ whiteSpace: "nowrap", pointerEvents: "none" }}
            >
              {calendarExpanded ? "Collapse Calendar" : "Expand Calendar"}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default NavigationTabs;
