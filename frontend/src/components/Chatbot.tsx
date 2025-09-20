import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Send, MessageCircle, Bot, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import apiService from "@/services/service";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  isLoading?: boolean;
}

const Chatbot = ({ isLoading = false }: ChatbotProps) => {
  const STORAGE_KEY = (localStorage.getItem("user_id") || "demo-user") + "_chat_messages";

  const getInitialMessages = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }));
      } catch {
        return [
          {
            id: '1',
            type: 'ai',
            content: "Hello! I'm your AI document analyst. Ask me anything about your uploaded document - I can explain clauses, identify risks, or provide additional insights.",
            timestamp: new Date()
          }
        ];
      }
    }
    return [
      {
        id: '1',
        type: 'ai',
        content: "Hello! I'm your AI document analyst. Ask me anything about your uploaded document - I can explain clauses, identify risks, or provide additional insights.",
        timestamp: new Date()
      }
    ];
  };

  const [messages, setMessages] = useState<Message[]>(getInitialMessages());
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages or typing change
  useLayoutEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Always use user.id from localStorage for chat
      let userId = null;
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          userId = JSON.parse(userStr).id;
        } catch {
          userId = null;
        }
      }
      if (!userId) {
        throw new Error("No user ID found. Please login.");
      }
      const res = await apiService.chatWithUser(userId, userMessage.content);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: res.data.response || 'No response from AI.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDeleteChat = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([
      {
        id: '1',
        type: 'ai',
        content: "Hello! I'm your AI document analyst. Ask me anything about your uploaded document - I can explain clauses, identify risks, or provide additional insights.",
        timestamp: new Date()
      }
    ]);
  };

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Persist messages to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  return (
    <Card className="shadow-card h-full flex flex-col">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">AI Assistant</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          aria-label="Delete chat"
          onClick={handleDeleteChat}
          className="border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-2 px-3 py-1 rounded-md shadow-sm"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete Chats
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Scrollable chat messages */}
        <ScrollArea
          className="flex-1 p-4 overflow-y-auto"
          ref={scrollAreaRef}
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="flex flex-col space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div className="p-2 rounded-lg">
                  {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`flex-1 max-w-[80%] ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`inline-block p-3 rounded-lg ${
                      message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{formatTime(message.timestamp)}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>
        </ScrollArea>

        {/* Fixed input box */}
        <form
          onSubmit={handleSendMessage}
          className="flex space-x-2 w-full bg-background p-4 border-t"
        >
          <Input
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            placeholder="Ask me about your document..."
            disabled={isLoading || isTyping}
            className="flex-1"
          />
          <Button type="submit" disabled={!inputMessage.trim() || isLoading || isTyping} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Chatbot;