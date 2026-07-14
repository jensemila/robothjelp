import type { Metadata } from "next";
import { ChatApp } from "@/components/chat/ChatApp";

export const metadata: Metadata = {
  title: "Chat",
};

export default function ChatPage() {
  return <ChatApp />;
}
