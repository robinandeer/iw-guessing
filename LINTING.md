# ESLint and Prettier Setup

This project uses ESLint and Prettier for code linting and formatting. The setup is configured to work with Cursor and other VS Code-compatible editors.

## Commands

- `pnpm lint`: Run ESLint to check for code issues
- `pnpm format`: Format all files with Prettier
- `pnpm format:check`: Check if files are properly formatted without making changes

## Editor Integration

### Cursor

Cursor should automatically detect the ESLint and Prettier configuration. The `.vscode/settings.json` file configures:

- Format on save using Prettier
- ESLint fixes on save
- TypeScript and JavaScript validation

### Extensions

If you're using VS Code or Cursor, install these extensions:

1. ESLint: `dbaeumer.vscode-eslint`
2. Prettier: `esbenp.prettier-vscode`

## Configuration Files

- `.eslintrc.json`: ESLint configuration
- `.prettierrc`: Prettier configuration
- `.prettierignore`: Files to ignore during formatting
- `.editorconfig`: Editor settings for consistency
- `.vscode/settings.json`: VS Code/Cursor specific settings

## Manual Setup

If the automatic setup doesn't work, you can manually configure Cursor:

1. Open Settings (⌘ + ,)
2. Search for "format on save" and enable it
3. Search for "default formatter" and set it to "Prettier"
4. Search for "eslint.validate" and ensure JavaScript and TypeScript are included

## Troubleshooting

If you experience issues:

1. Restart Cursor
2. Verify the ESLint and Prettier extensions are installed
3. Run `pnpm format` to manually format files
4. Check for errors in the ESLint output panel
