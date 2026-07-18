import { createRoot } from "react-dom/client";

import { App } from "./App";
import "./index.css";
// Leaflet's stylesheet — required by the `map` / `story-map` widgets. The
// ViewportFrame clones host stylesheets into the preview iframe, so this reaches
// the rendered widget too.
import "leaflet/dist/leaflet.css";

createRoot(document.getElementById("root")!).render(<App />);
