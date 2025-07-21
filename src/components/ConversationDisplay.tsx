import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { AudioVisualizer } from './AudioVisualizer';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

interface ConversationDisplayProps {
  messages: Message[];
  isListening: boolean;
  currentUserInput?: string;
}

export const ConversationDisplay = ({ 
  messages, 
  isListening, 
  currentUserInput 
}: ConversationDisplayProps) => {
  return (
    <Card className="h-96 p-4 bg-gradient-to-b from-ai-listening to-background border-border/50">
      <ScrollArea className="h-full">
        <div className="space-y-4">
          {messages.length === 0 && !isListening && (
            <div className="flex items-center justify-center h-full text-center">
              <div className="space-y-2">
                <div className="text-lg font-medium text-foreground">
                  AI Voice Assistant
                </div>
                <p className="text-sm text-muted-foreground max-w-md">
                  I'm your AI assistant. Press the microphone button and start speaking - 
                  I'll listen, understand, and respond with both text and voice.
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-gentle
                  ${message.type === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card text-card-foreground border border-border/50'
                  }
                `}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  {message.audioUrl && (
                    <button 
                      className="text-xs opacity-70 hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const audio = new Audio(message.audioUrl);
                        audio.play();
                      }}
                    >
                      🔊
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Live transcription while recording */}
          {isListening && currentUserInput && (
            <div className="flex justify-end">
              <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-primary/80 text-primary-foreground">
                <div className="flex items-center space-x-2">
                  <AudioVisualizer 
                    isActive={true} 
                    type="listening" 
                    className="flex-shrink-0" 
                  />
                  <p className="text-sm leading-relaxed italic">
                    {currentUserInput}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Listening indicator */}
          {isListening && !currentUserInput && (
            <div className="flex justify-center">
              <div className="flex items-center space-x-3 px-4 py-2 rounded-full bg-ai-listening border border-border/50">
                <AudioVisualizer isActive={true} type="listening" />
                <span className="text-sm text-muted-foreground">Listening...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};