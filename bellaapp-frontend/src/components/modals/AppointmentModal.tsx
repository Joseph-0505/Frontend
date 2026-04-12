import type { ReactNode } from "react";
import FormModalShell from "./FormModalShell";
import AppointmentModel from "../../models/AppointmentModel";
import type { Appointment } from "../../types/entities";
import type { AppointmentUpdateHandler } from "../../types/profile";
import "../../styles/modals/appointment-modal.css";
import useAppointmentActions from "../../hooks/useAppointmentActions";

interface InfoFieldProps {
  label: string;
  value: ReactNode;
  fullWidth?: boolean;
}

interface AppointmentModalProps {
  appointment: Nullable<Appointment>;
  onClose: () => void;
  onUpdate?: AppointmentUpdateHandler;
  onRequestReschedule?: () => void;
}

function InfoField({ label, value, fullWidth = false }: InfoFieldProps) {
  return (
    <div className={`form-modal-field${fullWidth ? " form-modal-field-full" : ""}`}>
      <label>{label}</label>
      <div className="appointment-modal-value">{value ?? "-"}</div>
    </div>
  );
}

export default function AppointmentModal({
  appointment,
  onClose,
  onUpdate,
  onRequestReschedule,
}: AppointmentModalProps) {
  const {
    loading: actionLoading,
    handleConfirm,
    handleCancel,
  } = useAppointmentActions({
    appointment,
    onUpdate,
    onClose,
  });

  if (!appointment) {
    return null;
  }

  const appointmentModel = new AppointmentModel(appointment);

  return (
    <FormModalShell
      description="Verifique os detalhes do agendamento."
      onClose={onClose}
      size="compact"
      title="Detalhes do agendamento"
    >
      <div className="form-modal-form">
        <div className="form-modal-grid">
          <InfoField label="Cliente" value={appointmentModel.clientName} />
          <InfoField label="Servico" value={appointmentModel.serviceName} />
          <InfoField label="Profissional" value={appointmentModel.professionalName} />
          <InfoField label="Data" value={appointmentModel.formattedDate} />
          <InfoField label="Horario" value={appointmentModel.hour} />
          <InfoField label="Status" value={appointmentModel.statusLabel} />
          <InfoField
            label="Observacoes"
            value={appointmentModel.notesLabel}
            fullWidth
          />
        </div>

        <div className="appointment-modal-highlight">
          <span>Valor estimado</span>
          <strong>{appointmentModel.estimatedValueLabel}</strong>
        </div>

        <div className="form-modal-footer">
          {onRequestReschedule ? (
            <button
              type="button"
              className="form-modal-button form-modal-button-secondary"
              onClick={onRequestReschedule}
              disabled={actionLoading}
            >
              Reagendar
            </button>
          ) : null}

          <button
            type="button"
            className="form-modal-button appointment-modal-button-danger"
            onClick={handleCancel}
            disabled={actionLoading}
          >
            {actionLoading ? "Cancelando..." : "Cancelar"}
          </button>

          <button
            type="button"
            className="form-modal-button form-modal-button-primary"
            onClick={handleConfirm}
            disabled={actionLoading}
          >
            {actionLoading ? "Confirmando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </FormModalShell>
  );
}
