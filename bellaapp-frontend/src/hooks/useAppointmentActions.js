import { useState } from "react";
import { showConfirmAlert } from "../utils/alerts";

export default function useAppointmentActions({ appointment, onUpdate, onClose }) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!onUpdate || loading) return;

    try {
      setLoading(true);
      const result = await onUpdate(appointment.id, "confirmado");
      if (result !== false) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!onUpdate || loading) return;

    const confirmed = await showConfirmAlert({
      title: "Cancelar agendamento?",
      text: "Tem certeza que deseja cancelar?",
      confirmButtonText: "Cancelar agendamento",
      cancelButtonText: "Voltar",
    });

    if (!confirmed) return;

    try {
      setLoading(true);
      const result = await onUpdate(appointment.id, "cancelado");
      if (result !== false) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    handleConfirm,
    handleCancel,
  };
}
