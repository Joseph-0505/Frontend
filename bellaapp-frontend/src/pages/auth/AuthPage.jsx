import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo2.png";
import { isAuthenticated } from "../../services/api";
import { loginAndStoreSession, register } from "../../services/authService";
import { showSuccessAlert } from "../../utils/alerts";
import { formatCpf, normalizeEmail } from "../../utils/formatters";
import {
  validateCpf,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from "../../utils/userValidation";
import "../../styles/auth.css";

const INITIAL_FORM_DATA = {
  confirmPassword: "",
  cpf: "",
  email: "",
  name: "",
  password: "",
};

function resolveInitialAuthMode(search) {
  const searchParams = new URLSearchParams(search);
  return searchParams.get("mode") === "register" ? "register" : "login";
}

function PasswordField({
  fieldId,
  fieldName,
  helperText = "",
  label,
  onToggleVisibility,
  onValueChange,
  placeholder,
  showPassword,
  toggleLabel,
  value,
  required = true,
}) {
  return (
    <div className="form-group">
      <label htmlFor={fieldId}>{label}</label>
      <div className="password-field">
        <input
          id={fieldId}
          name={fieldName}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onValueChange}
          required={required}
        />

        <button
          type="button"
          className="password-toggle"
          aria-label={toggleLabel}
          aria-pressed={showPassword}
          onClick={onToggleVisibility}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {helperText ? <small className="auth-helper">{helperText}</small> : null}
    </div>
  );
}

function getRegisterValidationError(formData) {
  if (!formData.name.trim()) {
    return "Nome é obrigatório.";
  }

  const cpfError = validateCpf(formData.cpf);
  if (cpfError) {
    return cpfError;
  }

  const passwordError = validatePassword(formData.password);
  if (passwordError) {
    return passwordError;
  }

  const confirmationError = validatePasswordConfirmation(formData.password, formData.confirmPassword);
  if (confirmationError) {
    return confirmationError;
  }

  return "";
}

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(() => resolveInitialAuthMode(location.search));
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isRegisterMode = mode === "register";

  if (isAuthenticated()) {
    return <Navigate replace to="/" />;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]:
        name === "email"
          ? normalizeEmail(value)
          : name === "cpf"
            ? formatCpf(value)
            : value,
    }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const normalizedEmail = normalizeEmail(formData.email);
      const emailError = validateEmail(normalizedEmail);

      if (emailError) {
        throw new Error(emailError);
      }

      if (!formData.password) {
        throw new Error("Senha é obrigatória.");
      }

      if (isRegisterMode) {
        const validationError = getRegisterValidationError(formData);

        if (validationError) {
          throw new Error(validationError);
        }

        await register({
          name: formData.name.trim(),
          email: normalizedEmail,
          password: formData.password,
          cpf: formData.cpf.trim(),
        });

        await showSuccessAlert("Cadastro realizado com sucesso. Faça login para continuar.", {
          title: "Conta criada",
          confirmButtonText: "Ir para login",
        });

        switchMode("login");
        setFormData({
          ...INITIAL_FORM_DATA,
          email: normalizedEmail,
        });
        navigate("/login", { replace: true });
        return;
      }

      await loginAndStoreSession({
        email: normalizedEmail,
        password: formData.password,
      });

      navigate("/", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Não foi possível autenticar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`auth-page ${isRegisterMode ? "auth-page-register" : ""}`}>
      <section className="auth-left">
        <div className={`auth-brand auth-brand-surface ${isRegisterMode ? "auth-brand-compact" : ""}`}>
          <div className="auth-brand-header">
            <span className="auth-chip">Gestão para estética</span>
          </div>

          <div className="auth-brand-media">
            <img className="logo" src={logo} alt="Bella App" />
          </div>

          <div className="auth-brand-copy">
            <h1 className="auth-titulo">Bem-vinda</h1>
            <p className="auth-subtitle">
              Organize seus atendimentos, clientes e serviços em um fluxo mais simples e profissional.
            </p>
          </div>
        </div>
      </section>

      <section className="auth-right">
        <div className={`auth-card ${isRegisterMode ? "auth-card-register" : ""}`}>
          <div className="auth-mode-toggle" role="tablist" aria-label="Modo de autenticação">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => switchMode("login")}
            >
              Entrar
            </button>

            <button
              type="button"
              className={isRegisterMode ? "active" : ""}
              onClick={() => switchMode("register")}
            >
              Criar conta
            </button>
          </div>

          <div className="auth-card-header">
            <h2>{isRegisterMode ? "Crie sua conta" : "Acesse sua conta"}</h2>
            <p>
              {isRegisterMode
                ? "Preencha os dados principais da conta em um único formulário."
                : "Entre com email e senha para acessar sua agenda."}
            </p>
          </div>

          {error ? <p className="auth-error">{error}</p> : null}

          <form onSubmit={handleSubmit} className={`auth-form ${isRegisterMode ? "auth-form-register" : ""}`}>
            {isRegisterMode ? (
              <>
                <div className="form-group">
                  <label htmlFor="auth-name">Seu nome</label>
                  <input
                    id="auth-name"
                    name="name"
                    placeholder="Ex: Jessica Almeida"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="auth-cpf">CPF</label>
                  <input
                    id="auth-cpf"
                    name="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={handleChange}
                    inputMode="numeric"
                    maxLength={14}
                    required
                  />
                </div>
              </>
            ) : null}

            <div className={`form-group ${isRegisterMode ? "form-group-full" : ""}`}>
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                placeholder="Digite seu email"
                value={formData.email}
                onChange={handleChange}
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
              />
            </div>

            <PasswordField
              fieldId="auth-password"
              fieldName="password"
              helperText={
                isRegisterMode ? "Mínimo de 8 caracteres com letra maiúscula, minúscula, número e símbolo." : ""
              }
              label="Senha"
              onToggleVisibility={() => setShowPassword((current) => !current)}
              onValueChange={handleChange}
              placeholder="Digite sua senha"
              showPassword={showPassword}
              toggleLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
              value={formData.password}
            />

            {isRegisterMode ? (
              <PasswordField
                fieldId="auth-confirm-password"
                fieldName="confirmPassword"
                label="Confirmar senha"
                onToggleVisibility={() => setShowConfirmPassword((current) => !current)}
                onValueChange={handleChange}
                placeholder="Confirme sua senha"
                showPassword={showConfirmPassword}
                toggleLabel={showConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
                value={formData.confirmPassword}
              />
            ) : null}

            <button type="submit" className="auth-button" disabled={submitting}>
              {submitting ? "Enviando..." : isRegisterMode ? "Criar conta" : "Entrar"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
