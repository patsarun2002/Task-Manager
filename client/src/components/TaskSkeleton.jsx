export default function TaskSkeleton() {
  return (
    <div className="task-list">
      {[1, 2, 3].map((i) => (
        <div key={i} className="task-item skeleton">
          <div className="skel skel-check" />
          <div className="task-info">
            <div className="skel skel-title" />
            <div className="skel skel-date" />
          </div>
        </div>
      ))}
    </div>
  );
}
