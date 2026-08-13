/**
 * YouTube Live embed for `/vivo`. `channel=<CHANNEL_ID>` (not a specific
 * video id) auto-plays whatever that channel is currently live-streaming —
 * nothing to update per edition/sorteo, it just works whenever the admin
 * goes live on that channel. Falls back to a plain message when the env
 * var isn't set yet (same "ask for the real value, build the plumbing now"
 * pattern as the WhatsApp number / social links).
 */
export function LiveStreamEmbed() {
  const channelId = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;

  if (!channelId) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-champagne/30 bg-surface/40 text-center text-sm text-muted-foreground">
        Todavía no configuramos el canal de YouTube para la transmisión.
      </div>
    );
  }

  return (
    <div className="aspect-video overflow-hidden rounded-2xl border border-champagne/30 bg-surface/40">
      <iframe
        src={`https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1`}
        title="Transmisión en vivo del sorteo"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
