# Connectus VPN Client

A custom, open-source desktop VPN client for Windows, built with Electron and designed to connect to a personal WireGuard server.


## Features

*   **Modern User Interface:** A clean and simple UI built with Electron and styled with Tailwind CSS.
*   **Dynamic Server Selection:** Easily switch between multiple VPN servers by adding them to a simple `servers.json` configuration file.
*   **System Tray Integration:** The application minimizes to the system tray and can be controlled from there, allowing it to run in the background.
*   **Packaged for Distribution:** The project is configured with `electron-builder` to create a standard Windows `.exe` installer.
*   **Secure:** Uses the robust and modern WireGuard protocol. Client secrets are not stored in the source code.

## How It Works

This project consists of two main parts:

1.  **The Backend:** A standard WireGuard server running on a cloud VM. The server is responsible for routing all the client's internet traffic.
2.  **The Client:** A desktop application built with Electron. The application does not contain any VPN logic itself. Instead, it acts as a user-friendly graphical interface that controls the official WireGuard for Windows command-line tool in the background.

When you click "Connect", the app dynamically generates a WireGuard configuration file and uses a privileged command to tell the WireGuard service on your computer to establish a connection.

## Setup and Installation

To use this project, you need to have your own WireGuard server already set up.


### Client Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/AbdulkadirBastug/Connectus
    cd Connectus
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create your client identity file:**
    *   Copy the example file: `copy client-identity.json.example client-identity.json`
    *   Open `client-identity.json` and paste in the **private key** for your client.

4.  **Configure your servers:**
    *   Open `servers.json`.
    *   Add the details for your WireGuard servers, including a name, the `Endpoint` (IP address and port), and the server's `PublicKey`.

### Running the App

*   **To run in development mode:**
    ```bash
    npm start
    ```

*   **To build the installer:**
    ```bash
    npm run build
    ```
    The installer will be located in the `dist` folder.