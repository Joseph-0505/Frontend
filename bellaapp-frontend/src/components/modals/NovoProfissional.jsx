import { useEffect, useMemo, useState } from "react";
import useUnauthorizedRedirect from "../../hooks/useUnauthorizedRedirect";
import { listServices } from "../../services/serviceService";
import FormModalShell from "./FormModalShell";
import { formatPhone, normalizeEmail } from "../../utils/formatters";

const STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
];

function buildServiceOptions(services = [], currentSpecialty = "") {
  const optionsByName = new Map();

  services.forEach((service) => {
    const name = String(service?.name || "").trim();

    if (!name) {
      return;
    }

    const normalizedName = name.toLowerCase();

    if (!optionsByName.has(normalizedName)) {
      optionsByName.set(normalizedName, { value: name, label: name });
    }
  });

  const resolvedCurrentSpecialty = String(currentSpecialty || "").trim();

  if (resolvedCurrentSpecialty) {
    const normalizedCurrent = resolvedCurrentSpecialty.toLowerCase();

    if (!optionsByName.has(normalizedCurrent)) {
      optionsByName.set(normalizedCurrent, {
        value: resolvedCurrentSpecialty,
        label: `${resolvedCurrentSpecialty} (atual)`,
      });
    }
  }

  return Array.from(optionsByName.values()).sort((left, right) =>
    left.label.localeCompare(right.label, "pt-BR", { sensitivity: "base" })
  );
}

export default function NovoProfissional({
  closeOnSave = true,
  description = "Cadastre nome, especialidade, contato e status operacional do profissional.",
  initialValues = {},
  onClose,
  onSave,
  submitLabel = "Salvar profissional",
  title = "Novo Profissional",
}) {
  const [formData, setFormData] = useState(() => ({
    name: initialValues.name || "",
    specialty: initialValues.specialty || initialValues.role || "",
    email: normalizeEmail(initialValues.email || ""),
    phone: formatPhone(initialValues.phone || ""),
    status: initialValues.status || "ativo",
  }));
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const redirectToLogin = useUnauthorizedRedirect();

  useEffect(() => {
    let active = true;

    async function loadServiceCatalog() {
      try {
        setServicesLoading(true);
        setServicesError("");

        const response = await listServices({
          active: true,
          limit: 100,
          page: 1,
        });

        if (!active) {
          return;
        }

        setServices(response.items);
      } catch (requestError) {
        if (!active) {
          return;
        }

        setServices([]);
        setServicesError(requestError.message || "Não foi possível carregar os serviços.");

        if (requestError.status === 401) {
          redirectToLogin();
        }
      } finally {
        if (active) {
          setServicesLoading(false);
        }
      }
    }

    loadServiceCatalog();

    return () => {
      active = false;
    };
  }, [redirectToLogin]);

  const specialtyOptions = useMemo(
    () => buildServiceOptions(services, formData.specialty),
    [formData.specialty, services]
  );

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]:
        name === "phone"
          ? formatPhone(value)
          : name === "email"
            ? normalizeEmail(value)
            : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const result = await onSave?.({
        name: formData.name.trim(),
        specialty: formData.specialty.trim(),
        email: normalizeEmail(formData.email),
        phone: formatPhone(formData.phone).trim(),
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
            <label htmlFor="novo-profissional-nome">Nome completo</label>
            <input
              id="novo-profissional-nome"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Dra. Mariana Souza"
              required
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-profissional-especialidade">Especialidade</label>
            <select
              id="novo-profissional-especialidade"
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              required
            >
              <option value="">
                {servicesLoading
                  ? "Carregando serviços..."
                  : specialtyOptions.length > 0
                    ? "Selecione um serviço"
                    : "Nenhum serviço cadastrado"}
              </option>
              {specialtyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-profissional-status">Status</label>
            <select id="novo-profissional-status" name="status" value={formData.status} onChange={handleChange}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-profissional-email">E-mail</label>
            <input
              id="novo-profissional-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="profissional@empresa.com"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-profissional-telefone">Telefone</label>
            <input
              id="novo-profissional-telefone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(11) 99999-9999"
              inputMode="numeric"
              maxLength={15}
              required
            />
          </div>
        </div>

        {servicesError ? (
          <div className="form-modal-helper">
            <strong>Serviços indisponíveis.</strong> Atualize a página para tentar carregar o catálogo novamente.
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
