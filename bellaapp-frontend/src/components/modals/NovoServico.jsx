import { useState } from "react";
import FormModalShell from "./FormModalShell";
import formatCurrency from "../../utils/formatters";

const STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
];

const ICON_OPTIONS = [
  { value: "face", label: "Facial" },
  { value: "syringe", label: "Injetavel" },
  { value: "wand", label: "Laser" },
  { value: "drop", label: "Corporal" },
  { value: "lotus", label: "Relaxamento" },
  { value: "flask", label: "Quimico" },
  { value: "spark", label: "Tecnologia" },
  { value: "pulse", label: "Energia" },
  { value: "leaf", label: "Bem-estar" },
];

function parseCurrencyInput(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalizedValue = String(value || "")
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".");

  const amount = Number(normalizedValue);
  return Number.isFinite(amount) ? amount : 0;
}

function formatCurrencyInput(value) {
  if (value === "" || value == null) {
    return "";
  }

  const amount = parseCurrencyInput(value);

  if (amount === 0 && !String(value).trim()) {
    return "";
  }

  return formatCurrency(amount);
}

function sanitizeCurrencyInput(value) {
  const normalizedValue = String(value || "").replace(/[^\d,]/g, "");
  const [integerPart = "", ...decimalParts] = normalizedValue.split(",");
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, "");
  const decimalPart = decimalParts.join("").slice(0, 2);

  if (!normalizedInteger && !decimalPart) {
    return "";
  }

  return decimalPart ? `${normalizedInteger || "0"},${decimalPart}` : normalizedInteger;
}

function toEditableCurrencyInput(value) {
  if (value === "" || value == null) {
    return "";
  }

  return parseCurrencyInput(value).toFixed(2).replace(".", ",");
}

export default function NovoServico({
  closeOnSave = true,
  description = "Defina preco, duracao e status para manter o catalogo de servicos atualizado.",
  initialValues = {},
  onClose,
  onSave,
  showCatalogExtras = true,
  submitLabel = "Salvar servico",
  title = "Novo Servico",
}) {
  const [formData, setFormData] = useState(() => {
    const baseState = {
      name: "",
      price: "",
      durationMinutes: "60",
      description: "",
      status: "ativo",
      icon: "face",
    };

    return {
      ...baseState,
      ...initialValues,
      price: formatCurrencyInput(initialValues.price ?? baseState.price),
      description: initialValues.description || initialValues.notes || "",
    };
  });
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: name === "price" ? sanitizeCurrencyInput(value) : value,
    }));
  }

  function handlePriceFocus() {
    setFormData((current) => ({
      ...current,
      price: toEditableCurrencyInput(current.price),
    }));
  }

  function handlePriceBlur() {
    setFormData((current) => ({
      ...current,
      price: formatCurrencyInput(current.price),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const result = await onSave?.({
        name: formData.name.trim(),
        price: parseCurrencyInput(formData.price),
        durationMinutes: Number(formData.durationMinutes) || 60,
        description: formData.description.trim(),
        status: formData.status,
        icon: formData.icon,
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
          <div className="form-modal-field form-modal-field-full">
            <label htmlFor="novo-servico-nome">Nome do servico</label>
            <input
              id="novo-servico-nome"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Massagem modeladora"
              required
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-servico-preco">Preco</label>
            <input
              id="novo-servico-preco"
              name="price"
              type="text"
              inputMode="decimal"
              value={formData.price}
              onChange={handleChange}
              onFocus={handlePriceFocus}
              onBlur={handlePriceBlur}
              placeholder="R$ 350,00"
              required
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-servico-duracao">Duracao (min)</label>
            <input
              id="novo-servico-duracao"
              name="durationMinutes"
              type="number"
              min="15"
              step="5"
              value={formData.durationMinutes}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-servico-status">Status</label>
            <select id="novo-servico-status" name="status" value={formData.status} onChange={handleChange}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {showCatalogExtras ? (
            <div className="form-modal-field">
              <label htmlFor="novo-servico-icone">Icone</label>
              <select id="novo-servico-icone" name="icon" value={formData.icon} onChange={handleChange}>
                {ICON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="form-modal-field form-modal-field-full">
            <label htmlFor="novo-servico-detalhes">{showCatalogExtras ? "Detalhes do servico" : "Descricao"}</label>
            <textarea
              id="novo-servico-detalhes"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={
                showCatalogExtras
                  ? "Ex: combinacoes indicadas, preparo previo ou observacoes internas."
                  : "Descreva rapidamente o servico."
              }
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

          <button type="submit" className="form-modal-button form-modal-button-primary" disabled={submitting}>
            {submitting ? "Salvando..." : submitLabel}
          </button>
        </div>
      </form>
    </FormModalShell>
  );
}
