import { streamSupportChat } from "@banking/database";

export async function GET() {
  const messages = await streamSupportChat();
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      for (const message of messages) {
        controller.enqueue(
          encoder.encode(
            `event: message\ndata: ${JSON.stringify(message)}\n\n`
          )
        );
      }

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache"
    }
  });
}
