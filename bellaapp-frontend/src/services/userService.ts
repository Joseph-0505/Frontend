import { normalizeCnpj, normalizeCpf } from "../utils/formatters";
import type { UserProfile } from "../types/entities";
import type { UpdateCurrentUserProfileInput } from "../types/profile";
import { apiGet, apiPut, updateSessionUser } from "./api";

const USERS_BASE_PATH = "/api/v1/users";

interface ApiBusinessProfile {
  businessName?: string | null;
  cnpj?: string | null;
}

interface ApiUser {
  id: ID;
  name?: string | null;
  email?: string | null;
  cpf?: string | null;
  businessProfile?: Nullable<ApiBusinessProfile>;
}

interface ApiEnvelope {
  data?: ApiUser;
}

interface UserPayload {
  name: string;
  cpf: string;
  password: string;
  businessName?: string;
  cnpj?: string;
}

type UserResponse = Nullable<ApiUser | ApiEnvelope>;

function unwrapUserResponse(response: UserResponse): Nullable<ApiUser> {
  if (!response) {
    return null;
  }

  if ("id" in response) {
    return response;
  }

  if ("data" in response) {
    return response.data || null;
  }

  return null;
}

function toUserViewModel(user: Nullable<ApiUser>): Nullable<UserProfile> {
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

function toUserPayload(input: UpdateCurrentUserProfileInput): UserPayload {
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

export async function getCurrentUserProfile(): Promise<Nullable<UserProfile>> {
  const response = (await apiGet(`${USERS_BASE_PATH}/me`)) as UserResponse;
  return toUserViewModel(unwrapUserResponse(response));
}

export async function updateCurrentUserProfile(
  input: UpdateCurrentUserProfileInput,
): Promise<Nullable<UserProfile>> {
  const response = (await apiPut(`${USERS_BASE_PATH}/me`, toUserPayload(input))) as UserResponse;
  const user = toUserViewModel(unwrapUserResponse(response));

  if (user) {
    updateSessionUser(user);
  }

  return user;
}
