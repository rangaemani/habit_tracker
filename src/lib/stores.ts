import { writable } from "svelte/store";

type User = {
    id: string;
};

export const habits = writable<any>([]);
export const user = writable<User | null>(null);
