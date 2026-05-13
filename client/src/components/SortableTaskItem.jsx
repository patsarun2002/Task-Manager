import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskItem from "./TaskItem";
import { memo } from "react";

const SortableTaskItem = memo(function SortableTaskItem({ task, ...props }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskItem task={task} {...props} dragListeners={listeners} />
    </div>
  );
});

export default SortableTaskItem;
