// Store for room state
const rooms = new Map<
  string,
  { count: number; subscribers: Set<ReadableStreamDefaultController> }
>();

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Cache-Control",
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // parameter from URL "?room={roomId}"
  const room = searchParams.get("room") || "default";

  if (!rooms.has(room)) {
    rooms.set(room, { count: 0, subscribers: new Set() });
  }

  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
      const roomData = rooms.get(room)!;
      roomData.subscribers.add(controller);

      const initialData = `data: ${JSON.stringify({
        count: roomData.count,
      })}\n\n`;

      try {
        controller.enqueue(encoder.encode(initialData));
        // TODO: Pop up notification for room connection
      } catch (error) {
        console.error("Error sending initial data:", error);
      }
    },
    cancel() {
      const roomData = rooms.get(room);
      if (roomData && controller) {
        roomData.subscribers.delete(controller);
        // TODO: Pop up notification for room disconnection
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}

export async function POST(request: Request) {
  try {
    const { room, count } = await request.json();

    if (!rooms.has(room)) {
      rooms.set(room, { count: 0, subscribers: new Set() });
      // TODO: Pop up notification for room creation
    }

    const roomData = rooms.get(room)!;
    roomData.count = count;

    // Broadcast to all subscribers
    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify({ count })}\n\n`;

    const disconnectedControllers = new Set<ReadableStreamDefaultController>();
    let successfulBroadcasts = 0;

    roomData.subscribers.forEach((controller) => {
      try {
        controller.enqueue(encoder.encode(data));
        successfulBroadcasts++;
        console.log(`Successfully sent count ${count} to a subscriber`);
      } catch (error) {
        console.error("Error sending to subscriber:", error);
        // Mark for removal
        disconnectedControllers.add(controller);
      }
    });

    // Remove disconnected controllers
    disconnectedControllers.forEach((controller) => {
      roomData.subscribers.delete(controller);
    });

    console.log(
      `Broadcast complete: ${successfulBroadcasts} successful, ${disconnectedControllers.size} failed`
    );

    return new Response(
      JSON.stringify({
        success: true,
        subscriberCount: roomData.subscribers.size,
        successfulBroadcasts,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in POST handler:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
