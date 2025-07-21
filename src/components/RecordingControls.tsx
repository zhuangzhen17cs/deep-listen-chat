import { Mic, MicOff, Play, Pause, Square, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecorderState } from '@/hooks/useAudioRecorder';

interface RecordingControlsProps {
  state: RecorderState;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onClearRecording: () => void;
  onPlayRecording?: () => void;
  isPlaying?: boolean;
  hasRecording: boolean;
  error?: string | null;
}

export const RecordingControls = ({
  state,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onClearRecording,
  onPlayRecording,
  isPlaying = false,
  hasRecording,
  error
}: RecordingControlsProps) => {
  const getMicButtonVariant = () => {
    if (state === 'recording') return 'default';
    if (state === 'paused') return 'secondary';
    return 'outline';
  };

  const getMicIcon = () => {
    if (state === 'recording') return Mic;
    if (state === 'paused') return MicOff;
    return Mic;
  };

  const MicIcon = getMicIcon();

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Main Recording Button */}
      <div className="relative">
        <Button
          size="lg"
          variant={getMicButtonVariant()}
          onClick={() => {
            if (state === 'idle' || state === 'stopped') {
              onStartRecording();
            } else if (state === 'recording') {
              onPauseRecording();
            } else if (state === 'paused') {
              onResumeRecording();
            }
          }}
          className={`
            h-16 w-16 rounded-full shadow-lg transition-all duration-300
            ${state === 'recording' ? 'animate-therapeutic-pulse shadow-therapeutic' : ''}
            ${state === 'paused' ? 'bg-therapeutic-warm hover:bg-therapeutic-warm/90' : ''}
          `}
          disabled={!!error}
        >
          <MicIcon className="h-6 w-6" />
        </Button>
        
        {/* Recording indicator */}
        {state === 'recording' && (
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center space-x-3">
        {/* Stop Recording */}
        {(state === 'recording' || state === 'paused') && (
          <Button
            variant="outline"
            size="sm"
            onClick={onStopRecording}
            className="rounded-full"
          >
            <Square className="h-4 w-4" />
          </Button>
        )}

        {/* Play Recording */}
        {hasRecording && onPlayRecording && state !== 'recording' && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPlayRecording}
            className="rounded-full"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        )}

        {/* Clear Recording */}
        {hasRecording && state !== 'recording' && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearRecording}
            className="rounded-full text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Status Text */}
      <div className="text-center">
        {error && (
          <p className="text-sm text-destructive mb-2">{error}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {state === 'idle' && 'Tap to start speaking'}
          {state === 'recording' && 'Recording... Tap to pause'}
          {state === 'paused' && 'Paused. Tap to resume'}
          {state === 'stopped' && hasRecording && 'Recording ready'}
        </p>
      </div>
    </div>
  );
};