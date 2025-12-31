import React, { useState } from "react";
import { useTodos } from "../../contexts/TodoContext";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CheckCircle, Plus, Trash2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTodoItem } from "../SortableTodoItem";
import { EmptyTodoList } from "../common/EmptyState";

import { useApp } from "../../contexts/AppContext";

const QuickTodosCard = ({ onOpenTodoForm }) => {
  const {
    todos,
    toggleTodoComplete,
    deleteTodo,
    reorderTodos,
  } = useTodos();
  
  const { showNotification } = useApp();

  const [showCompletedTodos, setShowCompletedTodos] = useState(false);
  const [completedTodosPage, setCompletedTodosPage] = useState(1);
  const completedTodosPerPage = 5;

  // Dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const activeId = Number(active.id);
      const overId = Number(over.id);

      reorderTodos(activeId, overId);
    }
  };

  const handleToggleTodoComplete = (id) => {
    const result = toggleTodoComplete(id);
    // contextToggleTodoComplete returns { todo, newStatus } 
    // Wait, I need to check if useTodos returns that. 
    // In App.jsx line 108: toggleTodoComplete: contextToggleTodoComplete
    // App.jsx line 465: const { todo, newStatus } = contextToggleTodoComplete(id);
    // So yes, it returns an object.
    
    if (result && result.newStatus) {
      showNotification({
        type: "success",
        message: "TODO completed! 🎉",
        details: `Great job completing "${result.todo.title}"!`,
      });
    }
  };

  const handleDeleteTodo = (id) => {
    const todo = deleteTodo(id);
    showNotification({
      type: "success",
      message: "TODO deleted",
      details: todo ? `"${todo.title}" has been removed` : "TODO has been removed",
    });
  };

  return (
    <Card
      className={`bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm hover:scale-[1.02] hover:shadow-lg transition-all duration-300 sidebar-focus`}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2" data-tour="quick-todos">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span>Quick TODOs</span>
          </div>
          <Button
            onClick={() => onOpenTodoForm()}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-md active:scale-95"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todos.length === 0 ? (
          <EmptyTodoList onAddTodo={() => onOpenTodoForm()} />
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={todos
                  .filter((todo) => !todo.isCompleted)
                  .map((t) => String(t.id))}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {todos
                    .filter((todo) => !todo.isCompleted)
                    .map((todo) => (
                      <SortableTodoItem
                        key={todo.id}
                        todo={todo}
                        toggleTodoComplete={handleToggleTodoComplete}
                        openTodoForm={onOpenTodoForm}
                        deleteTodo={handleDeleteTodo}
                      />
                    ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Collapsible completed TODOs section */}
            {(() => {
              const completedTodos = todos.filter((t) => t.isCompleted);
              const totalCompletedPages = Math.ceil(
                completedTodos.length / completedTodosPerPage
              );
              const paginatedCompletedTodos = completedTodos.slice(
                (completedTodosPage - 1) * completedTodosPerPage,
                completedTodosPage * completedTodosPerPage
              );

              if (completedTodos.length === 0) return null;

              return (
                <div className="mt-4">
                  <button
                    className="w-full bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:bg-accent/30 flex items-center justify-between"
                    onClick={() => setShowCompletedTodos((s) => !s)}
                    aria-expanded={showCompletedTodos}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 border-[var(--accent-2)]`}
                        style={{ background: "var(--accent-2)" }}
                      >
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-medium">
                        Completed TODOs
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant="default"
                        className="text-xs min-w-[40px] text-center"
                      >
                        {completedTodos.length}
                      </Badge>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 transition-transform duration-300 ${
                          showCompletedTodos ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {showCompletedTodos && (
                    <div className="mt-3 space-y-2">
                      {paginatedCompletedTodos.map((todo) => (
                        <div
                          key={todo.id}
                          className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:bg-accent/30"
                        >
                          <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTodoComplete(todo.id);
                                }}
                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 border-[var(--accent-2)] hover:border-[var(--accent-2)] hover:scale-110 cursor-pointer"
                                style={{ background: "var(--accent-2)" }}
                                title="Click to mark as incomplete"
                              >
                                <CheckCircle className="h-3 w-3 text-white" />
                              </button>
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => onOpenTodoForm(todo)}
                              >
                                <p
                                  className="text-sm font-medium line-through text-muted-foreground"
                                  style={{
                                    wordBreak: "break-word",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                  }}
                                  title={todo.title}
                                >
                                  {todo.title}
                                </p>
                                {todo.description && (
                                  <p
                                    className="text-xs text-muted-foreground mt-1"
                                    style={{
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                    title={todo.description}
                                  >
                                    {todo.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge
                                variant={
                                  todo.priority === "high"
                                    ? "destructive"
                                    : todo.priority === "medium"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs min-w-[60px] text-center opacity-60"
                              >
                                {todo.priority}
                              </Badge>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTodo(todo.id);
                                }}
                                className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                aria-label="Delete TODO"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {totalCompletedPages > 1 && (
                        <div className="flex justify-center items-center gap-3 mt-4 pt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="transition-all duration-300 hover:shadow-md active:scale-95"
                            onClick={() =>
                              setCompletedTodosPage((p) => Math.max(1, p - 1))
                            }
                            disabled={completedTodosPage === 1}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                              />
                            </svg>
                            Prev
                          </Button>
                          <span className="text-xs font-medium px-3 py-1 rounded bg-muted text-muted-foreground">
                            {completedTodosPage} / {totalCompletedPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="transition-all duration-300 hover:shadow-md active:scale-95"
                            onClick={() =>
                              setCompletedTodosPage((p) =>
                                Math.min(totalCompletedPages, p + 1)
                              )
                            }
                            disabled={
                              completedTodosPage === totalCompletedPages
                            }
                          >
                            Next
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 ml-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickTodosCard;
