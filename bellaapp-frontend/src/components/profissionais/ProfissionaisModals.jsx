import NovoProfissional from "../modals/NovoProfissional";

export default function ProfissionaisModals({
  editingProfessional,
  newProfessionalModal,
  onCloseEditingProfessional,
  onCreateProfessional,
  onUpdateProfessional,
}) {
  return (
    <>
      {newProfessionalModal.isOpen ? (
        <NovoProfissional onClose={newProfessionalModal.close} onSave={onCreateProfessional} />
      ) : null}

      {editingProfessional ? (
        <NovoProfissional
          title="Editar Profissional"
          submitLabel="Salvar alterações"
          initialValues={editingProfessional}
          onClose={onCloseEditingProfessional}
          onSave={onUpdateProfessional}
        />
      ) : null}
    </>
  );
}
