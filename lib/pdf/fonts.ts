import { Font } from "@react-pdf/renderer";
import path from "node:path";

// react-pdf renders server-side via fontkit, which needs a real font file —
// the next/font/google Cairo used in app/layout.tsx only works client-side
// in the browser, not inside a Node-run PDF renderer.
let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  const dir = path.join(process.cwd(), "lib/pdf/fonts");
  Font.register({
    family: "Cairo",
    fonts: [
      { src: path.join(dir, "Cairo-Regular.ttf"), fontWeight: "normal" },
      { src: path.join(dir, "Cairo-Bold.ttf"), fontWeight: "bold" },
    ],
  });
  registered = true;
}
