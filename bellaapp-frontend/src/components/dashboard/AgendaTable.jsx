import { Link } from "react-router-dom";
import AppointmentActionsMenu from "../buttons/DropdownActions";
import StatusBadge from "./StatusBadge";
import { getActionsByStatus } from "../../utils/appointmentActions";
import "../../styles/dashboard/agenda-table.css";

export default function AgendaTable({ appointments, onAction }) {
  return (
    <article className="panel">
      <div className="panel-header">
        <h2>Agenda de hoje</h2>
        <Link to="/agenda" className="panel-link">
          Ver agenda completa
        </Link>
      </div>

      <div className="agenda-table-wrap">
        <table className="agenda-table">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Cliente</th>
              <th>Servico</th>
              <th>Profissional</th>
              <th>Status</th>
              <th className="th-actions">Acoes</th>
            </tr>
          </thead>

          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan="6">Sem agendamentos para hoje.</td>
              </tr>
            ) : (
              appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{appointment.hora}</td>
                  <td>{appointment.clienteNome}</td>
                  <td>{appointment.servicoNome}</td>
                  <td>{appointment.profissionalNome}</td>
                  <td>
                    <StatusBadge status={appointment.status} />
                  </td>
                  <td className="td-actions">
                    <AppointmentActionsMenu
                      rowId={appointment.id}
                      actions={getActionsByStatus(appointment.status)}
                      onAction={(action) => onAction?.(appointment, action)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
