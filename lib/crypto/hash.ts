import crypto from 'crypto'

export function generateHash(payload: object) {
  const json = JSON.stringify(payload)
  return crypto.createHash('sha256').update(json).digest('hex')
}
