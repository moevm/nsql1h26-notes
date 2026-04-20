import {
    CreateNoteRequest,
    GetNotesRequest,
    UpdateNoteRequest,
} from "@/entities/note/types/requests";
import {
    CreateNoteResponse,
    GetNotesResponse,
    UpdateNoteResponse,
} from "@/entities/note/types/responses";
import { authRequest } from "@/shared/api/http";
import { AxiosResponse } from "axios";
import { Note } from "@/entities/note/types/dto";

class NotesProxy {
    private readonly BASE_URL = "/notes";

    public getNotes = async (
        params: GetNotesRequest,
    ): Promise<GetNotesResponse> => {
        try {
            const response: AxiosResponse<GetNotesResponse> =
                await authRequest<GetNotesResponse>({
                    url: this.BASE_URL,
                    method: "GET",
                    params,
                });
            return response.data;
        } catch (e) {
            console.log("[ERROR] while getting notes", e);
            return [];
        }
    };

    public createNote = async (
        params: CreateNoteRequest,
    ): Promise<CreateNoteResponse | null> => {
        try {
            const response: AxiosResponse<CreateNoteResponse> =
                await authRequest<CreateNoteResponse>({
                    url: this.BASE_URL,
                    method: "POST",
                    data: params,
                });
            return response.data;
        } catch (e) {
            return null;
        }
    };

    public getNoteByKey = async (note_key: string): Promise<Note | null> => {
        try {
            const response: AxiosResponse<Note> = await authRequest<Note>({
                url: `${this.BASE_URL}/${note_key}`,
                method: "GET",
            });
            return response.data;
        } catch (e) {
            return null;
        }
    };

    public deleteNote = async (note_key: string): Promise<boolean> => {
        try {
            await authRequest<void>({
                url: `${this.BASE_URL}/${note_key}`,
                method: "DELETE",
            });
            return true;
        } catch (e) {
            console.log("[ERROR] while deleting note", e);
            return false;
        }
    };

    public updateNote = async (
        note_key: string,
        params: UpdateNoteRequest,
    ): Promise<UpdateNoteResponse | null> => {
        try {
            const response: AxiosResponse<UpdateNoteResponse> = await authRequest<UpdateNoteResponse>({
                url: `${this.BASE_URL}/${note_key}`,
                method: "PUT",
                data: params,
            });
            return response.data;
        } catch (e) {
            console.log("[ERROR] while updating note", e);
            return null;
        }
    };
}

export const noteProxy = new NotesProxy();
