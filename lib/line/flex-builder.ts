import type { FlexCardInput, FlexFormInput } from "./message-schema";

function bubbleFromCard(card: FlexCardInput): Record<string, unknown> {
  const bodyContents: Record<string, unknown>[] = [];

  if (card.title) {
    bodyContents.push({
      type: "text",
      text: card.title,
      weight: "bold",
      size: "lg",
      wrap: true,
    });
  }

  bodyContents.push({
    type: "text",
    text: card.body,
    wrap: true,
  });

  const bubble: Record<string, unknown> = {
    type: "bubble",
    body: { type: "box", layout: "vertical", contents: bodyContents },
  };

  if (card.imageUrl) {
    bubble.hero = {
      type: "image",
      url: card.imageUrl,
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover",
    };
  }

  if (card.actionLabel && card.actionUri) {
    bubble.footer = {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: card.actionLabel,
            uri: card.actionUri,
          },
        },
      ],
    };
  }

  return bubble;
}

export function buildFlexPayloadFromForm(flex: FlexFormInput): {
  altText: string;
  contents: Record<string, unknown>;
} {
  if (flex.pattern === "single") {
    return {
      altText: flex.altText,
      contents: bubbleFromCard(flex.card),
    };
  }

  if (flex.pattern === "carousel") {
    return {
      altText: flex.altText,
      contents: {
        type: "carousel",
        contents: flex.cards.map(bubbleFromCard),
      },
    };
  }

  const parsed = JSON.parse(flex.contentsJson) as Record<string, unknown>;

  return { altText: flex.altText, contents: parsed };
}
