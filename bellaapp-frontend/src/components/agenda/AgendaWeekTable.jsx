import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AgendaSlotCard from "./AgendaSlotCard";
import EmptySlot from "./EmptySlot";
import {
  AGENDA_SLOT_INTERVAL,
  buildDayHourKey,
  canAppointmentFitInSlots,
  createOccupiedSlotKeySet,
  getAppointmentDurationMinutes,
  getAppointmentSlotKeys,
  getAppointmentSlotTimes,
} from "../../utils/timeUtils";

const DROP_ANIMATION_MS = 360;
const CLICK_SUPPRESSION_MS = 200;
const DRAG_DATA_TYPE = "application/x-bellaapp-appointment";

function sortAppointmentsByStart(a, b) {
  const dayCompare = String(a?.day || "").localeCompare(String(b?.day || ""));

  if (dayCompare !== 0) {
    return dayCompare;
  }

  return String(a?.hour || "").localeCompare(String(b?.hour || ""));
}

function buildAppointmentOccupancyMap(appointments, hours) {
  const occupancyMap = new Map();

  [...appointments].sort(sortAppointmentsByStart).forEach((appointment) => {
    const slotTimes = getAppointmentSlotTimes(appointment, hours, AGENDA_SLOT_INTERVAL, {
      clip: true,
    });

    if (slotTimes.length === 0) {
      return;
    }

    const slotSpan = slotTimes.length;

    slotTimes.forEach((slotTime, index) => {
      const slotKey = buildDayHourKey(appointment.day, slotTime);

      if (occupancyMap.has(slotKey)) {
        return;
      }

      occupancyMap.set(slotKey, {
        appointment,
        isStart: index === 0,
        slotSpan,
      });
    });
  });

  return occupancyMap;
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

  const appointmentOccupancy = useMemo(
    () => buildAppointmentOccupancyMap(appointments, hours),
    [appointments, hours]
  );

  const allAppointmentOccupancy = useMemo(
    () => buildAppointmentOccupancyMap(allAppointments, hours),
    [allAppointments, hours]
  );

  const allAppointmentsById = useMemo(
    () => new Map(allAppointments.map((appointment) => [appointment.id, appointment])),
    [allAppointments]
  );

  const allOccupiedSlotKeys = useMemo(
    () => createOccupiedSlotKeySet(allAppointments, hours),
    [allAppointments, hours]
  );

  const occupiedSlotKeysByAppointmentId = useMemo(() => {
    const appointmentKeys = new Map();

    allAppointments.forEach((appointment) => {
      appointmentKeys.set(
        appointment.id,
        new Set(getAppointmentSlotKeys(appointment, hours, AGENDA_SLOT_INTERVAL, { clip: true }))
      );
    });

    return appointmentKeys;
  }, [allAppointments, hours]);

  const suppressClick = useCallback(() => {
    clickSuppressionUntilRef.current = Date.now() + CLICK_SUPPRESSION_MS;
  }, []);

  const clearDragState = useCallback(() => {
    setDraggedAppointmentId("");
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

  const canPlaceAppointment = useCallback(
    (appointment, day, hour) => {
      if (!appointment || movingAppointmentId || hours.length === 0) {
        return false;
      }

      const sourceSlotKey = buildDayHourKey(appointment.day, appointment.hour);
      const targetSlotKey = buildDayHourKey(day, hour);

      if (sourceSlotKey === targetSlotKey) {
        return false;
      }

      const occupiedSlotKeys = new Set(allOccupiedSlotKeys);

      for (const key of occupiedSlotKeysByAppointmentId.get(appointment.id) || []) {
        occupiedSlotKeys.delete(key);
      }

      return canAppointmentFitInSlots({
        day,
        hour,
        durationMinutes: getAppointmentDurationMinutes(appointment, AGENDA_SLOT_INTERVAL),
        slots: hours,
        occupiedSlotKeys,
        interval: AGENDA_SLOT_INTERVAL,
      });
    },
    [allOccupiedSlotKeys, hours, movingAppointmentId, occupiedSlotKeysByAppointmentId]
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
      const appointment = allAppointmentsById.get(payload?.id || draggedAppointmentId);

      if (!appointment) {
        return;
      }

      const slotKey = buildDayHourKey(day, hour);
      const isValid = canPlaceAppointment(appointment, day, hour);

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
    [allAppointmentsById, canPlaceAppointment, draggedAppointmentId]
  );

  const handleSlotDragLeave = useCallback((day, hour) => {
    const slotKey = buildDayHourKey(day, hour);

    setActiveDropState((current) =>
      current.slotKey === slotKey ? { slotKey: "", isValid: false } : current
    );
  }, []);

  const handleSlotDrop = useCallback(
    async (event, day, hour) => {
      event.preventDefault();
      suppressClick();

      const payload = readDragPayload(event);
      const appointment = allAppointmentsById.get(payload?.id || draggedAppointmentId);
      const targetSlotKey = buildDayHourKey(day, hour);
      const isValid = canPlaceAppointment(appointment, day, hour);

      clearDragState();

      if (!appointment || !isValid || !onMoveAppointment) {
        return;
      }

      setMovingAppointmentId(appointment.id);

      try {
        const result = await onMoveAppointment(appointment.id, {
          status: "pendente",
          day,
          hour,
        });

        if (result !== false) {
          setSettledDrop({ appointmentId: appointment.id, slotKey: targetSlotKey });
        }
      } finally {
        setMovingAppointmentId("");
      }
    },
    [
      allAppointmentsById,
      canPlaceAppointment,
      clearDragState,
      draggedAppointmentId,
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
                const slotKey = buildDayHourKey(day.key, hour);
                const visibleSlotMeta = appointmentOccupancy.get(slotKey);
                const allSlotMeta = allAppointmentOccupancy.get(slotKey);

                if (visibleSlotMeta && !visibleSlotMeta.isStart) {
                  return null;
                }

                if (!visibleSlotMeta && allSlotMeta && !allSlotMeta.isStart) {
                  return null;
                }

                const appointment = visibleSlotMeta?.isStart ? visibleSlotMeta.appointment : null;
                const hiddenAppointment =
                  filtersActive &&
                  !appointment &&
                  allSlotMeta?.isStart &&
                  !visibleAppointmentIds.has(allSlotMeta.appointment.id)
                    ? allSlotMeta.appointment
                    : null;
                const slotSpan = visibleSlotMeta?.slotSpan || (hiddenAppointment ? allSlotMeta.slotSpan : 1);
                const isDropTarget =
                  hasActiveDrag && activeDropState.slotKey === slotKey && activeDropState.isValid;
                const isDropInvalid =
                  hasActiveDrag && activeDropState.slotKey === slotKey && !activeDropState.isValid;
                const cellClassName = `agenda-slot-cell${
                  appointment ? " has-appointment" : hiddenAppointment ? " is-filtered" : " is-empty"
                }${isDropTarget ? " is-drop-target" : ""}${isDropInvalid ? " is-drop-invalid" : ""}`;

                return (
                  <td
                    className={cellClassName}
                    key={slotKey}
                    rowSpan={slotSpan}
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
                        slotSpan={slotSpan}
                      />
                    ) : hiddenAppointment ? (
                      <div className="agenda-slot-filtered" aria-hidden="true" style={{ "--slot-span": slotSpan }}>
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
