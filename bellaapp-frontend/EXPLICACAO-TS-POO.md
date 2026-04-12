# TS e POO no Front

Este front continua majoritariamente em JavaScript, mas agora tem uma base de TypeScript e POO em pontos estrategicos. A ideia foi atender a rubrica sem reescrever o projeto inteiro.

## 1. Types globais

Arquivo: `src/types/global.d.ts`

O que foi feito:

- `ID`: padroniza identificadores.
- `Nullable<T>`: padroniza valores que podem ser `null`.

Explicacao curta:

"Eu criei tipos globais para evitar repeticao e padronizar entidades reutilizadas no front."

## 2. Tipos declarados

Arquivos:

- `src/types/entities.ts`
- `src/types/profile.ts`

O que foi feito:

- Tipagem de entidades como `UserProfile` e `Appointment`.
- Tipagem de formulario como `ProfileFormData`.
- Tipagem de contratos de atualizacao como `AppointmentUpdateHandler`.

Explicacao curta:

"Em vez de deixar os dados soltos, eu declarei interfaces e unions para dizer exatamente como cada objeto deve chegar e sair das telas."

## 3. POO no front

Arquivos:

- `src/models/ProfileFormModel.ts`
- `src/models/AppointmentModel.ts`

O que foi feito:

- `ProfileFormModel` encapsula o formulario de perfil.
- `AppointmentModel` encapsula regras e formatacoes do agendamento.

Explicacao curta:

"Eu usei classes para concentrar comportamento junto dos dados. Assim, a tela fica mais simples e a regra de negocio nao fica espalhada em varios componentes."

## 4. Onde isso esta sendo usado

Arquivos:

- `src/pages/perfil/ProfilePage.tsx`
- `src/components/modals/AppointmentModal.tsx`
- `src/hooks/useAppointmentActions.ts`
- `src/services/userService.ts`

## 5. Como explicar para os professores

Voce pode dizer algo assim:

"Eu fiz uma migracao incremental para TypeScript no front. Criei types globais e interfaces para padronizar os dados, evitei `any` e `unknown` nos trechos migrados, e usei POO com classes de dominio para encapsular validacao e formatacao. Assim, eu melhorei legibilidade, manutencao e seguranca de tipos sem precisar converter o projeto inteiro de uma vez."
