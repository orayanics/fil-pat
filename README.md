# WebSocket Counter App

This is a [Next.js](https://nextjs.org) project with a real-time WebSocket counter that synchronizes across all connected clients.

## Features

- Real-time counter synchronization across multiple browser tabs/clients
- Increment, decrement, and reset functionality
- WebSocket connection status indicator
- Clean, modern UI with Tailwind CSS

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the development server (includes both Next.js and WebSocket server):

```bash
npm run dev
```

Alternatively, you can run them separately:

```bash
# Terminal 1 - Next.js server
npm run dev

# Terminal 2 - WebSocket server only
npm run dev:websocket
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the counter.

## Architecture

- **Next.js Frontend**: Serves the React application with the counter interface
- **WebSocket Server**: Runs on port 8080, handles real-time counter synchronization
- **Custom Server**: Handles HTTP requests on port 3000

## How it works

1. The WebSocket server (`websocket.ts`) maintains a global counter state
2. When clients connect, they receive the current counter value
3. Clients can send increment, decrement, or reset messages
4. The server broadcasts counter updates to all connected clients in real-time

Open multiple browser tabs to see the real-time synchronization in action!

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
