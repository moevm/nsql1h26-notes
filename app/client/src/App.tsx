import { Navigate, Route, Routes } from "react-router-dom";

import { LoginPage } from "@/pages/auth/login.page";
import {NotFoundPage} from "@/pages/notFound";
import {RegisterPage} from "@/pages/auth/register.page";
import {NewNotePage} from "@/pages/note/newNote.page";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate replace to="/auth/signin" />} />
            <Route path="/auth/signin" element={<LoginPage/>} />
            <Route path="/auth/signup" element={<RegisterPage/>} />
            <Route path="/notes/new" element={<NewNotePage/>} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

export default App;
