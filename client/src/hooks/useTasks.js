import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
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
  const { enabled = true, ...queryParams } = filters;
  const qc = useQueryClient();

  // [P3] แยก invalidate ตาม mutation type — ลด refetch ที่ไม่จำเป็น
  const invalidateTasks = () => qc.invalidateQueries({ queryKey: ["tasks"] });
  const invalidateAll = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["tasks"] }),
      qc.invalidateQueries({ queryKey: ["summary"] }),
      qc.invalidateQueries({ queryKey: ["categories"] }),
    ]);
  const invalidateTasksAndSummary = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["tasks"] }),
      qc.invalidateQueries({ queryKey: ["summary"] }),
    ]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks", queryParams],
    queryFn: () => getTasks(queryParams).then((r) => r.data),
    enabled,
  });

  const tasks = data?.tasks ?? data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const create = useMutation({
    mutationFn: createTask,
    onMutate: async (newTask) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData(["tasks", queryParams]);
      qc.setQueryData(["tasks", queryParams], (old) => {
        const list = old?.tasks ?? old ?? [];
        const fake = { id: "temp-" + Date.now(), ...newTask, status: "pending", subtasks: [] };
        return old?.tasks ? { ...old, tasks: [fake, ...list] } : [fake, ...list];
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => qc.setQueryData(["tasks", queryParams], ctx.prev),
    // create อาจเปลี่ยน summary + categories
    onSettled: invalidateAll,
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => updateTask(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData(["tasks", queryParams]);
      qc.setQueryData(["tasks", queryParams], (old) => {
        const list = old?.tasks ?? old ?? [];
        const updated = list.map((t) => (t.id === id ? { ...t, ...data } : t));
        return old?.tasks ? { ...old, tasks: updated } : updated;
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => qc.setQueryData(["tasks", queryParams], ctx.prev),
    // update อาจเปลี่ยน status (summary) หรือ category
    onSettled: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: deleteTask,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData(["tasks", queryParams]);
      qc.setQueryData(["tasks", queryParams], (old) => {
        const list = old?.tasks ?? old ?? [];
        const filtered = list.filter((t) => t.id !== id);
        return old?.tasks ? { ...old, tasks: filtered } : filtered;
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => qc.setQueryData(["tasks", queryParams], ctx.prev),
    // delete เปลี่ยน summary แต่ไม่เปลี่ยน categories
    onSettled: invalidateTasksAndSummary,
  });

  const reorder = useMutation({
    mutationFn: (orderedTasks) => {
      const payload = orderedTasks.map((t, i) => ({ id: t.id, order: i }));
      return reorderTasks(payload);
    },
    onMutate: async (orderedTasks) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData(["tasks", queryParams]);
      qc.setQueryData(["tasks", queryParams], (old) =>
        old?.tasks ? { ...old, tasks: orderedTasks } : orderedTasks
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => qc.setQueryData(["tasks", queryParams], ctx.prev),
    // [P3] reorder ไม่เปลี่ยน summary หรือ categories — invalidate เฉพาะ tasks
    onSettled: invalidateTasks,
  });

  // [P3] subtask mutations: server return เฉพาะ subtask ที่เปลี่ยน
  // → update cache ใน-place แทน invalidate tasks ทั้งก้อน
  const patchSubtaskInCache = (taskId, patchFn) => {
    qc.setQueryData(["tasks", queryParams], (old) => {
      if (!old) return old;
      const list = old?.tasks ?? old ?? [];
      const updated = list.map((t) =>
        t.id === taskId ? { ...t, subtasks: patchFn(t.subtasks ?? []) } : t
      );
      return old?.tasks ? { ...old, tasks: updated } : updated;
    });
  };

  const addSub = useMutation({
    mutationFn: ({ taskId, data }) => addSubtask(taskId, data),
    onSuccess: (newSubtask, { taskId }) => {
      patchSubtaskInCache(taskId, (subs) => [...subs, newSubtask.data ?? newSubtask]);
    },
    // subtask ไม่กระทบ summary/categories
    onSettled: invalidateTasks,
  });

  const toggleSub = useMutation({
    mutationFn: ({ taskId, subId }) => toggleSubtask(taskId, subId),
    onSuccess: (updated, { taskId }) => {
      const sub = updated.data ?? updated;
      patchSubtaskInCache(taskId, (subs) => subs.map((s) => (s.id === sub.id ? sub : s)));
    },
    onSettled: invalidateTasks,
  });

  const deleteSub = useMutation({
    mutationFn: ({ taskId, subId }) => deleteSubtask(taskId, subId),
    onSuccess: (_res, { taskId, subId }) => {
      patchSubtaskInCache(taskId, (subs) => subs.filter((s) => s.id !== subId));
    },
    onSettled: invalidateTasks,
  });

  return {
    tasks,
    total,
    totalPages,
    isLoading,
    error,
    createTask: (data) => create.mutateAsync(data),
    updateTask: (id, data) => update.mutateAsync({ id, data }),
    deleteTask: (id) => remove.mutateAsync(id),
    reorderTasks: (orderedTasks) => reorder.mutateAsync(orderedTasks),
    addSubtask: (taskId, data) => addSub.mutateAsync({ taskId, data }),
    toggleSubtask: (taskId, subId) => toggleSub.mutateAsync({ taskId, subId }),
    deleteSubtask: (taskId, subId) => deleteSub.mutateAsync({ taskId, subId }),
  };
}
