import { useParams } from "react-router-dom";

import { NoteEditor } from "@/pages/note/ui/editor";

export const NotePage = () => {
  const { noteKey } = useParams();

  return <NoteEditor mode="edit" noteKey={noteKey} />;
};
