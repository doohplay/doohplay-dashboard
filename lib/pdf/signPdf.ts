import fs from 'fs'
import { SignPdf } from 'node-signpdf'
import { P12Signer } from '@signpdf/signer-p12'
import { plainAddPlaceholder } from '@signpdf/placeholder-pdf-lib'

export function signPdf(pdfBuffer: Buffer): Buffer {
  const certPath = process.env.PDF_SIGN_CERT_PATH
  const certPassword = process.env.PDF_SIGN_CERT_PASSWORD

  // 🔎 Diagnóstico (remova depois que funcionar)
  console.log('CERT PATH =>', certPath)
  console.log(
    'CERT PASS =>',
    certPassword ? 'OK' : 'MISSING'
  )

  // 🔐 Validações obrigatórias
  if (!certPath) {
    throw new Error(
      'PDF_SIGN_CERT_PATH is not defined'
    )
  }

  if (!certPassword) {
    throw new Error(
      'PDF_SIGN_CERT_PASSWORD is not defined'
    )
  }

  if (!fs.existsSync(certPath)) {
    throw new Error(
      `Certificate file not found at ${certPath}`
    )
  }

  // 📄 Ler certificado
  const p12Buffer = fs.readFileSync(certPath)

  // 🔑 Criar signer
  const signer = new P12Signer(p12Buffer, {
    passphrase: certPassword,
  })

  // ✍️ Inserir placeholder de assinatura
  const pdfWithPlaceholder = plainAddPlaceholder({
    pdfBuffer,
    reason: 'Relatório DOOHPLAY – Proof of Play',
    signatureLength: 8192,
  })

  // 🔏 Assinar PDF
  return new SignPdf().sign(
    pdfWithPlaceholder,
    signer
  )
}
