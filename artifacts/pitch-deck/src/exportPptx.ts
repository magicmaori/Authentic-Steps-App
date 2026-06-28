import html2canvas from "html2canvas";
import pptxgen from "pptxgenjs";

/**
 * Capture each .slide element inside `container` via html2canvas,
 * assemble a 16:9 PPTX using pptxgenjs, and trigger a browser download.
 *
 * The container must already be in the DOM with full 1920-px-wide layout
 * so that html2canvas sees the correct pixel dimensions.
 */
export async function runPptxExport(container: HTMLElement): Promise<void> {
  const slideEls = Array.from(container.querySelectorAll<HTMLElement>(".slide"));
  if (slideEls.length === 0) throw new Error("No .slide elements found for export");

  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE"; // 13.33" × 7.5" (standard 16:9)
  pptx.title = "Authentic Steps For Youth";
  pptx.author = "Johaan Kaa";

  for (const el of slideEls) {
    const canvas = await html2canvas(el, {
      width: 1920,
      height: 1080,
      scale: 1,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: null,
    });

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const slide = pptx.addSlide();
    slide.addImage({ data: dataUrl, x: 0, y: 0, w: "100%", h: "100%" });
  }

  await pptx.writeFile({ fileName: "authentic-steps-pitch-deck.pptx" });
}
