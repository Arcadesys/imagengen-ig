export type PuppetStyle = "sock" | "muppet" | "mascot" | "felt" | "paper" | "plush"

/**
 * Generates a puppet transformation prompt based on the style and user input
 */
export function generatePuppetPrompt(
  puppetStyle: PuppetStyle,
  userPrompt: string = "",
  hasMask: boolean = false
): string {
  const puppetDescriptor =
    puppetStyle === "sock"
      ? "sock puppet: knitted texture, button eyes, stitched mouth, stretchy fabric"
      : puppetStyle === "muppet"
        ? "Muppet-style: foam head, felt skin, moveable mouth, ping-pong ball eyes, yarn hair"
        : puppetStyle === "mascot"
          ? "mascot costume: oversized foam head, bright fabric, visible stitching, sports team style"
          : puppetStyle === "felt"
            ? "felt puppet: wool felt texture, blanket-stitch seams, button eyes, embroidered mouth"
            : puppetStyle === "paper"
              ? "paper puppet: flat construction, cut edges, drawn features, craft project look"
              : "plush puppet: soft fleece fabric, embroidered features, toy store quality"

  const transformationInstructions = [
    `Transform subject into ${puppetStyle} puppet (${puppetDescriptor}).`,
    "Replace all skin with fabric textures. Convert eyes to buttons/felt, hair to yarn/fabric.",
    "Keep exact pose, camera angle, background unchanged. Maintain identity but as puppet materials.",
    "Show realistic puppet construction: seams, stitching, fabric textures.",
    "Lighting matches original scene, puppet casts appropriate shadows.",
    userPrompt?.trim() ? `Subject details: ${userPrompt.trim()}.` : "",
    hasMask ? "Apply only within mask area." : "",
    "Family-friendly content only.",
  ]
    .filter(Boolean)
    .join(" ")

  return transformationInstructions
}
