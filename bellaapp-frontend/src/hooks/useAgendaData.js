import { useCallback, useEffect, useState } from "react";
import {
  createAgendaAppointment,
  getAgendaData,
  updateAgendaAppointment,
} from "../services/agendaService";

function replaceAppointment(currentAppointments, appointmentId, nextAppointment) {
  return currentAppointments.map((appointment) =>
    appointment.id === appointmentId ? nextAppointment : appointment
  );
}

function buildOptimisticAppointment(currentAppointment, changes, professionals) {
  if (!currentAppointment || typeof changes === "string") {
    return {
      ...currentAppointment,
      status: typeof changes === "string" ? changes : currentAppointment?.status,
    };
  }

  const nextStatus = changes.status || currentAppointment.status;
  const nextDay = changes.day || currentAppointment.day;
  const nextHour = changes.hour || currentAppointment.hour;
  const nextNotes = Object.prototype.hasOwnProperty.call(changes, "notes")
    ? changes.notes
    : Object.prototype.hasOwnProperty.call(changes, "observacoes")
      ? changes.observacoes
      : currentAppointment.notes || currentAppointment.observacoes || "";
  const nextProfessionalId = Object.prototype.hasOwnProperty.call(changes, "professionalId")
    ? changes.professionalId || ""
    : currentAppointment.professionalId || "";
  const nextProfessional =
    nextProfessionalId === currentAppointment.professionalId
      ? currentAppointment.profissional
      : professionals.find((professional) => professional.id === nextProfessionalId)?.name || "";

  return {
    ...currentAppointment,
    day: nextDay,
    hour: nextHour,
    status: nextStatus,
    notes: nextNotes,
    observacoes: nextNotes,
    professionalId: nextProfessionalId,
    profissional: nextProfessional,
  };
}

export default function useAgendaData(currentDate) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(0);
  const [hours, setHours] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [services, setServices] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        setErrorStatus(0);

        const data = await getAgendaData(currentDate);
        if (!active) return;

        setHours(data?.hours || []);
        setAppointments(data?.appointments || []);
        setClients(data?.clients || []);
        setProfessionals(data?.professionals || []);
        setServices(data?.services || []);
      } catch (err) {
        if (!active) return;

        setHours([]);
        setAppointments([]);
        setClients([]);
        setProfessionals([]);
        setServices([]);
        setError(err.message || "Falha ao carregar a agenda.");
        setErrorStatus(err.status || 0);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [currentDate, reloadKey]);

  async function createAppointment(input) {
    const result = await createAgendaAppointment(input);
    setReloadKey((current) => current + 1);
    return result;
  }

  const updateAppointment = useCallback(async (id, changes) => {
    const currentAppointment = appointments.find((appointment) => appointment.id === id);
    if (!currentAppointment) {
      return false;
    }

    const optimisticAppointment = buildOptimisticAppointment(currentAppointment, changes, professionals);
    setAppointments((current) => replaceAppointment(current, id, optimisticAppointment));

    try {
      const result = await updateAgendaAppointment(currentAppointment, changes);

      if (!result) {
        setAppointments((current) => replaceAppointment(current, id, currentAppointment));
        return false;
      }

      setAppointments((current) => replaceAppointment(current, id, result));
      return result;
    } catch (error) {
      setAppointments((current) => replaceAppointment(current, id, currentAppointment));
      throw error;
    }
  }, [appointments, professionals]);

  function refreshAgendaData() {
    setReloadKey((current) => current + 1);
  }

  return {
    clients,
    error,
    errorStatus,
    hours,
    loading,
    normalizedAppointments: appointments,
    professionals,
    services,
    createAppointment,
    refreshAgendaData,
    updateAppointment,
  };
}
