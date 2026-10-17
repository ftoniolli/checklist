export class AppError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

export function mapStorageError(error) {
  if (error instanceof AppError) return error
  if (error?.name === 'QuotaExceededError') {
    return new AppError('O armazenamento deste dispositivo está cheio. Exclua fotografias antigas ou faça um backup e libere espaço.', 'quota')
  }
  return new AppError('Não foi possível gravar os dados neste dispositivo.', 'storage')
}
