import React from "react";
import { Button } from "../ui/button";
import { useApp } from "../../contexts/AppContext";
import { Calendar, CheckCircle, Sparkles, BarChart2, Expand, ChevronsDownUp } from "lucide-react";
import { useIsMobile } from "../../hooks/use-mobile";

const NavigationTabs = ({ currentView, setCurrentView }) => {
  const { calendarExpanded, setCalendarExpanded } = useApp();
  const isMobile = useIsMobile();

  return (
    <div className="flex space-x-2 mb-8 navigation-container items-center relative">
      <div className="flex space-x-2 navigation-inner">
        <Button
          variant={currentView === "calendar" ? "default" : "outline"}
          onClick={() => setCurrentView("calendar")}
          className="flex items-center space-x-2 transition-all duration-300 hover:shadow-md active:scale-95 calendar-button"
        >
          <Calendar className="h-4 w-4" />
          <span>Calendar</span>
        </Button>
        <Button
          variant={currentView === "tasks" ? "default" : "outline"}
          onClick={() => setCurrentView("tasks")}
          data-tour="tasks-tab"
          className="flex items-center space-x-2 transition-all duration-300 hover:shadow-md active:scale-95"
        >
          <CheckCircle className="h-4 w-4" />
          <span>Tasks</span>
        </Button>
      </div>
      <Button
        variant={currentView === "scheduler" ? "default" : "outline"}
        onClick={() => setCurrentView("scheduler")}
        data-tour="scheduler-tab"
        className="flex items-center space-x-2 transition-all duration-300 hover:shadow-md active:scale-95"
      >
        <Sparkles className="h-4 w-4" />
        <span>Smart Scheduler</span>
      </Button>
      <Button
        variant={currentView === "statistics" ? "default" : "outline"}
        onClick={() => setCurrentView("statistics")}
        data-tour="statistics-tab"
        className="flex items-center space-x-2 transition-all duration-300 hover:shadow-md active:scale-95"
      >
        <BarChart2 className="h-4 w-4" />
        <span>Statistics</span>
      </Button>
      {/* Expand/Collapse Calendar Button (Desktop only, right aligned, icon with hover text) */}
      {!isMobile && currentView === "calendar" && (
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
