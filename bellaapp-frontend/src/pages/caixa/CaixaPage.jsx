import { useCallback, useEffect, useState } from "react";
import KpiCard from "../../components/dashboard/KpiCard";
import Header from "../../components/layout/Header";
import useUnauthorizedRedirect from "../../hooks/useUnauthorizedRedirect";
import { closeTodayCash, getTodayCash } from "../../services/cashService";
import "../../styles/dashboard/dashboard.css";
import "../../styles/caixa/caixa.css";
import formatCurrency from "../../utils/formatters";
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from "../../utils/alerts";

export default function CaixaPage() {
  const [cash, setCash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");
  const redirectToLogin = useUnauthorizedRedirect();

  const loadCash = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getTodayCash();
      setCash(result);
    } catch (requestError) {
      if (requestError.status === 401) {
        redirectToLogin();
        return;
      }

      setError(requestError.message || "Não foi possível carregar o caixa do dia.");
    } finally {
      setLoading(false);
    }
  }, [redirectToLogin]);

  useEffect(() => {
    loadCash();
  }, [loadCash]);

  async function handleCloseCash() {
    if (!cash || cash.status === "fechado" || closing) {
      return;
    }

    const confirmed = await showConfirmAlert({
      title: "Fechar caixa do dia?",
      text: "Depois do fechamento, novas movimentações não entram mais no caixa desta data.",
      confirmButtonText: "Fechar caixa",
      cancelButtonText: "Continuar aberto",
    });

    if (!confirmed) {
      return;
    }

    try {
      setClosing(true);
      const result = await closeTodayCash();
      setCash(result);
      await showSuccessAlert("Caixa fechado com sucesso.");
    } catch (requestError) {
      await showErrorAlert(requestError.message || "Não foi possível fechar o caixa.");
    } finally {
      setClosing(false);
    }
  }

  return (
    <section className="dashboard-page cash-page">
      <Header
        title="Caixa"
        subtitle={cash
          ? `Acompanhe o caixa de ${cash.dateLabel}. Status atual: ${cash.status}.`
          : "Acompanhe as entradas confirmadas do dia em um único painel."}
        actions={
          <button type="button" className="btn-primary" onClick={handleCloseCash} disabled={!cash || cash.status === "fechado" || closing}>
            {closing ? "Fechando..." : cash?.status === "fechado" ? "Caixa fechado" : "Fechar caixa"}
          </button>
        }
      />

      <section className="kpi-grid">
        <KpiCard
          label="Total do dia"
          value={formatCurrency(cash?.totalBalance || 0)}
          trend={cash?.status === "fechado" ? "Snapshot salvo" : "Saldo líquido do caixa"}
        />
        <KpiCard
          label="Total pago"
          value={formatCurrency(cash?.totalPaid || 0)}
          trend="Entradas recebidas pela clínica"
        />
      </section>

      <article className="panel cash-panel">
        <div className="cash-panel-header">
          <div>
            <h2>Movimentações do dia</h2>
            <p>{cash?.movements?.length || 0} movimentações registradas no caixa atual.</p>
          </div>
          {cash ? <span className={`cash-status-badge cash-status-${cash.status}`}>{cash.status}</span> : null}
        </div>

        {loading ? <p className="agenda-feedback">Carregando caixa...</p> : null}
        {error ? <p className="agenda-feedback agenda-feedback-error">{error}</p> : null}

        {!loading && !error ? (
          cash?.movements?.length ? (
            <div className="cash-table-wrap">
              <table className="cash-table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Serviço</th>
                    <th>Forma</th>
                    <th>Valor</th>
                  </tr>
                </thead>

                <tbody>
                  {cash.movements.map((movement) => (
                    <tr key={movement.id}>
                      <td>{movement.hourLabel}</td>
                      <td>{movement.clientName}</td>
                      <td>{movement.serviceName}</td>
                      <td>{movement.paymentMethodLabel}</td>
                      <td>{formatCurrency(movement.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="agenda-feedback">Nenhuma movimentação paga entrou no caixa hoje.</p>
          )
        ) : null}
      </article>
    </section>
  );
}