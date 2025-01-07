import {writable} from "svelte/store";
import type {Session} from "@supabase/supabase-js";

type User = {
    id: string;
};

type AuthID = { user: User | null; session: Session | null; } | { user: null; session: null; }

export const authStore = writable<AuthID>({user: null, session: null});
export const habits = writable<any>([]);
export const user = writable<User | null>(null);
