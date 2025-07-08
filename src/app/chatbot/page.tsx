import { Header } from "@/components/header";
import { ChatInterface } from "@/components/chatbot/chat-interface";

export default function ChatbotPage() {
  return (
    <div className="flex h-full max-h-screen flex-col">
      <Header title="AI Coach" />
      <main className="flex-1 overflow-hidden">
        <ChatInterface />
      </main>
    </div>
  );
}
