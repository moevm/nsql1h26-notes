import {
    LogType,
    NoteAction,
    PermissionAction,
    RegistrationAction,
} from "./base";
import { ISOString } from "@/shared/types/date";

export type GetLogsQueryParams = {
    type: LogType;
    note_action: NoteAction;
    permission_action: PermissionAction;
    registration_action: RegistrationAction;
    granted_by_key: string | null;
    granted_to_key: string | null;
    note_key: string | null;
    target_user_key: string | null;
    from_date: ISOString | null;
    to_date: ISOString | null;
    search: string | null;
    limit: number;
    offset: number;
};
