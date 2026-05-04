import { Linking } from "react-native";

const ALLOWED_SCHEMES = ["https:", "http:", "mailto:", "tel:", "whatsapp:"];

export async function safeOpenURL(url: string | null | undefined): Promise<void> {
  if (!url || typeof url !== "string") return;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }

  if (!ALLOWED_SCHEMES.includes(parsed.protocol)) return;

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  } catch {
    // silently ignore — user may not have the app installed
  }
}
