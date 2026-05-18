import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import SortableTaskItem from "./SortableTaskItem";

export default function TaskList({
  tasks,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onReorder,
}) {
  const parentRef = useRef();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    onReorder(arrayMove(tasks, oldIndex, newIndex));
  };

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 96, // estimate สูงขึ้นเพื่อลด layout shift
    overscan: 8,
    measureElement: (el) => el?.getBoundingClientRect().height ?? 96,
  });

  const sharedProps = {
    onToggle,
    onEdit,
    onDelete,
    onAddSubtask,
    onToggleSubtask,
    onDeleteSubtask,
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
        <span className="text-3xl mb-2">📭</span>
        <p className="text-sm">ไม่มี task ที่ตรงกับเงื่อนไข</p>
      </div>
    );
  }

  // ≤ 30 tasks: render normally (supports DnD best)
  if (tasks.length < 30) {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col">
            {tasks.map((task) => (
              <SortableTaskItem key={task.id} task={task} {...sharedProps} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  // > 30 tasks: virtualize
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={parentRef} className="overflow-y-auto" style={{ height: "70vh" }}>
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualRow) => (
              <div
                key={virtualRow.key}
                style={{ position: "absolute", top: virtualRow.start, width: "100%" }}
                ref={virtualizer.measureElement}
                data-index={virtualRow.index}
              >
                <SortableTaskItem task={tasks[virtualRow.index]} {...sharedProps} />
              </div>
            ))}
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
}
