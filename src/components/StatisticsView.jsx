import React, { useMemo } from "react";
import { useTasks } from "../contexts/TaskContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle, Clock, AlertCircle, BarChart2, PieChart as PieIcon } from "lucide-react";
import { Pie, Bar } from "@visx/shape";
import { Group } from "@visx/group";
import { scaleOrdinal, scaleBand, scaleLinear } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { ParentSize } from "@visx/responsive";
import { pad } from "../utils/dateUtils";

// Color constants
const COLORS = {
  completed: "#22c55e", // green-500
  pending: "#eab308", // yellow-500
  overdue: "#ef4444", // red-500
  high: "#ef4444",
  medium: "#eab308",
  low: "#3b82f6",
  bar: "#8b5cf6", // violet-500
};

const StatisticsView = () => {
  const { tasks, getPendingTasks, getCompletedTasks } = useTasks();

  // Metrics
  const totalTasks = tasks.length;
  const pendingTasks = getPendingTasks();
  const completedTasks = getCompletedTasks();
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Data for Completion Pie Chart
  const statusData = useMemo(() => {
    return [
      { label: "Completed", value: completedTasks.length, color: COLORS.completed },
      { label: "Pending", value: pendingTasks.length, color: COLORS.pending },
    ].filter(d => d.value > 0);
  }, [completedTasks.length, pendingTasks.length]);

  // Data for Priority Breakdown
  const priorityData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    tasks.forEach(t => {
      if (t.priority && counts[t.priority] !== undefined) {
        counts[t.priority]++;
      }
    });
    return [
      { label: "High", value: counts.high, color: COLORS.high },
      { label: "Medium", value: counts.medium, color: COLORS.medium },
      { label: "Low", value: counts.low, color: COLORS.low },
    ].filter(d => d.value > 0);
  }, [tasks]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-2xl">
            <BarChart2 className="h-6 w-6 text-primary" />
        </div>
        <div>
            <h2 className="text-2xl font-bold">Productivity Statistics</h2>
            <p className="text-muted-foreground">Track your progress and performance</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/80 backdrop-blur-sm border-2 border-primary/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
              <h3 className="text-3xl font-bold mt-1">{totalTasks}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <PieIcon className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-2 border-green-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
              <h3 className="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">{completionRate}%</h3>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-2 border-yellow-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <h3 className="text-3xl font-bold mt-1 text-yellow-600 dark:text-yellow-400">{pendingTasks.length}</h3>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-full">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-2 border-primary/10">
           <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">High Priority</p>
              <h3 className="text-3xl font-bold mt-1">{priorityData.find(d => d.label === "High")?.value || 0}</h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-full">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completion Status Pie Chart */}
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {totalTasks === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                    No tasks available
                </div>
            ) : (
                <ParentSize>
                {({ width, height }) => {
                    const radius = Math.min(width, height) / 2;
                    const centerY = height / 2;
                    const centerX = width / 2;
                    return (
                        <svg width={width} height={height}>
                            <Group top={centerY} left={centerX}>
                                <Pie
                                    data={statusData}
                                    pieValue={d => d.value}
                                    outerRadius={radius - 20}
                                    innerRadius={radius / 2}
                                    padAngle={0.02}
                                    cornerRadius={3}
                                >
                                    {pie => {
                                        return pie.arcs.map((arc, i) => {
                                            const { label, color } = arc.data;
                                            const [centroidX, centroidY] = pie.path.centroid(arc);
                                            const hasSpaceForLabel = arc.endAngle - arc.startAngle > 0.1;
                                            return (
                                                <g key={`arc-${label}-${i}`}>
                                                    <path d={pie.path(arc)} fill={color} />
                                                    {hasSpaceForLabel && (
                                                        <text
                                                        x={centroidX}
                                                        y={centroidY}
                                                        dy=".33em"
                                                        fill="#ffffff"
                                                        fontSize={12}
                                                        textAnchor="middle"
                                                        pointerEvents="none"
                                                        fontWeight="bold"
                                                        >
                                                        {arc.data.value}
                                                        </text>
                                                    )}
                                                </g>
                                            );
                                        });
                                    }}
                                </Pie>
                            </Group>
                        </svg>
                    );
                }}
                </ParentSize>
            )}
          </CardContent>
          <div className="pb-6 flex justify-center gap-4">
              {statusData.map(d => (
                  <div key={d.label} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-sm text-muted-foreground">{d.label}</span>
                  </div>
              ))}
          </div>
        </Card>

        {/* Priority Distribution Pie Chart */}
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             {totalTasks === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                    No tasks available
                </div>
            ) : (
                <ParentSize>
                {({ width, height }) => {
                    const radius = Math.min(width, height) / 2;
                    const centerY = height / 2;
                    const centerX = width / 2;
                    return (
                        <svg width={width} height={height}>
                            <Group top={centerY} left={centerX}>
                                <Pie
                                    data={priorityData}
                                    pieValue={d => d.value}
                                    outerRadius={radius - 20}
                                    innerRadius={radius / 2}
                                    padAngle={0.02}
                                    cornerRadius={3}
                                >
                                    {pie => {
                                        return pie.arcs.map((arc, i) => {
                                            const { label, color } = arc.data;
                                            const [centroidX, centroidY] = pie.path.centroid(arc);
                                            const hasSpaceForLabel = arc.endAngle - arc.startAngle > 0.1;
                                            return (
                                                <g key={`arc-${label}-${i}`}>
                                                    <path d={pie.path(arc)} fill={color} />
                                                     {hasSpaceForLabel && (
                                                        <text
                                                        x={centroidX}
                                                        y={centroidY}
                                                        dy=".33em"
                                                        fill="#ffffff"
                                                        fontSize={12}
                                                        textAnchor="middle"
                                                        pointerEvents="none"
                                                        fontWeight="bold"
                                                        >
                                                        {arc.data.value}
                                                        </text>
                                                    )}
                                                </g>
                                            );
                                        });
                                    }}
                                </Pie>
                            </Group>
                        </svg>
                    );
                }}
                </ParentSize>
            )}
          </CardContent>
          <div className="pb-6 flex justify-center gap-4">
              {priorityData.map(d => (
                  <div key={d.label} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-sm text-muted-foreground">{d.label}</span>
                  </div>
              ))}
          </div>
        </Card>

        {/* Upcoming Workload Bar Chart */}
        <Card className="bg-card/80 backdrop-blur-sm md:col-span-2">
            <CardHeader>
                <CardTitle>Upcoming Workload (Next 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ParentSize>
                    {({ width, height }) => {
                        const xMax = width - 60;
                        const yMax = height - 50;

                        // Data
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const data = Array.from({ length: 7 }, (_, i) => {
                            const d = new Date(today);
                            d.setDate(today.getDate() + i);
                            const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                            const label = i === 0 ? "Today" : i === 1 ? "Tmrw" : d.toLocaleDateString('en-US', { weekday: 'short' });
                            
                            const count = tasks.filter(t => t.dueDate === dateStr).length;
                            return { label, count };
                        });

                        const xScale = scaleBand({
                            range: [0, xMax],
                            domain: data.map(d => d.label),
                            padding: 0.4,
                        });

                        const yScale = scaleLinear({
                            range: [yMax, 0],
                            domain: [0, Math.max(5, Math.max(...data.map(d => d.count)) + 1)],
                            nice: true,
                        });

                        return (
                            <svg width={width} height={height}>
                                <Group left={40} top={20}>
                                    <AxisBottom 
                                        top={yMax} 
                                        scale={xScale} 
                                        numTicks={7} 
                                        tickLabelProps={() => ({
                                            fill: "currentColor",
                                            fontSize: 11,
                                            textAnchor: "middle",
                                        })}
                                        stroke="currentColor"
                                        tickStroke="currentColor"
                                    />
                                    <AxisLeft 
                                        scale={yScale} 
                                        numTicks={5}
                                        tickLabelProps={() => ({
                                            fill: "currentColor",
                                            fontSize: 11,
                                            textAnchor: "end",
                                            dx: -4,
                                            dy: 3,
                                        })}
                                        stroke="currentColor"
                                        tickStroke="currentColor"
                                    />
                                     {data.map((d) => {
                                        const barWidth = xScale.bandwidth();
                                        const barHeight = yMax - (yScale(d.count) ?? 0);
                                        const barX = xScale(d.label);
                                        const barY = yMax - barHeight;
                                        return (
                                            <Group key={`bar-${d.label}`}>
                                                <Bar
                                                    x={barX}
                                                    y={barY}
                                                    width={barWidth}
                                                    height={barHeight}
                                                    fill={COLORS.bar}
                                                    rx={4}
                                                />
                                                {d.count > 0 && (
                                                     <text
                                                        x={(barX || 0) + barWidth / 2}
                                                        y={barY - 5}
                                                        textAnchor="middle"
                                                        fill="currentColor"
                                                        fontSize={12}
                                                     >
                                                         {d.count}
                                                     </text>
                                                )}
                                            </Group>
                                        );
                                    })}
                                </Group>
                            </svg>
                        );
                    }}
                </ParentSize>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatisticsView;
