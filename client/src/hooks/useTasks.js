import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
} from "../services/api";
import { useState, useEffect } from "react";

// ── Debounce hook ─────────────────────────────────────
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── Main hook ─────────────────────────────────────────
export function useTasks(filters) {
  const { enabled = true } = filters;
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["tasks"] });

  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => getTasks(filters).then((r) => r.data),
    enabled,
  });

  const tasks = data?.tasks ?? data ?? [];

  const create = useMutation({
    mutationFn: createTask,
    onMutate: async (newTask) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData(["tasks", filters]);
      qc.setQueryData(["tasks", filters], (old) => {
        const list = old?.tasks ?? old ?? [];
        const fake = {
          id: "temp-" + Date.now(),
          ...newTask,
          status: "pending",
          subtasks: [],
        };
        return old?.tasks
          ? { ...old, tasks: [fake, ...list] }
          : [fake, ...list];
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) =>
      qc.setQueryData(["tasks", filters], ctx.prev),
    onSettled: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => updateTask(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData(["tasks", filters]);
      qc.setQueryData(["tasks", filters], (old) => {
        const list = old?.tasks ?? old ?? [];
        const updated = list.map((t) => (t.id === id ? { ...t, ...data } : t));
        return old?.tasks ? { ...old, tasks: updated } : updated;
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) =>
      qc.setQueryData(["tasks", filters], ctx.prev),
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteTask,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData(["tasks", filters]);
      qc.setQueryData(["tasks", filters], (old) => {
        const list = old?.tasks ?? old ?? [];
        const filtered = list.filter((t) => t.id !== id);
        return old?.tasks ? { ...old, tasks: filtered } : filtered;
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) =>
      qc.setQueryData(["tasks", filters], ctx.prev),
    onSettled: invalidate,
  });

  const addSub = useMutation({
    mutationFn: ({ taskId, data }) => addSubtask(taskId, data),
    onSettled: invalidate,
  });

  const toggleSub = useMutation({
    mutationFn: ({ taskId, subId }) => toggleSubtask(taskId, subId),
    onSettled: invalidate,
  });

  const deleteSub = useMutation({
    mutationFn: ({ taskId, subId }) => deleteSubtask(taskId, subId),
    onSettled: invalidate,
  });

  return {
    tasks,
    isLoading,
    error,
    createTask: (data) => create.mutateAsync(data),
    updateTask: (id, data) => update.mutateAsync({ id, data }),
    deleteTask: (id) => remove.mutateAsync(id),
    addSubtask: (taskId, data) => addSub.mutateAsync({ taskId, data }),
    toggleSubtask: (taskId, subId) => toggleSub.mutateAsync({ taskId, subId }),
    deleteSubtask: (taskId, subId) => deleteSub.mutateAsync({ taskId, subId }),
  };
}
