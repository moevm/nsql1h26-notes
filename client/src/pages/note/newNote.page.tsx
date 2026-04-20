import { useSearchParams } from "react-router-dom";

import { NoteEditor } from "@/pages/note/ui/editor";

export const NewNotePage = () => {
  const [searchParams] = useSearchParams();

  return <NoteEditor mode="new" parentKey={searchParams.get("parent_key")} />;
};
