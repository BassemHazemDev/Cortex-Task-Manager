import React from "react";
import { useApp } from "../../contexts/AppContext";
import { useTasks } from "../../contexts/TaskContext";
import { useTodos } from "../../contexts/TodoContext";
import { Button } from "../ui/button";
import { Keyboard, Upload, Download, Plus, Settings, Moon, Sun } from "lucide-react";
import { importAllData, importICS, exportAllData } from "../../utils/storage";
import { useIsMobile } from "../../hooks/use-mobile";

const Header = ({
  onOpenShortcuts,
  onOpenSettings,
  onAddTask,
}) => {
  const {
    isDarkMode,
    toggleDarkMode,
    showNotification,
  } = useApp();
  const { tasks, setTasks } = useTasks();
  const { setTodos } = useTodos();
  const isMobile = useIsMobile();

  const handleExportTasks = async () => {
    try {
      await exportAllData();
      showNotification({
        type: "success",
        message: "Tasks & TODOs exported successfully",
        details: "Your data has been downloaded as a JSON file",
      });
    } catch (error) {
      showNotification({
        type: "error",
        message: "Export failed",
        details: "Failed to export data from database.",
      });
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showNotification({
        type: "error",
        message: "File too large",
        details: "Please select a file smaller than 5MB.",
      });
      e.target.value = "";
      return;
    }
    const name = file.name.toLowerCase();
    if (name.endsWith(".json")) {
      importAllData(file)
        .then(({ tasks: importedTasks, todos: importedTodos }) => {
          setTasks(importedTasks);
          setTodos(importedTodos);
          showNotification({
            type: "success",
            message: "Data imported successfully",
            details: `${importedTasks.length} tasks and ${importedTodos.length} TODOs loaded from ${file.name}`,
          });
        })
        .catch((err) => {
          showNotification({
            type: "error",
            message: "Import failed",
            details: err.message,
          });
        });
    } else if (name.endsWith(".ics")) {
      importICS(file)
        .then(({ tasks: importedTasks, stats }) => {
          const existingKeys = new Set(
            tasks.map((t) => `${t.title}__${t.dueDate}__${t.dueTime}`)
          );
          const toAdd = importedTasks
            .filter(
              (it) =>
                !existingKeys.has(`${it.title}__${it.dueDate}__${it.dueTime}`)
            )
            .map((it) => ({
              ...it,
              id: Date.now() + Math.floor(Math.random() * 10000),
            }));
          if (toAdd.length > 0) setTasks((prev) => [...prev, ...toAdd]);

          const details =
            stats.failed > 0
              ? `${toAdd.length} events added. ${stats.failed} failed/skipped.`
              : `${toAdd.length} events added as tasks from ${file.name}`;

          showNotification({
            type: "success",
            message: "Calendar imported",
            details,
          });
        })
        .catch((err) => {
          showNotification({
            type: "error",
            message: "ICS import failed",
            details: err.message,
          });
        });
    } else {
      showNotification({
        type: "error",
        message: "Unsupported file type",
        details: "Please select a .json or .ics file.",
      });
    }
    e.target.value = "";
  };

  if (isMobile) {
    return (
      <header className="mb-6 sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b pb-4 pt-2 -mx-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-primary/10 rounded-xl">
                <img
                  src={isDarkMode ? "/cortex2.png" : "/cortex1.png"}
                  alt="Cortex"
                  className="w-6 h-6 object-contain"
                />
             </div>
             <h1 className="text-xl font-bold tracking-tight">Cortex</h1>
          </div>
          
          <div className="flex items-center space-x-4">
             <Button
                variant="ghost"
                size="icon"
                onClick={handleExportTasks}
                className="rounded-full"
                title="Export"
              >
                <Upload className="h-5 w-5" />
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json,.ics"
                  onChange={handleImportFile}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="import-file-mobile"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  title="Import"
                >
                  <Download className="h-5 w-5" />
                </Button>
              </div>

             <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="rounded-full"
            >
              {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              className="rounded-full"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
    );
  }

  // Desktop Header
  return (
    <header className="mb-8 header">
      <div className="flex items-center justify-between w-full header-content">
        <div className="flex items-center space-x-4 header-logo">
          <div className="p-3 bg-primary/10 rounded-2xl backdrop-blur-sm">
            <img
              src={isDarkMode ? "/cortex2.png" : "/cortex1.png"}
              alt="Cortex Logo"
              style={{
                width: "32px",
                height: "32px",
                objectFit: "contain",
              }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Cortex Task Manager
            </h1>
            <p className="text-muted-foreground text-lg">
              Stay organized, stay calm ✨
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3 header-controls">
          {/* Settings and Dark Mode */}
          <div className="flex items-center space-x-2 header-buttons">
            <Button
              variant="outline"
              size="sm"
              aria-label="Shortcuts"
              data-tour="shortcuts-btn"
              onClick={onOpenShortcuts}
              className="transition-all duration-300 hover:shadow-md active:scale-95 button"
            >
              <Keyboard className="h-4 w-4 mr-2" />
              Shortcuts
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="Settings"
              onClick={onOpenSettings}
              className="transition-all duration-300 hover:shadow-md active:scale-95 button"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label={
                isDarkMode ? "Switch to light mode" : "Switch to dark mode"
              }
              data-tour="theme-toggle"
              onClick={toggleDarkMode}
              className="transition-all duration-300 hover:shadow-md active:scale-95 button"
            >
              {isDarkMode ? (
                <Moon className="h-4 w-4 mr-2" />
              ) : (
                <Sun className="h-4 w-4 mr-2" />
              )}
              {isDarkMode ? "Light" : "Dark"} Mode
            </Button>
          </div>

          {/* Export/Import group */}
          <div className="flex items-center space-x-2 header-buttons">
            <Button
              onClick={handleExportTasks}
              variant="outline"
              size="sm"
              className="transition-all duration-300 hover:shadow-md active:scale-95 button"
            >
              <Upload className="h-4 w-4 mr-2" />
              Export
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json,.ics"
                onChange={handleImportFile}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="import-file"
              />
              <Button
                variant="outline"
                size="sm"
                className="transition-all duration-300 hover:shadow-md active:scale-95 button relative-button"
                asChild
              >
                <label htmlFor="import-file" className="cursor-pointer">
                  <Download className="h-4 w-4 mr-2" />
                  Import
                </label>
              </Button>
            </div>
          </div>
          {/* Add Task button */}
          <Button
            onClick={() => onAddTask()}
            data-tour="add-task"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-md active:scale-95 button"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Task
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
