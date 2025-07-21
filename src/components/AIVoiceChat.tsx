import { useState, useRef, useCallback } from 'react';
import { Bot, Volume2, VolumeX, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { RecordingControls } from './RecordingControls';
import { ConversationDisplay } from './ConversationDisplay';
import { AudioVisualizer } from './AudioVisualizer';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export const AIVoiceChat = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentUserInput, setCurrentUserInput] = useState('');
  
  // API Keys
  const [openaiKey, setOpenaiKey] = useState('');
  const [elevenlabsKey, setElevenlabsKey] = useState('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const {
    state,
    isRecording,
    audioBlob,
    audioUrl,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    error,
  } = useAudioRecorder();

  // OpenAI Chat Completion
  const generateAIResponse = useCallback(async (userMessage: string): Promise<string> => {
    if (!openaiKey) {
      return "Please add your OpenAI API key in the settings to enable AI responses.";
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant. Respond naturally and conversationally to user questions. Keep responses concise but helpful.'
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error('OpenAI API error:', error);
      return "I'm having trouble connecting to the AI service. Please check your API key and try again.";
    }
  }, [openaiKey]);

  // ElevenLabs Text-to-Speech
  const speakText = useCallback(async (text: string) => {
    if (!elevenlabsKey || isMuted) return;

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x', {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenlabsKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onplay = () => setIsPlayingResponse(true);
      audio.onended = () => {
        setIsPlayingResponse(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.onstart = () => setIsPlayingResponse(true);
        utterance.onend = () => setIsPlayingResponse(false);
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [elevenlabsKey, isMuted]);

  // Mock speech-to-text for demo (replace with actual STT)
  const mockTranscription = useCallback((): string => {
    const mockInputs = [
      "Hello, how are you today?",
      "What's the weather like?",
      "Can you help me with a question?",
      "Tell me about artificial intelligence",
      "What can you do for me?",
    ];
    return mockInputs[Math.floor(Math.random() * mockInputs.length)];
  }, []);

  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
      setCurrentUserInput('');
      
      // Simulate live transcription for demo
      const transcriptionInterval = setInterval(() => {
        if (Math.random() > 0.7) {
          setCurrentUserInput(prev => prev + ' ' + mockTranscription().split(' ').slice(0, 3).join(' '));
        }
      }, 1500);

      (window as any).transcriptionInterval = transcriptionInterval;
      
    } catch (err) {
      toast({
        title: "Recording Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [startRecording, mockTranscription, toast]);

  const handleStopRecording = useCallback(async () => {
    stopRecording();
    clearInterval((window as any).transcriptionInterval);
    
    // Process the recording
    setTimeout(async () => {
      const transcription = currentUserInput || mockTranscription();
      
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: transcription,
        timestamp: new Date(),
        audioUrl: audioUrl || undefined,
      };

      setMessages(prev => [...prev, userMessage]);

      // Generate and add AI response
      const aiResponse = await generateAIResponse(transcription);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Speak the response
      await speakText(aiResponse);

      setCurrentUserInput('');
    }, 500);
  }, [stopRecording, currentUserInput, mockTranscription, audioUrl, generateAIResponse, speakText]);

  const handlePlayRecording = useCallback(() => {
    if (audioUrl && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [audioUrl]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsPlayingResponse(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-ai-primary/5 to-ai-secondary/10 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-float">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Bot className="h-8 w-8 text-ai-primary" />
            <h1 className="text-3xl font-bold text-foreground">AI Voice Chat</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>API Configuration</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <Input
                      id="openai-key"
                      type="password"
                      placeholder="sk-..."
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a>
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="elevenlabs-key">ElevenLabs API Key</Label>
                    <Input
                      id="elevenlabs-key"
                      type="password"
                      placeholder="..."
                      value={elevenlabsKey}
                      onChange={(e) => setElevenlabsKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Get your API key from <a href="https://elevenlabs.io/" target="_blank" rel="noopener noreferrer" className="underline">ElevenLabs</a>
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your AI voice assistant powered by OpenAI and ElevenLabs
          </p>
        </div>

        {/* Main Interface */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Conversation Display */}
          <div className="order-2 lg:order-1">
            <ConversationDisplay 
              messages={messages}
              isListening={isRecording}
              currentUserInput={currentUserInput}
            />
          </div>

          {/* Recording Controls */}
          <div className="order-1 lg:order-2">
            <Card className="p-8 text-center bg-card/80 backdrop-blur-sm shadow-main border-border/50">
              <div className="space-y-6">
                {/* AI Status Indicator */}
                <div className="flex items-center justify-center space-x-3">
                  <div className={`h-3 w-3 rounded-full ${isPlayingResponse ? 'bg-ai-pulse animate-pulse' : 'bg-muted'}`} />
                  <span className="text-sm text-muted-foreground">
                    {isPlayingResponse ? 'AI is speaking...' : 'Ready to chat'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="p-1"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Audio Visualizer */}
                <div className="flex justify-center">
                  <AudioVisualizer
                    isActive={isRecording || isPlayingResponse}
                    type={isRecording ? 'listening' : isPlayingResponse ? 'speaking' : 'idle'}
                    className="h-16"
                  />
                </div>

                {/* Recording Controls */}
                <RecordingControls
                  state={state}
                  onStartRecording={handleStartRecording}
                  onStopRecording={handleStopRecording}
                  onPauseRecording={pauseRecording}
                  onResumeRecording={resumeRecording}
                  onClearRecording={clearRecording}
                  onPlayRecording={handlePlayRecording}
                  hasRecording={!!audioUrl}
                  error={error}
                />

                {/* Duration Display */}
                {duration > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Recording duration: {duration.toFixed(1)}s
                  </div>
                )}

                {/* API Status */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center justify-center space-x-4">
                    <span className={`flex items-center space-x-1 ${openaiKey ? 'text-green-600' : 'text-orange-500'}`}>
                      <div className={`h-2 w-2 rounded-full ${openaiKey ? 'bg-green-500' : 'bg-orange-400'}`} />
                      <span>OpenAI</span>
                    </span>
                    <span className={`flex items-center space-x-1 ${elevenlabsKey ? 'text-green-600' : 'text-orange-500'}`}>
                      <div className={`h-2 w-2 rounded-full ${elevenlabsKey ? 'bg-green-500' : 'bg-orange-400'}`} />
                      <span>ElevenLabs</span>
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground space-y-2">
          <p>🎤 Press and hold to record • 🔊 AI responses with natural voice</p>
          <p className="text-xs">
            <strong>Production Note:</strong> For secure API key storage, connect to Supabase and use Edge Functions
          </p>
        </div>

        {/* Hidden audio element for playback */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onLoadedMetadata={() => {
              if (audioRef.current) {
                setCurrentUserInput('');
              }
            }}
          />
        )}
      </div>
    </div>
  );
};