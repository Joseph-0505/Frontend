import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const BASE_ALERT_OPTIONS = {
  confirmButtonColor: "#d97ea4",
  cancelButtonColor: "#94a3b8",
  reverseButtons: true,
  heightAuto: false,
};

export function showErrorAlert(message, options = {}) {
  return Swal.fire({
    ...BASE_ALERT_OPTIONS,
    icon: "error",
    title: options.title || "Ops...",
    text: message,
    confirmButtonText: options.confirmButtonText || "Fechar",
    ...options,
  });
}

export function showInfoAlert(message, options = {}) {
  return Swal.fire({
    ...BASE_ALERT_OPTIONS,
    icon: "info",
    title: options.title || "Aviso",
    text: message,
    confirmButtonText: options.confirmButtonText || "Entendi",
    ...options,
  });
}

export function showWarningAlert(message, options = {}) {
  return Swal.fire({
    ...BASE_ALERT_OPTIONS,
    icon: "warning",
    title: options.title || "Atenção",
    text: message,
    confirmButtonText: options.confirmButtonText || "Ok",
    ...options,
  });
}

export async function showConfirmAlert(options = {}) {
  const result = await Swal.fire({
    ...BASE_ALERT_OPTIONS,
    icon: options.icon || "warning",
    title: options.title || "Tem certeza?",
    text: options.text || "",
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText || "Confirmar",
    cancelButtonText: options.cancelButtonText || "Cancelar",
    focusCancel: true,
    ...options,
  });

  return result.isConfirmed;
}
