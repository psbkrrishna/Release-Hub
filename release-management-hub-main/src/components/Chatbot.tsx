
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your Knowledge Assistant. I can help you find information about features, documentation, and release notes. What would you like to know?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('hire') || input.includes('candidate')) {
      return 'I can help you with Hire module features like Candidate Scoring, Interview Scheduling, and Application Tracking. Would you like documentation or video tutorials for any specific feature?';
    }
    
    if (input.includes('amplify') || input.includes('performance')) {
      return 'The Amplify module includes Performance Analytics, Goal Setting, and Feedback System features. I have comprehensive guides and training materials available. What specific aspect would you like to explore?';
    }
    
    if (input.includes('analytics') || input.includes('dashboard')) {
      return 'Our Analytics module offers Custom Dashboards, Data Export, and Report Builder functionality. I can provide detailed documentation and step-by-step video guides. Which feature interests you most?';
    }
    
    if (input.includes('brand') || input.includes('logo') || input.includes('theme')) {
      return 'The Brand module handles Logo Management, Theme Customization, and Brand Guidelines. I have setup guides and customization tutorials available. How can I assist with your branding needs?';
    }
    
    if (input.includes('plan') || input.includes('subscription') || input.includes('billing')) {
      return 'The Plan module covers Subscription Management, Usage Tracking, and Billing Integration. I can help you understand pricing tiers, usage limits, and billing processes. What would you like to know?';
    }
    
    if (input.includes('release') || input.includes('update')) {
      return 'I can provide information about the latest release notes, feature updates, and version history for all modules. Which module\'s release information are you looking for?';
    }
    
    return 'I understand you\'re looking for information. I can help you with documentation, video tutorials, and release notes for our Hire, Amplify, Analytics, Brand, and Plan modules. Could you be more specific about what you need?';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages Area - Takes remaining space and scrolls */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Bot className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      
      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about features, docs, or releases..."
            className="flex-1"
          />
          <Button onClick={handleSendMessage} size="sm">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
