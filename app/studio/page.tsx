import { requireChatGPTUser } from "../chatgpt-auth";
import StudioClient from "./studio-client";

export const dynamic = "force-dynamic";
export default async function StudioPage() {
  const user = await requireChatGPTUser("/studio");
  return <StudioClient userName={user.displayName} />;
}
