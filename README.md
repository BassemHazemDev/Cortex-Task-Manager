# Cortex Task Manager

## Overview

Cortex Task Manager is a robust, professional-grade web application designed to streamline personal and team productivity. Leveraging modern technologies such as React and Vite, Cortex Task Manager provides an intuitive interface, advanced scheduling algorithms, and a modular architecture for extensibility. The application is suitable for individuals, professionals, and organizations seeking efficient task management, smart scheduling, and real-time notifications.

## Key Features

- **Task Management**: Create, edit, delete, and categorize tasks with support for priorities, deadlines, and custom tags.
- **Smart Scheduler**: Intelligent scheduling engine that suggests optimal task arrangements based on deadlines, priorities, and user preferences.
- **Calendar Integration**: Interactive calendar view for visualizing tasks, events, and milestones. Supports drag-and-drop rescheduling.
- **Notification System**: Real-time alerts and reminders for upcoming tasks, overdue items, and system events.
- **Custom UI Component Library**: Includes a suite of reusable, accessible UI components (buttons, dialogs, forms, tables, etc.) for rapid development and consistent design.
- **Responsive & Mobile-Ready**: Fully responsive layout for seamless experience across desktops, tablets, and smartphones.
- **Persistent Local Storage**: Utilizes browser storage for fast, offline access to tasks and user settings.
- **Extensible Architecture**: Modular codebase designed for easy integration of new features and third-party services.
- **Accessibility**: Follows best practices for accessible web applications (ARIA roles, keyboard navigation, etc.).

## Architecture & Technologies

- **Frontend**: React (functional components, hooks), Vite (fast bundling and hot reload)
- **State Management**: React Context API and custom hooks
- **Styling**: CSS Modules, custom themes
- **Linting & Quality**: ESLint, Prettier
- **Package Management**: PNPM
- **Testing**: (Add your testing framework here if applicable)

## Folder Structure

```
public/
  MyDevLogo.png         # Project logo
src/
  App.jsx              # Main application entry point
  components/          # Core and UI components (CalendarView, NotificationSystem, Scheduler, etc.)
    ui/                # Reusable UI elements (button, dialog, table, etc.)
  hooks/               # Custom React hooks (e.g., use-mobile)
  lib/                 # Utility libraries (e.g., utils.js)
  utils/               # Storage and helper functions
  assets/              # Static assets (SVGs, images)
App.css, index.css     # Global and entry styles
main.jsx               # App bootstrap
index.html             # HTML entry point
vite.config.js         # Vite configuration
package.json           # Project metadata and dependencies
```

## Installation & Setup

1. **Clone the repository**:
   ```sh
   git clone https://github.com/your-org/cortex-task-manager.git
   cd cortex-task-manager
   ```
2. **Install dependencies**:
   ```sh
   pnpm install
   ```
3. **Run the development server**:
   ```sh
   pnpm dev
   ```
4. **Build for production**:
   ```sh
   pnpm build
   ```
5. **Preview production build**:
   ```sh
   pnpm preview
   ```

## Usage

- Access the app at `http://localhost:5173` (default Vite port).
- Create and manage tasks using the intuitive interface.
- Use the calendar view for scheduling and visualization.
- Configure notifications and preferences in the settings panel.

## Deployment

Cortex Task Manager can be deployed to any static hosting service (e.g., Vercel, Netlify, GitHub Pages) after building the production assets:

```sh
pnpm build
```

Upload the contents of the `dist/` folder to your hosting provider.

## Contributing

We welcome contributions from the community! To contribute:

1. Fork the repository and create your feature branch (`git checkout -b feature/your-feature`)
2. Commit your changes with clear messages
3. Push to your branch and open a pull request
4. Ensure your code passes linting and tests

Please review our [contribution guidelines](CONTRIBUTING.md) before submitting PRs.

## Support & Contact

For questions, issues, or feature requests, please open an issue on GitHub or contact the maintainers:
- Eng. [Bassem Hazem](https://github.com/BassemHazemDev)
- Eng. [Amira Ahmed](https://github.com/AmiraAhmedDev)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Project logo: `public/MyDevLogo.png`
- Built with React, Vite, and PNPM
