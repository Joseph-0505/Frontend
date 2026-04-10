import { statusColor, statusLabel } from "../../utils/StatusUtils";
import formatCurrency from "../../utils/formatters";

export default function AgendaSlotCard({
  appointment,
  draggable = false,
  isDragging = false,
  isDropSettled = false,
  onClick,
  onDragEnd,
  onDragStart,
}) {
  const status = appointment.status || "cancelado";
  const className = `agenda-slot-card${isDragging ? " is-dragging" : ""}${isDropSettled ? " is-drop-settled" : ""}`;

  return (
    <button
      type="button"
      className={className}
      aria-label={`Abrir agendamento de ${appointment.cliente}`}
      aria-grabbed={isDragging}
      draggable={draggable}
      onClick={onClick}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      data-status={status}
      style={{
        "--slot-surface": statusColor(status),
      }}
    >
     
      <div className="agenda-slot-head">
        <strong className="agenda-slot-title">{appointment.cliente}</strong>
        <span className="agenda-slot-status">{statusLabel(status)}</span>
      </div>

      <p className="agenda-slot-service">{appointment.servico}</p>

      {appointment.profissional ? (
        <p className="agenda-slot-text agenda-slot-secondary">{appointment.profissional}</p>
      ) : null}

      <div className="agenda-slot-footer">
        <span className="agenda-slot-value">{formatCurrency(appointment.valorEstimado)}</span>
      </div>
    </button>
  );
}
