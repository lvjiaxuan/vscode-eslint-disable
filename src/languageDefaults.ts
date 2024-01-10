// https://github.com/Microsoft/vscode-eslint/blob/main/server/src/languageDefaults.ts

interface LanguageConfig {
  ext: string
  lineComment: string
  blockComment: [string, string]
}

const languageId2Config: Map<string, LanguageConfig> = new Map([
  ['javascript', { ext: 'js', lineComment: '//', blockComment: ['/*', '*/'] }],
  ['javascriptreact', { ext: 'jsx', lineComment: '//', blockComment: ['/*', '*/'] }],
  ['typescript', { ext: 'ts', lineComment: '//', blockComment: ['/*', '*/'] }],
  ['typescriptreact', { ext: 'tsx', lineComment: '//', blockComment: ['/*', '*/'] }],
  ['html', { ext: 'html', lineComment: '//', blockComment: ['<!--', '-->'] }],
  ['vue', { ext: 'vue', lineComment: '//', blockComment: ['<!--', '-->'] }],
  ['coffeescript', { ext: 'coffee', lineComment: '#', blockComment: ['###', '###'] }],
  ['yaml', { ext: 'yaml', lineComment: '#', blockComment: ['#', ''] }],
  ['graphql', { ext: 'graphql', lineComment: '#', blockComment: ['#', ''] }],
])

export const blockCommentRegex: { [x: string]: string } = {
  '/*': '\\/\\*',
  '*/': '\\*\\/',
}

export function getLineComment(languageId: string): string {
  return languageId2Config.get(languageId)?.lineComment ?? '//'
}

export function getBlockComment(languageId: string): [string, string] {
  return languageId2Config.get(languageId)?.blockComment ?? ['/**', '*/']
}

export function getExtension(languageId: string): string | undefined {
  return languageId2Config.get(languageId)?.ext
}
