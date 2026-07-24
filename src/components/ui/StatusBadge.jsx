import './StatusBadge.css';
import { STATUS_LABELS } from '../../utils/constants';

export default function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_LABELS[status] || STATUS_LABELS.active;

  return (
    <span
      className={`status-badge status-badge--${size} status-bg-${status}`}
      style={{ '--badge-color': config.color }}
    >
      <span className="status-badge-dot"></span>
      {config.label}
    </span>
  );
}
