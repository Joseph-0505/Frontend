import { apiGet, apiPost } from "./api";

const ONBOARDING_BASE_PATH = "/api/v1/onboarding";

export const ONBOARDING_SERVICE_SUGGESTIONS = [
  "Limpeza de pele",
  "Massagem",
  "Botox",
  "Laser",
];

function normalizeServiceNames(services = []) {
  const seen = new Set();

  return services
    .map((service) => String(service || "").trim())
    .filter(Boolean)
    .filter((service) => {
      const key = service.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

export function buildOnboardingPayload(input) {
  return {
    businessName: String(input.businessName || "").trim(),
    hasTeam: Boolean(input.hasTeam),
    usesRooms: Boolean(input.usesRooms),
    services: normalizeServiceNames(input.services),
  };
}

export async function getOnboardingStatus() {
  const response = await apiGet(`${ONBOARDING_BASE_PATH}/status`);
  return response?.data || null;
}

export async function completeOnboarding(input) {
  const response = await apiPost(`${ONBOARDING_BASE_PATH}/complete`, buildOnboardingPayload(input));
  return response?.data || null;
}
