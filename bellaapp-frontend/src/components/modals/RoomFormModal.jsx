import { useMemo, useState } from "react";
import FormModalShell from "./FormModalShell";
import {
  DEFAULT_ROOM_COLOR,
  isValidRoomColor,
  normalizeRoomColor,
  resolveRoomColor,
} from "../../utils/roomUtils";
import "../../styles/rooms/room-form-modal.css";

const STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
];

export default function RoomFormModal({
  closeOnSave = true,
  description = "Cadastre nome, cor de identificacao e status operacional da sala.",
  initialValues = {},
  onClose,
  onSave,
  submitLabel = "Salvar sala",
  title = "Nova Sala",
}) {
  const [formData, setFormData] = useState(() => ({
    name: initialValues.name || "",
    color: normalizeRoomColor(initialValues.color) || "",
    status: initialValues.status || "ativo",
  }));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const previewColor = useMemo(() => resolveRoomColor(formData.color), [formData.color]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormError("");
    setFormData((current) => ({
      ...current,
      [name]: name === "color" ? value.toUpperCase() : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.name.trim()) {
      setFormError("Informe o nome da sala.");
      return;
    }

    if (!isValidRoomColor(formData.color)) {
      setFormError("Use uma cor valida no formato #RRGGBB ou deixe o campo em branco.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await onSave?.({
        name: formData.name.trim(),
        color: normalizeRoomColor(formData.color),
        status: formData.status,
      });

      if (closeOnSave && result !== false) {
        onClose?.();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormModalShell description={description} onClose={onClose} size="compact" title={title}>
      <form className="form-modal-form" onSubmit={handleSubmit}>
        <div className="form-modal-grid">
          <div className="form-modal-field form-modal-field-full">
            <label htmlFor="nova-sala-nome">Nome da sala</label>
            <input
              id="nova-sala-nome"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Sala 01"
              required
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="nova-sala-status">Status</label>
            <select id="nova-sala-status" name="status" value={formData.status} onChange={handleChange}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-modal-field">
            <label htmlFor="nova-sala-cor">Cor (opcional)</label>
            <input
              id="nova-sala-cor"
              name="color"
              value={formData.color}
              onChange={handleChange}
              placeholder="#D97EA4"
              autoCapitalize="characters"
              spellCheck={false}
            />
          </div>
        </div>

        <div className="room-form-preview">
          <span className="room-form-preview-swatch" style={{ "--room-preview-color": previewColor }} />

          <div className="room-form-preview-copy">
            <strong>{formData.name.trim() || "Nova sala"}</strong>
            <span>{normalizeRoomColor(formData.color) || DEFAULT_ROOM_COLOR}</span>
          </div>
        </div>

        {formError ? (
          <div className="form-modal-helper">
            <strong>Ajuste os dados da sala.</strong> {formError}
          </div>
        ) : null}

        <div className="form-modal-footer">
          <button
            type="button"
            className="form-modal-button form-modal-button-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>

          <button type="submit" className="form-modal-button form-modal-button-primary" disabled={submitting}>
            {submitting ? "Salvando..." : submitLabel}
          </button>
        </div>
      </form>
    </FormModalShell>
  );
}
