export default function SummaryBar({ summary }) {
  return (
    <div className="summary-bar">
      <div className="summary-item">
        <span className="summary-num">{summary.total}</span>
        <span className="summary-label">ทั้งหมด</span>
      </div>
      <div className="summary-item">
        <span className="summary-num pending">{summary.pending}</span>
        <span className="summary-label">ค้างอยู่</span>
      </div>
      <div className="summary-item">
        <span className="summary-num done">{summary.done}</span>
        <span className="summary-label">เสร็จแล้ว</span>
      </div>
      <div className="summary-item overdue-item">
        <span className="summary-num overdue">{summary.overdue}</span>
        <span className="summary-label">เลยกำหนด</span>
      </div>
    </div>
  )
}