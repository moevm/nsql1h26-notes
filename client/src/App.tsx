import { Navigate, Route, Routes } from "react-router-dom";

import { LoginPage } from "@/pages/auth/login.page";
import { NotFoundPage } from "@/pages/notFound";
import { RegisterPage } from "@/pages/auth/register.page";
import { NewNotePage } from "@/pages/note/newNote.page";
import { NotePage } from "@/pages/note/note.page";
import { NotePageLayout } from "@/pages/note/ui/layout";
import { LogsPage } from "@/pages/logs/logs.page";
import { LogPage } from "@/pages/logs/log.page";
import { SharePage } from "@/pages/share/share.page";
import { StatsPage } from "@/pages/stats/stats.page";
import { UserPage } from "@/pages/user/user.page";
import { AdminUsersPage } from "@/pages/admin/users.page";
import { AdminNotesPage } from "@/pages/admin/notes.page";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate replace to="/auth/signin" />} />
            <Route path="/auth/signin" element={<LoginPage />} />
            <Route path="/auth/signup" element={<RegisterPage />} />
            <Route path="/notes" element={<NotePageLayout />}>
                <Route index element={<Navigate replace to="new" />} />
                <Route path="new" element={<NewNotePage />} />
                <Route path=":noteKey" element={<NotePage />} />
            </Route>
            <Route path="/logs" element={<Navigate replace to="/logs/my" />} />
            <Route path="/logs/my" element={<LogsPage scope="my" />} />
            <Route path="/logs/:logKey" element={<LogPage />} />
            <Route path="/admin/logs" element={<LogsPage scope="admin" />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/notes" element={<AdminNotesPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/users/:userKey" element={<UserPage />} />
            <Route path="/share/:shareKey" element={<SharePage />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

export default App;
