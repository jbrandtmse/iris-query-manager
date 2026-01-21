# IRIS Query Manager

A Chrome extension for capturing, organizing, and retrieving SQL queries from the InterSystems IRIS System Management Portal (SMP).

## Features

- **Query Capture**: Save SQL queries directly from the SMP query interface
- **Organized Storage**: Organize queries in folders with custom naming
- **Quick Retrieval**: One-click paste to restore queries to the SMP
- **Safety Warnings**: Alerts for destructive SQL operations (DELETE, DROP, TRUNCATE, etc.)
- **Import/Export**: Share query collections with team members

## Installation

### From Source (Development)

1. Clone the repository:
   ```bash
   git clone https://github.com/jbrandtmse/iris-query-manager.git
   cd iris-query-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open `chrome://extensions`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `build/` folder

### Development Mode

For development with hot module replacement:

```bash
npm run dev
```

Then load the `build/` folder as an unpacked extension. Note that service worker and content script changes require manually reloading the extension.

## Usage

1. Navigate to your IRIS System Management Portal
2. Open the SQL query interface
3. Click the IRIS Query Manager extension icon
4. Use "Capture" to save the current query
5. Browse your saved queries in the library
6. Click any query to paste it back into the SMP

## Tech Stack

- **TypeScript** 5.x with strict mode
- **Vite** for building and HMR
- **Chrome Extension Manifest V3**
- **@crxjs/vite-plugin** for extension development

## Project Structure

```
iris-query-manager/
├── src/
│   ├── background/      # Service worker
│   ├── contentScript/   # SMP page integration
│   ├── popup/           # Extension popup UI
│   ├── shared/          # Shared services and types
│   └── manifest.ts      # Extension manifest
├── public/              # Static assets
├── build/               # Production build output
└── _bmad-output/        # Planning artifacts
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run fmt` | Format code with Prettier |
| `npm run zip` | Build and create distribution zip |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [create-chrome-ext](https://github.com/nicedoc/create-chrome-ext)
- Designed for [InterSystems IRIS](https://www.intersystems.com/products/intersystems-iris/)
