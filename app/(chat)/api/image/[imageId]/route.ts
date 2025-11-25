// This route is deprecated - images are now stored directly as data URLs in chat messages
// Keeping this for backward compatibility but it will always return 404
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params;

    if (!imageId) {
      return new Response("imageId is required", { status: 400 });
    }

    // Images are no longer stored in cache - they are embedded as data URLs
    return new Response(
      "Image not found - images are now stored as data URLs in chat messages",
      { status: 404 }
    );
  } catch {
    return new Response("Internal server error", { status: 500 });
  }
}
