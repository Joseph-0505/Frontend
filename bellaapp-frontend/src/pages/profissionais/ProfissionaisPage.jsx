import { Plus } from "lucide-react";
import Header from "../../components/layout/Header";
import ProfissionaisModals from "../../components/profissionais/ProfissionaisModals";
import ProfissionaisPagination from "../../components/profissionais/ProfissionaisPagination";
import ProfissionaisTable from "../../components/profissionais/ProfissionaisTable";
import ProfissionaisToolbar from "../../components/profissionais/ProfissionaisToolbar";
import useProfissionaisPage from "../../hooks/useProfissionaisPage";
import "../../styles/botoes/novo-agendamento.css";
import "../../styles/botoes/novo-cliente.css";
import "../../styles/profissionais/profissionais.css";

export default function ProfissionaisPage() {
  const {
    closeEditingProfessional,
    currentPage,
    editingProfessional,
    error,
    footerLabel,
    goToNextPage,
    goToPrevPage,
    handleCreateProfessional,
    handlePageSizeChange,
    handleProfessionalAction,
    handleSearchChange,
    handleStatusChange,
    handleUpdateProfessional,
    isEmptyDatabase,
    loading,
    newProfessionalModal,
    pageSize,
    pageSizeOptions,
    professionals,
    rowActions,
    search,
    status,
    totalPages,
  } = useProfissionaisPage();

  return (
    <section className="profissionais-page">
      <Header
        title="Profissionais"
        subtitle="Centralize especialidades, contatos e disponibilidade do seu time em um único painel."
        actions={
          <button type="button" className="btn-primary" onClick={newProfessionalModal.open}>
            + Novo Profissional
          </button>
        }
      />

      <section className="profissionais-board">
        <ProfissionaisToolbar
          loading={loading}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          search={search}
          status={status}
        />

        {error ? <p className="profissionais-feedback profissionais-feedback-error">{error}</p> : null}
        {loading ? <p className="profissionais-feedback">Carregando profissionais...</p> : null}

        {!loading && !error ? (
          <>
            <ProfissionaisTable
              actions={rowActions}
              isEmptyDatabase={isEmptyDatabase}
              onAction={handleProfessionalAction}
              onCreateProfessional={newProfessionalModal.open}
              professionals={professionals}
            />

            <ProfissionaisPagination
              currentPage={currentPage}
              footerLabel={footerLabel}
              onNextPage={goToNextPage}
              onPageSizeChange={handlePageSizeChange}
              onPrevPage={goToPrevPage}
              pageSize={pageSize}
              pageSizeOptions={pageSizeOptions}
              totalPages={totalPages}
            />
          </>
        ) : null}
      </section>

      <ProfissionaisModals
        editingProfessional={editingProfessional}
        newProfessionalModal={newProfessionalModal}
        onCloseEditingProfessional={closeEditingProfessional}
        onCreateProfessional={handleCreateProfessional}
        onUpdateProfessional={handleUpdateProfessional}
      />
    </section>
  );
}
