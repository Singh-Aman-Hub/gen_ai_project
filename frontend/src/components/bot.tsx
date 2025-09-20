import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, Bot, User } from "lucide-react";
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI document analyst. Ask me anything about your uploaded document - I can explain clauses, identify risks, or provide additional insights.',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
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
      const userId = localStorage.getItem("user_id") || "demo-user";
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="shadow-card h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <span>AI Assistant</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Scrollable chat messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4" ref={viewportRef}>
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