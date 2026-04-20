import { createContext, useContext, type ReactNode } from "react";

type NoteLayoutContextValue = {
  refreshNotes: () => void;
};

const NoteLayoutContext = createContext<NoteLayoutContextValue | null>(null);

export function NoteLayoutProvider({
  value,
  children,
}: {
  value: NoteLayoutContextValue;
  children: ReactNode;
}) {
  return (
    <NoteLayoutContext.Provider value={value}>
      {children}
    </NoteLayoutContext.Provider>
  );
}

export function useNoteLayout() {
  const context = useContext(NoteLayoutContext);

  if (!context) {
    throw new Error("useNoteLayout must be used within NoteLayoutProvider");
  }

  return context;
}
