"use client"

import * as React from "react"

const BODY_OVERLAY_BLUR_ATTR = "data-overlay-blur-count"

function readOverlayBlurCount(body: HTMLBodyElement) {
  const value = Number(body.getAttribute(BODY_OVERLAY_BLUR_ATTR) || "0")

  return Number.isFinite(value) ? value : 0
}

export function useBodyOverlayBlur() {
  React.useEffect(() => {
    const { body } = document
    const count = readOverlayBlurCount(body) + 1

    body.setAttribute(BODY_OVERLAY_BLUR_ATTR, String(count))

    return () => {
      const nextCount = Math.max(readOverlayBlurCount(body) - 1, 0)

      if (nextCount === 0) {
        body.removeAttribute(BODY_OVERLAY_BLUR_ATTR)
        return
      }

      body.setAttribute(BODY_OVERLAY_BLUR_ATTR, String(nextCount))
    }
  }, [])
}
