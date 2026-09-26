import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

/** `/` in the preview; `/rubiks-cube-solver` on GitHub Pages. */
function basepath(): string | undefined {
  const trimmed = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  return trimmed === "" ? undefined : trimmed;
}

export function getRouter() {
  return createRouter({
    routeTree,
    basepath: basepath(),
    defaultErrorComponent: AppErrorComponent,
  });
}
