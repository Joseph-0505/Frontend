import { useEffect, useState } from "react";
import Header from "../../components/layout/Header";
import useAuth from "../../hooks/useAuth";
import { updateCurrentUserProfile } from "../../services/userService";
import { showErrorAlert, showInfoAlert } from "../../utils/alerts";
import { formatCnpj, formatCpf } from "../../utils/formatters";
import {
  validateCnpj,
  validateCpf,
  validatePassword,
  validatePasswordConfirmation,
} from "../../utils/userValidation";
import "../../styles/profile/profile.css";

function buildFormData(user) {
  return {
    businessName: user?.businessProfile?.businessName || "",
    cnpj: formatCnpj(user?.businessProfile?.cnpj || ""),
    confirmPassword: "",
    cpf: formatCpf(user?.cpf || ""),
    email: user?.email || "",
    name: user?.name || "",
    password: "",
  };
}

export default function ProfilePage() {
  const { refreshCurrentUser, user } = useAuth();
  const [formData, setFormData] = useState(() => buildFormData(user));
  const [loading, setLoading] = useState(() => !user);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(buildFormData(user));
      setLoading(false);
      return;
    }

    let active = true;

    refreshCurrentUser()
      .catch(() => {})
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [refreshCurrentUser, user]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]:
        name === "cpf"
          ? formatCpf(value)
          : name === "cnpj"
            ? formatCnpj(value)
            : value,
    }));
  }

  function getValidationError() {
    if (!formData.name.trim()) {
      return "Nome é obrigatório.";
    }

    const cpfError = validateCpf(formData.cpf);
    if (cpfError) {
      return cpfError;
    }

    const cnpjError = validateCnpj(formData.cnpj);
    if (cnpjError) {
      return cnpjError;
    }

    if (formData.cnpj.trim() && !formData.businessName.trim()) {
      return "Informe o nome do negócio ao preencher o CNPJ.";
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      return passwordError;
    }

    const confirmPasswordError = validatePasswordConfirmation(formData.password, formData.confirmPassword);
    if (confirmPasswordError) {
      return confirmPasswordError;
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = getValidationError();
    if (validationError) {
      await showErrorAlert(validationError);
      return;
    }

    setSaving(true);

    try {
      await updateCurrentUserProfile({
        businessName: formData.businessName.trim(),
        cnpj: formData.cnpj,
        cpf: formData.cpf,
        name: formData.name.trim(),
        password: formData.password,
      });

      await refreshCurrentUser();

      setFormData((current) => ({
        ...current,
        confirmPassword: "",
        password: "",
      }));

      await showInfoAlert("Seus dados foram atualizados com sucesso.", {
        title: "Perfil atualizado",
      });
    } catch (requestError) {
      await showErrorAlert(requestError.message || "Não foi possível atualizar seu perfil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="profile-page">
      <Header
        title="Meu perfil"
        subtitle="Edite seus dados com validação de CPF, senha forte e confirmação antes de salvar."
      />

      <section className="profile-card">
        <div className="profile-card-header">
          <div>
            <h2>Dados da conta</h2>
            <p>O email fica bloqueado para edição. Para salvar, informe uma nova senha válida.</p>
          </div>
        </div>

        {loading ? (
          <p className="profile-feedback">Carregando dados do usuário...</p>
        ) : (
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-grid">
              <div className="profile-field profile-field-full">
                <label htmlFor="profile-name">Nome</label>
                <input
                  id="profile-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: Jéssica Almeida"
                  required
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-email">Email</label>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  readOnly
                  disabled
                  className="profile-field-readonly"
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-cpf">CPF</label>
                <input
                  id="profile-cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  maxLength={14}
                  required
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-business-name">Nome do seu negócio</label>
                <input
                  id="profile-business-name"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Ex: Bella Estética"
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-cnpj">CNPJ</label>
                <input
                  id="profile-cnpj"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  placeholder="00.000.000/0000-00"
                  inputMode="numeric"
                  maxLength={18}
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-password">Nova senha</label>
                <input
                  id="profile-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Digite a nova senha"
                  required
                />
                <small className="profile-helper">
                  Minimo de 8 caracteres com letra maiúscula, minúscula, número e simbolo.
                </small>
              </div>

              <div className="profile-field">
                <label htmlFor="profile-confirm-password">Confirmar nova senha</label>
                <input
                  id="profile-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirme a nova senha"
                  required
                />
              </div>
            </div>

            <div className="profile-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        )}
      </section>
    </section>
  );
}
