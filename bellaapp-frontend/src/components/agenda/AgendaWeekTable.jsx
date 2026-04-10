import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AgendaSlotCard from "./AgendaSlotCard";
import EmptySlot from "./EmptySlot";

const DROP_ANIMATION_MS = 360;
const CLICK_SUPPRESSION_MS = 200;
const DRAG_DATA_TYPE = "application/x-bellaapp-appointment";

function buildSlotKey(day, hour) {
  const dayKey = day?.split("T")[0] || day;
  const hourKey = String(hour || "").padStart(5, "0");
  return `${dayKey}-${hourKey}`;
}

function readDragPayload(event) {
  const rawPayload =
    event.dataTransfer.getData(DRAG_DATA_TYPE) || event.dataTransfer.getData("text/plain");

  if (!rawPayload) {
    return null;
  }

  try {
    return JSON.parse(rawPayload);
  } catch {
    return null;
  }
}

export default function AgendaWeekTable({
  days,
  hours,
  appointments,
  allAppointments = appointments,
  visibleAppointmentIds = new Set(),
  filtersActive = false,
  onCreate,
  onMoveAppointment,
  onSelect,
}) {
  const [draggedAppointmentId, setDraggedAppointmentId] = useState("");
  const [dragSourceSlotKey, setDragSourceSlotKey] = useState("");
  const [activeDropState, setActiveDropState] = useState({ slotKey: "", isValid: false });
  const [movingAppointmentId, setMovingAppointmentId] = useState("");
  const [settledDrop, setSettledDrop] = useState({ appointmentId: "", slotKey: "" });
  const clickSuppressionUntilRef = useRef(0);

  useEffect(() => {
    if (!settledDrop.slotKey) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSettledDrop({ appointmentId: "", slotKey: "" });
    }, DROP_ANIMATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [settledDrop]);

  const appointmentsBySlot = useMemo(() => {
    return new Map(
      appointments.map((appointment) => [buildSlotKey(appointment.day, appointment.hour), appointment])
    );
  }, [appointments]);

  const allAppointmentsBySlot = useMemo(() => {
    return new Map(
      allAppointments.map((appointment) => [buildSlotKey(appointment.day, appointment.hour), appointment])
    );
  }, [allAppointments]);

  const suppressClick = useCallback(() => {
    clickSuppressionUntilRef.current = Date.now() + CLICK_SUPPRESSION_MS;
  }, []);

  const clearDragState = useCallback(() => {
    setDraggedAppointmentId("");
    setDragSourceSlotKey("");
    setActiveDropState({ slotKey: "", isValid: false });
  }, []);

  const handleAppointmentSelect = useCallback(
    (appointment) => {
      if (Date.now() < clickSuppressionUntilRef.current) {
        return;
      }

      onSelect?.(appointment);
    },
    [onSelect]
  );

  const handleCardDragStart = useCallback(
    (event, appointment) => {
      if (movingAppointmentId) {
        event.preventDefault();
        return;
      }

      const payload = JSON.stringify({
        id: appointment.id,
        day: appointment.day,
        hour: appointment.hour,
      });

      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.dropEffect = "move";
      event.dataTransfer.setData(DRAG_DATA_TYPE, payload);
      event.dataTransfer.setData("text/plain", payload);

      setDraggedAppointmentId(appointment.id);
      setDragSourceSlotKey(buildSlotKey(appointment.day, appointment.hour));
      setSettledDrop({ appointmentId: "", slotKey: "" });
    },
    [movingAppointmentId]
  );

  const handleCardDragEnd = useCallback(() => {
    suppressClick();
    clearDragState();
  }, [clearDragState, suppressClick]);

  const handleSlotDragOver = useCallback(
    (event, day, hour) => {
      const payload = readDragPayload(event);
      const appointmentId = payload?.id || draggedAppointmentId;
      const sourceSlotKey = payload ? buildSlotKey(payload.day, payload.hour) : dragSourceSlotKey;

      if (!appointmentId) {
        return;
      }

      const slotKey = buildSlotKey(day, hour);
      const isValid =
        !movingAppointmentId &&
        slotKey !== sourceSlotKey &&
        !allAppointmentsBySlot.has(slotKey);

      setActiveDropState((current) =>
        current.slotKey === slotKey && current.isValid === isValid
          ? current
          : { slotKey, isValid }
      );

      if (!isValid) {
        event.dataTransfer.dropEffect = "none";
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    [allAppointmentsBySlot, draggedAppointmentId, dragSourceSlotKey, movingAppointmentId]
  );

  const handleSlotDragLeave = useCallback((day, hour) => {
    const slotKey = buildSlotKey(day, hour);

    setActiveDropState((current) =>
      current.slotKey === slotKey ? { slotKey: "", isValid: false } : current
    );
  }, []);

  const handleSlotDrop = useCallback(
    async (event, day, hour) => {
      event.preventDefault();
      suppressClick();

      const payload = readDragPayload(event);
      const appointmentId = payload?.id || draggedAppointmentId;
      const sourceSlotKey = payload ? buildSlotKey(payload.day, payload.hour) : dragSourceSlotKey;
      const targetSlotKey = buildSlotKey(day, hour);
      const isValid =
        Boolean(appointmentId) &&
        !movingAppointmentId &&
        targetSlotKey !== sourceSlotKey &&
        !allAppointmentsBySlot.has(targetSlotKey);

      clearDragState();

      if (!isValid || !onMoveAppointment) {
        return;
      }

      setMovingAppointmentId(appointmentId);

      try {
        const result = await onMoveAppointment(appointmentId, {
          status: "pendente",
          day,
          hour,
        });

        if (result !== false) {
          setSettledDrop({ appointmentId, slotKey: targetSlotKey });
        }
      } finally {
        setMovingAppointmentId("");
      }
    },
    [
      allAppointmentsBySlot,
      clearDragState,
      draggedAppointmentId,
      dragSourceSlotKey,
      movingAppointmentId,
      onMoveAppointment,
      suppressClick,
    ]
  );

  const hasActiveDrag = Boolean(draggedAppointmentId);

  return (
    <div className="agenda-table-wrap">
      <table className="agenda-table agenda-week-table">
        <thead>
          <tr>
            <th className="agenda-hour-header">Hora</th>
            {days.map((day) => (
              <th className="agenda-day-header-cell" key={day.key}>
                <div className="agenda-day-header">
                  <span className="agenda-day-weekday">{day.weekdayShort}</span>
                  <strong className="agenda-day-number">{day.dayNumber}</strong>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {hours.map((hour) => (
            <tr key={hour}>
              <td className="agenda-hour-cell">{hour}</td>

              {days.map((day) => {
                const slotKey = buildSlotKey(day.key, hour);
                const appointment = appointmentsBySlot.get(slotKey);
                const slotAppointment = allAppointmentsBySlot.get(slotKey);
                const hasHiddenAppointment =
                  filtersActive &&
                  Boolean(slotAppointment) &&
                  (!appointment || !visibleAppointmentIds.has(appointment.id));
                const isDropTarget =
                  hasActiveDrag && activeDropState.slotKey === slotKey && activeDropState.isValid;
                const isDropInvalid =
                  hasActiveDrag && activeDropState.slotKey === slotKey && !activeDropState.isValid;
                const cellClassName = `agenda-slot-cell${
                  appointment ? " has-appointment" : hasHiddenAppointment ? " is-filtered" : " is-empty"
                }${isDropTarget ? " is-drop-target" : ""}${isDropInvalid ? " is-drop-invalid" : ""}`;

                return (
                  <td
                    className={cellClassName}
                    key={slotKey}
                    onDragLeave={() => handleSlotDragLeave(day.key, hour)}
                    onDragOver={(event) => handleSlotDragOver(event, day.key, hour)}
                    onDrop={(event) => handleSlotDrop(event, day.key, hour)}
                  >
                    {appointment ? (
                      <AgendaSlotCard
                        appointment={appointment}
                        draggable={!movingAppointmentId}
                        isDragging={draggedAppointmentId === appointment.id}
                        isDropSettled={
                          settledDrop.appointmentId === appointment.id && settledDrop.slotKey === slotKey
                        }
                        onClick={() => handleAppointmentSelect(appointment)}
                        onDragEnd={handleCardDragEnd}
                        onDragStart={(event) => handleCardDragStart(event, appointment)}
                      />
                    ) : hasHiddenAppointment ? (
                      <div className="agenda-slot-filtered" aria-hidden="true">
                        Oculto pelo filtro
                      </div>
                    ) : (
                      <EmptySlot
                        dayLabel={`${day.weekdayShort} ${day.dayNumber}`}
                        hour={hour}
                        onClick={() => onCreate?.({ day: day.key, hour })}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
