import { useEffect, useMemo, useState } from "react";
import FormModalShell from "./FormModalShell";
import { API_STATUS_OPTIONS } from "../../utils/StatusUtils";
import { DEFAULT_TIME_SLOTS, getSlotSpan, getSlotWindow } from "../../utils/timeUtils";

function getTodayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

function renderOptions(items, emptyLabel) {
  if (items.length === 0) {
    return <option value="">{emptyLabel}</option>;
  }

  return items.map((item) => (
    <option key={item.id} value={item.id}>
      {item.name}
    </option>
  ));
}

export default function NovoAgendamento({
  clients = [],
  closeOnSave = true,
  defaultDate = "",
  description = "Monte um agendamento rapido com cliente, servico e janela operacional da agenda.",
  hours = [],
  initialValues = {},
  onClose,
  onSave,
  professionals = [],
  services = [],
  submitLabel = "Salvar agendamento",
  title = "Novo Agendamento",
}) {
  const baseHours = hours.length > 0 ? hours : DEFAULT_TIME_SLOTS;
  const resolvedDate = initialValues.data || initialValues.day || defaultDate || getTodayIsoDate();
  const resolvedHour = initialValues.hora || initialValues.hour || baseHours[0] || DEFAULT_TIME_SLOTS[0];
  const resolvedProfessionalId =
    initialValues.professionalId || professionals.find((item) => item.name === initialValues.profissional)?.id || "";

  const [formData, setFormData] = useState(() => ({
    clientId: initialValues.clientId || clients[0]?.id || "",
    serviceId: initialValues.serviceId || services[0]?.id || "",
    professionalId: resolvedProfessionalId,
    data: resolvedDate,
    hora: resolvedHour,
    status: initialValues.status || "pendente",
    observacoes: initialValues.observacoes || initialValues.notes || "",
  }));
  const [submitting, setSubmitting] = useState(false);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === formData.clientId) || null,
    [clients, formData.clientId]
  );

  const selectedProfessional = useMemo(
    () => professionals.find((professional) => professional.id === formData.professionalId) || null,
    [formData.professionalId, professionals]
  );

  const selectedService = useMemo(
    () => services.find((service) => service.id === formData.serviceId) || null,
    [formData.serviceId, services]
  );

  const availableHours = useMemo(() => {
    const durationMinutes = Number(selectedService?.durationMinutes || 60) || 60;
    const slotSpan = getSlotSpan(durationMinutes);

    return baseHours.filter((hour) => getSlotWindow(baseHours, hour, slotSpan).length === slotSpan);
  }, [baseHours, selectedService?.durationMinutes]);

  useEffect(() => {
    setFormData((current) => {
      const nextHour = availableHours.includes(current.hora) ? current.hora : availableHours[0] || "";

      if (nextHour === current.hora) {
        return current;
      }

      return {
        ...current,
        hora: nextHour,
      };
    });
  }, [availableHours]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const notes = formData.observacoes.trim();
      const result = await onSave?.({
        clientId: formData.clientId,
        serviceId: formData.serviceId,
        ...(formData.professionalId ? { professionalId: formData.professionalId } : {}),
        cliente: selectedClient?.name || "",
        servico: selectedService?.name || "",
        profissional: selectedProfessional?.name || "",
        day: formData.data,
        hour: formData.hora,
        data: formData.data,
        hora: formData.hora,
        status: formData.status,
        observacoes: notes,
        notes,
      });

      if (closeOnSave && result !== false) {
        onClose?.();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormModalShell description={description} onClose={onClose} title={title}>
      <form className="form-modal-form" onSubmit={handleSubmit}>
        <div className="form-modal-grid">
          <div className="form-modal-field">
            <label htmlFor="novo-agendamento-cliente">Cliente</label>
            <select
              id="novo-agendamento-cliente"
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              required
            >
              {renderOptions(clients, "Nenhum cliente cadastrado")}
            </select>
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-agendamento-servico">Servico</label>
            <select
              id="novo-agendamento-servico"
              name="serviceId"
              value={formData.serviceId}
              onChange={handleChange}
              required
            >
              {renderOptions(services, "Nenhum servico cadastrado")}
            </select>
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-agendamento-profissional">Profissional</label>
            <select
              id="novo-agendamento-profissional"
              name="professionalId"
              value={formData.professionalId}
              onChange={handleChange}
            >
              <option value="">
                {professionals.length > 0 ? "Selecionar profissional" : "Nenhum profissional cadastrado"}
              </option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-agendamento-data">Data</label>
            <input
              id="novo-agendamento-data"
              name="data"
              type="date"
              value={formData.data}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-agendamento-hora">Horario</label>
            <select
              id="novo-agendamento-hora"
              name="hora"
              value={formData.hora}
              onChange={handleChange}
              disabled={availableHours.length === 0}
            >
              {availableHours.length > 0 ? (
                availableHours.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))
              ) : (
                <option value="">Nenhum horario disponivel</option>
              )}
            </select>
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-agendamento-status">Status inicial</label>
            <select id="novo-agendamento-status" name="status" value={formData.status} onChange={handleChange}>
              {API_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-modal-field form-modal-field-full">
            <label htmlFor="novo-agendamento-observacoes">Observacoes</label>
            <textarea
              id="novo-agendamento-observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              placeholder="Ex: confirmar com 24h de antecedencia ou levar ficha assinada."
            />
          </div>
        </div>

        <div className="form-modal-footer">
          <button
            type="button"
            className="form-modal-button form-modal-button-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="form-modal-button form-modal-button-primary"
            disabled={submitting || !formData.hora}
          >
            {submitting ? "Salvando..." : submitLabel}
          </button>
        </div>
      </form>
    </FormModalShell>
  );
}
