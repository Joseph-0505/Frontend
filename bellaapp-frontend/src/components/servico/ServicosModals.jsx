import NovoServico from "../modals/NovoServico";
import ServicoPreviewModal from "../modals/ServicoPreviewModal";

export default function ServicosModals({
  editingService,
  newServiceModal,
  onCloseEditingService,
  onCloseSelectedService,
  onCreateService,
  onEditService,
  onToggleServiceStatus,
  onUpdateService,
  selectedService,
  statusBusy = false,
}) {
  return (
    <>
      {newServiceModal.isOpen ? (
        <NovoServico
          onClose={newServiceModal.close}
          onSave={onCreateService}
          showCatalogExtras
          description="Cadastre nome, preco, duracao, icone e status do servico."
        />
      ) : null}

      {editingService ? (
        <NovoServico
          title="Editar Servico"
          submitLabel="Salvar alteracoes"
          initialValues={editingService}
          onClose={onCloseEditingService}
          onSave={onUpdateService}
          showCatalogExtras
        />
      ) : null}

      {selectedService ? (
        <ServicoPreviewModal
          busy={statusBusy}
          onClose={onCloseSelectedService}
          onEdit={onEditService}
          onToggleStatus={onToggleServiceStatus}
          service={selectedService}
        />
      ) : null}
    </>
  );
}
