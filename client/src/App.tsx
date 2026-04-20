import { Navigate, Route, Routes } from "react-router-dom";

import { LoginPage } from "@/pages/auth/login.page";
import {NotFoundPage} from "@/pages/notFound";
import {RegisterPage} from "@/pages/auth/register.page";
import {NewNotePage} from "@/pages/note/newNote.page";
import { NotePage } from "@/pages/note/note.page";
import { NotePageLayout } from "@/pages/note/ui/layout";
import { LogsPage } from "@/pages/logs/logs.page";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate replace to="/auth/signin" />} />
            <Route path="/auth/signin" element={<LoginPage/>} />
            <Route path="/auth/signup" element={<RegisterPage/>} />
            <Route path="/notes" element={<NotePageLayout />}>
                <Route index element={<Navigate replace to="new" />} />
                <Route path="new" element={<NewNotePage />} />
                <Route path=":noteKey" element={<NotePage />} />
            </Route>
            <Route path="/logs" element={<Navigate replace to="/logs/my" />} />
            <Route path="/logs/my" element={<LogsPage scope="my" />} />
            <Route path="/admin/logs" element={<LogsPage scope="admin" />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

export default App;
