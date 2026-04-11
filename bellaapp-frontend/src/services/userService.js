import { normalizeCnpj, normalizeCpf } from "../utils/formatters";
import { apiGet, apiPut, updateSessionUser } from "./api";

const USERS_BASE_PATH = "/api/v1/users";

function toUserViewModel(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name || "",
    email: user.email || "",
    cpf: user.cpf || "",
    businessProfile: user.businessProfile
      ? {
          businessName: user.businessProfile.businessName || "",
          cnpj: user.businessProfile.cnpj || "",
        }
      : null,
  };
}

function toUserPayload(input) {
  const cpf = normalizeCpf(input.cpf);
  const cnpj = normalizeCnpj(input.cnpj);
  const businessName = String(input.businessName || "").trim();

  return {
    name: String(input.name || "").trim(),
    cpf,
    password: String(input.password || ""),
    ...(businessName ? { businessName } : {}),
    ...(cnpj ? { cnpj } : {}),
  };
}

export async function getCurrentUserProfile() {
  const response = await apiGet(`${USERS_BASE_PATH}/me`);
  return toUserViewModel(response?.data || response);
}

export async function updateCurrentUserProfile(input) {
  const response = await apiPut(`${USERS_BASE_PATH}/me`, toUserPayload(input));
  const user = toUserViewModel(response?.data || response);

  if (user) {
    updateSessionUser(user);
  }

  return user;
}
