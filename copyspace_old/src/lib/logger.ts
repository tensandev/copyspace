import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info', // ログレベルを環境変数で設定可能 (デフォルト: info)
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() }; // ログレベルを大文字で出力
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime, // ISO 8601 形式のタイムスタンプ
});