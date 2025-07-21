import { useState, useRef, useCallback } from 'react';
import { Heart, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { RecordingControls } from './RecordingControls';
import { ConversationDisplay } from './ConversationDisplay';
import { AudioVisualizer } from './AudioVisualizer';

interface Message {
  id: string;
  type: 'user' | 'therapist';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export const UnTherapy = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentUserInput, setCurrentUserInput] = useState('');
  
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

  // Mock AI response for demo (replace with actual AI integration)
  const generateTherapeuticResponse = useCallback((userMessage: string): string => {
    const responses = [
      `I hear you sharing about ${userMessage.toLowerCase()}. That sounds really important to you. Can you tell me more about what's behind that feeling?`,
      `It sounds like you've been experiencing something significant. What was going through your mind when that happened?`,
      `That makes sense - I can understand why that would feel overwhelming. What do you wish could be different about this situation?`,
      `I'm noticing some emotion in what you're sharing. How are you feeling right now as you talk about this?`,
      `Thank you for trusting me with that. What would it look like if this situation felt more manageable for you?`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

  // Mock speech-to-text for demo (replace with actual STT)
  const mockTranscription = useCallback((): string => {
    const mockInputs = [
      "I've been feeling really overwhelmed with work lately",
      "I don't know how to handle all this stress",
      "Sometimes I feel like I'm not good enough",
      "I'm worried about my relationship",
      "I just need someone to listen to me",
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

      // Store interval reference to clear it later
      (window as any).transcriptionInterval = transcriptionInterval;
      
    } catch (err) {
      toast({
        title: "Recording Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [startRecording, mockTranscription, toast]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    clearInterval((window as any).transcriptionInterval);
    
    // Process the recording (mock for demo)
    setTimeout(() => {
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
      setTimeout(() => {
        const aiResponse = generateTherapeuticResponse(transcription);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'therapist',
          content: aiResponse,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMessage]);

        // Speak the response (mock TTS)
        if (!isMuted && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(aiResponse);
          utterance.rate = 0.9;
          utterance.pitch = 1;
          utterance.volume = 0.8;
          
          utterance.onstart = () => setIsPlayingResponse(true);
          utterance.onend = () => setIsPlayingResponse(false);
          
          window.speechSynthesis.speak(utterance);
        }
      }, 1000);

      setCurrentUserInput('');
    }, 500);
  }, [stopRecording, currentUserInput, mockTranscription, audioUrl, generateTherapeuticResponse, isMuted]);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-therapeutic-calm/30 to-therapeutic-warm/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-gentle-float">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Heart className="h-8 w-8 text-therapeutic-pulse" />
            <h1 className="text-3xl font-bold text-foreground">UnTherapy</h1>
            <Heart className="h-8 w-8 text-therapeutic-pulse" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A safe space for deep listening and gentle exploration of your thoughts and feelings
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
            <Card className="p-8 text-center bg-card/80 backdrop-blur-sm shadow-therapeutic border-border/50">
              <div className="space-y-6">
                {/* AI Status Indicator */}
                <div className="flex items-center justify-center space-x-3">
                  <div className={`h-3 w-3 rounded-full ${isPlayingResponse ? 'bg-therapeutic-pulse animate-pulse' : 'bg-muted'}`} />
                  <span className="text-sm text-muted-foreground">
                    {isPlayingResponse ? 'UnTherapy is speaking...' : 'Ready to listen'}
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
              </div>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Remember: This is a supportive space. Take your time, breathe, and share at your own pace.</p>
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