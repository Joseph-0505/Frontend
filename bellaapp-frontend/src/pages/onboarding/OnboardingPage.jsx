import { Building2, Check, Clock3, DoorClosed, DoorOpen, Sparkles, UserRound, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingServicesInput from "../../components/onboarding/OnboardingServicesInput";
import OnboardingStep from "../../components/onboarding/OnboardingStep";
import useAuth from "../../hooks/useAuth";
import { completeOnboarding, ONBOARDING_SERVICE_SUGGESTIONS } from "../../services/onboardingService";
import { showErrorAlert, showSuccessAlert } from "../../utils/alerts";
import "../../styles/onboarding/onboarding.css";

const DEFAULT_SCHEDULE = {
  mondayToFriday: { start: "08:00", end: "18:00" },
  saturday: { start: "08:00", end: "12:00" },
  sunday: { closed: true },
};

const STEP_LABELS = [
  "Nome do espaço",
  "Estrutura",
  "Salas",
  "Serviços",
];

function normalizeServiceName(serviceName) {
  return String(serviceName || "").trim();
}

function ChoiceCard({ description, icon: Icon, isActive, label, onClick }) {
  return (
    <button
      type="button"
      className={`onboarding-choice-card ${isActive ? "is-active" : ""}`}
      aria-pressed={isActive}
      onClick={onClick}
    >
      <span className="onboarding-choice-icon">
        <Icon size={18} />
      </span>
      <span className="onboarding-choice-copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      {isActive ? (
        <span className="onboarding-choice-check">
          <Check size={16} />
        </span>
      ) : null}
    </button>
  );
}

function buildSuccessMessage(result) {
  const summary = [];

  if (result?.created?.professional) {
    summary.push("profissional inicial criado");
  }

  if (Array.isArray(result?.created?.services) && result.created.services.length > 0) {
    summary.push(`${result.created.services.length} serviço(s) cadastrado(s)`);
  }

  if (Array.isArray(result?.created?.rooms) && result.created.rooms.length > 0) {
    summary.push(`${result.created.rooms.length} sala(s) configurada(s)`);
  }

  if (summary.length === 0) {
    return "Configuração inicial concluída. Seu sistema já está pronto para uso.";
  }

  return `Configuração inicial concluída com ${summary.join(", ")}.`;
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { onboarding, refreshCurrentUser, refreshOnboardingStatus, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const [hasTeam, setHasTeam] = useState(null);
  const [usesRooms, setUsesRooms] = useState(null);
  const [servicesInput, setServicesInput] = useState("");
  const [services, setServices] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const defaultSchedule = onboarding?.defaultSchedule || DEFAULT_SCHEDULE;
  const displayName = user?.name || "sua conta";

  useEffect(() => {
    const initialBusinessName = onboarding?.businessName || user?.businessProfile?.businessName || "";
    const hasPersistedAnswers = onboarding?.completed === true;

    setBusinessName((current) => current || initialBusinessName);
    setHasTeam((current) =>
      current === null && hasPersistedAnswers && typeof onboarding?.hasTeam === "boolean" ? onboarding.hasTeam : current,
    );
    setUsesRooms((current) =>
      current === null && hasPersistedAnswers && typeof onboarding?.usesRooms === "boolean" ? onboarding.usesRooms : current,
    );
  }, [onboarding, user?.businessProfile?.businessName]);

  const stepValidation = useMemo(
    () => [
      businessName.trim().length > 1,
      hasTeam !== null,
      usesRooms !== null,
      services.length > 0,
    ],
    [businessName, hasTeam, services.length, usesRooms],
  );

  const currentStepConfig = useMemo(() => {
    if (currentStep === 0) {
      return {
        description: "Use o nome que deve aparecer no painel e na organização da sua agenda.",
        eyebrow: "Passo 1",
        title: "Qual o nome do seu espaço?",
      };
    }

    if (currentStep === 1) {
      return {
        description: "Isso ajuda a preparar a estrutura inicial do sistema sem pedir configurações demais agora.",
        eyebrow: "Passo 2",
        title: "Você atende sozinha ou possui equipe?"
      };
    }

    if (currentStep === 2) {
      return {
        description: "Se você usa salas separadas, criamos a base inicial para sua operação não começar vazia.",
        eyebrow: "Passo 3",
        title: "Os atendimentos acontecem em salas separadas?",
      };
    }

    return {
      description: "Cadastre só o essencial. Depois você pode editar nomes, durações, valores e outros detalhes.",
      eyebrow: "Passo 4",
      title: "Quais serviços você quer deixar prontos agora?",
    };
  }, [currentStep]);

  function addService(serviceName) {
    const normalizedService = normalizeServiceName(serviceName);

    if (!normalizedService) {
      return;
    }

    setServices((current) => {
      if (current.some((service) => service.toLowerCase() === normalizedService.toLowerCase())) {
        return current;
      }

      return [...current, normalizedService];
    });
    setServicesInput("");
  }

  function removeService(serviceName) {
    setServices((current) => current.filter((service) => service !== serviceName));
  }

  function goToNextStep() {
    if (!stepValidation[currentStep]) {
      return;
    }

    setCurrentStep((current) => Math.min(current + 1, STEP_LABELS.length - 1));
  }

  function goToPreviousStep() {
    setCurrentStep((current) => Math.max(current - 1, 0));
  }

  async function handleFinish() {
    if (!stepValidation[3] || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await completeOnboarding({
        businessName,
        hasTeam,
        services,
        usesRooms,
      });

      await showSuccessAlert(buildSuccessMessage(result), {
        confirmButtonText: "Ir para o painel",
        title: "Tudo pronto",
      });
      await Promise.all([refreshCurrentUser(), refreshOnboardingStatus()]);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      await showErrorAlert(requestError.message || "Não foi possível concluir a configuração inicial.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-shell">
        <aside className="onboarding-brand-panel">
          <span className="onboarding-chip">Configuração inicial</span>

          <div className="onboarding-brand-copy">
            <h2>Vamos deixar sua agenda pronta em menos de um minuto.</h2>
            <p>
              Oi, {displayName}. Responda o essencial agora e a Bella App ja cria a base minima para você
              começar a atender sem telas vazias.
            </p>
          </div>

          <div className="onboarding-brand-highlights">
            <div className="onboarding-highlight-card">
              <span>
                <Sparkles size={18} />
              </span>
              <div>
                <strong>Setup enxuto</strong>
                <small>Somente 4 passos curtos e objetivos.</small>
              </div>
            </div>

            <div className="onboarding-highlight-card">
              <span>
                <Clock3 size={18} />
              </span>
              <div>
                <strong>Agenda base</strong>
                <small>
                  Seg à sex {defaultSchedule.mondayToFriday.start} - {defaultSchedule.mondayToFriday.end}, sáb{" "}
                  {defaultSchedule.saturday.start} - {defaultSchedule.saturday.end}.
                </small>
              </div>
            </div>
          </div>

          <div className="onboarding-summary-card">
            <h3>O que será preparado ao finalizar</h3>
            <ul>
              <li>1 profissional inicial com base na sua conta</li>
              <li>Seus serviços ja cadastrados para agendamento</li>
              <li>
                {usesRooms === true
                  ? "Salas iniciais: Sala 1 e Sala 2"
                  : usesRooms === false
                    ? "Sem estrutura de salas por enquanto"
                    : "Salas opcionais conforme sua rotina"}
              </li>
              <li>Domingo fechado por padrão</li>
            </ul>
          </div>
        </aside>

        <main className="onboarding-card">
          <div className="onboarding-progress">
            {STEP_LABELS.map((label, index) => {
              const isDone = stepValidation[index];
              const isCurrent = index === currentStep;

              return (
                <div
                  key={label}
                  className={`onboarding-progress-item ${isCurrent ? "is-current" : ""} ${isDone ? "is-done" : ""}`}
                >
                  <span className="onboarding-progress-index">{index + 1}</span>
                  <span className="onboarding-progress-label">{label}</span>
                </div>
              );
            })}
          </div>

          <div key={currentStep} className="onboarding-step-shell">
            <OnboardingStep
              eyebrow={currentStepConfig.eyebrow}
              title={currentStepConfig.title}
              description={currentStepConfig.description}
            >
              {currentStep === 0 ? (
                <div className="onboarding-input-stack">
                  <label htmlFor="onboarding-business-name">Nome do seu negócio</label>
                  <div className="onboarding-input-with-icon">
                    <Building2 size={18} />
                    <input
                      id="onboarding-business-name"
                      type="text"
                      placeholder="Ex: Bella Estética"
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      maxLength={80}
                    />
                  </div>
                </div>
              ) : null}

              {currentStep === 1 ? (
                <div className="onboarding-choice-grid">
                  <ChoiceCard
                    description="Estrutura mais simples, com você como profissional inicial."
                    icon={UserRound}
                    isActive={hasTeam === false}
                    label="Só eu"
                    onClick={() => setHasTeam(false)}
                  />

                  <ChoiceCard
                    description="Você trabalha com outras pessoas ou quer crescer com equipe."
                    icon={Users}
                    isActive={hasTeam === true}
                    label="Tenho equipe"
                    onClick={() => setHasTeam(true)}
                  />
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="onboarding-choice-grid">
                  <ChoiceCard
                    description="Criamos Sala 1 e Sala 2 como base para sua operação."
                    icon={DoorOpen}
                    isActive={usesRooms === true}
                    label="Sim"
                    onClick={() => setUsesRooms(true)}
                  />

                  <ChoiceCard
                    description="A agenda fica pronta sem estrutura de salas por enquanto."
                    icon={DoorClosed}
                    isActive={usesRooms === false}
                    label="Não"
                    onClick={() => setUsesRooms(false)}
                  />
                </div>
              ) : null}

              {currentStep === 3 ? (
                <OnboardingServicesInput
                  inputValue={servicesInput}
                  onAddService={addService}
                  onInputChange={setServicesInput}
                  onRemoveService={removeService}
                  services={services}
                  suggestions={ONBOARDING_SERVICE_SUGGESTIONS}
                />
              ) : null}
            </OnboardingStep>
          </div>

          <footer className="onboarding-footer">
            <button
              type="button"
              className="onboarding-secondary-button"
              onClick={goToPreviousStep}
              disabled={currentStep === 0 || submitting}
            >
              Voltar
            </button>

            {currentStep < STEP_LABELS.length - 1 ? (
              <button
                type="button"
                className="onboarding-primary-button"
                onClick={goToNextStep}
                disabled={!stepValidation[currentStep] || submitting}
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                className="onboarding-primary-button"
                onClick={handleFinish}
                disabled={!stepValidation[3] || submitting}
              >
                {submitting ? "Finalizando..." : "Finalizar"}
              </button>
            )}
          </footer>
        </main>
      </div>
    </div>
  );
}
