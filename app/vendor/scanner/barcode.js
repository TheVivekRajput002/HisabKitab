"use client"

import QRCode from "qrcode"
import { useEffect, useState } from "react"

export default function InvoiceQR({ payload }) {
  const [qr, setQr] = useState("")

  useEffect(() => {
    if (!payload) return

    QRCode.toDataURL(
      payload,
      {
        errorCorrectionLevel: "Q",
        width: 100,
        margin: 2,
      }
    ).then(setQr)
  }, [payload])

  return qr ? (
    <img src={qr} alt="Invoice QR Code" />
  ) : null
}
