import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Limpia el DOM entre pruebas y deja localStorage vacío
afterEach(() => {
    cleanup();
    localStorage.clear();
});
