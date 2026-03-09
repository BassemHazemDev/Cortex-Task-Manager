import React from "react";
import { useTasks } from "../../contexts/TaskContext";
import { useDateRefresh } from "../../hooks/useDateRefresh";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertCircle } from "lucide-react";
import { isOverdue } from "../../utils/dateUtils";

const OverviewCard = () => {
  const { tasks, getPendingTasks, getCompletedTasks } = useTasks();
  const { now } = useDateRefresh();

  const getOverdueTasks = () => {
    return tasks.filter((task) => isOverdue(task, now));
  };

  return (
    <Card
      className={`bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm hover:scale-[1.02] hover:shadow-lg transition-all duration-300 sidebar-overview`}
    >
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          <span>Overview</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Pending Tasks</span>
            <Badge variant="outline" className="font-semibold">
              {getPendingTasks().length}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Completed Tasks
            </span>
            <Badge variant="outline" className="font-semibold">
              {getCompletedTasks().length}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Overdue Tasks</span>
            <Badge
              variant={
                getOverdueTasks().length > 0 ? "destructive" : "outline"
              }
              className="font-semibold"
            >
              {getOverdueTasks().length}
            </Badge>
          </div>
          <div className="pt-2 border-t border-border/50">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Tasks</span>
              <Badge variant="default" className="font-semibold">
                {tasks.length}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OverviewCard;
