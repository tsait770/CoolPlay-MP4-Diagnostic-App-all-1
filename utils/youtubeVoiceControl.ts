/**
 * Voice Control Integration for YouTube WebView Player
 * 
 * This utility provides seamless integration between the voice control system
 * and the YouTube WebView player controls.
 */

import { YouTubePlayerControls } from '@/components/YouTubeWebViewPlayer';

/**
 * Get the active YouTube WebView player controls
 * Returns null if no YouTube WebView player is currently active
 */
export function getYouTubeWebViewControls(): YouTubePlayerControls | null {
  if (typeof global !== 'undefined' && (global as any).youtubeWebViewControls) {
    return (global as any).youtubeWebViewControls as YouTubePlayerControls;
  }
  return null;
}

/**
 * Check if YouTube WebView player is currently active and ready for commands
 */
export function isYouTubeWebViewReady(): boolean {
  return getYouTubeWebViewControls() !== null;
}

/**
 * Execute a voice command on the YouTube WebView player
 * 
 * @param command - The voice command intent (e.g., 'PlayVideoIntent', 'PauseVideoIntent')
 * @param params - Optional parameters for the command (e.g., { seconds: 30 })
 * @returns true if command was executed, false if player not ready
 */
export function executeYouTubeWebViewCommand(
  command: string,
  params?: { seconds?: number; volume?: number; rate?: number }
): boolean {
  const controls = getYouTubeWebViewControls();
  
  if (!controls) {
    console.log('[YouTubeVoiceControl] Player not ready, command ignored:', command);
    return false;
  }

  console.log('[YouTubeVoiceControl] Executing command:', command, params);

  try {
    switch (command) {
      case 'PlayVideoIntent':
      case 'play':
        controls.play();
        break;

      case 'PauseVideoIntent':
      case 'pause':
        controls.pause();
        break;

      case 'StopVideoIntent':
      case 'stop':
        controls.stop();
        break;

      case 'Forward10Intent':
      case 'forward_10':
        controls.seekForward(params?.seconds || 10);
        break;

      case 'Forward20Intent':
      case 'forward_20':
        controls.seekForward(params?.seconds || 20);
        break;

      case 'Forward30Intent':
      case 'forward_30':
        controls.seekForward(params?.seconds || 30);
        break;

      case 'Rewind10Intent':
      case 'rewind_10':
        controls.seekBackward(params?.seconds || 10);
        break;

      case 'Rewind20Intent':
      case 'rewind_20':
        controls.seekBackward(params?.seconds || 20);
        break;

      case 'Rewind30Intent':
      case 'rewind_30':
        controls.seekBackward(params?.seconds || 30);
        break;

      case 'VolumeMaxIntent':
      case 'volume_max':
        controls.setVolume(1.0);
        break;

      case 'VolumeUpIntent':
      case 'volume_up':
        controls.setVolume(Math.min(1.0, (params?.volume || 0.8) + 0.2));
        break;

      case 'VolumeDownIntent':
      case 'volume_down':
        controls.setVolume(Math.max(0, (params?.volume || 0.8) - 0.2));
        break;

      case 'MuteIntent':
      case 'mute':
        controls.mute();
        break;

      case 'UnmuteIntent':
      case 'unmute':
        controls.unmute();
        break;

      case 'SpeedHalfIntent':
      case 'speed_0_5':
        controls.setPlaybackRate(0.5);
        break;

      case 'SpeedNormalIntent':
      case 'speed_normal':
        controls.setPlaybackRate(1.0);
        break;

      case 'Speed125Intent':
      case 'speed_1_25':
        controls.setPlaybackRate(1.25);
        break;

      case 'Speed150Intent':
      case 'speed_1_5':
        controls.setPlaybackRate(1.5);
        break;

      case 'Speed200Intent':
      case 'speed_2_0':
        controls.setPlaybackRate(2.0);
        break;

      case 'ReplayVideoIntent':
      case 'replay':
        controls.seekTo(0);
        controls.play();
        break;

      default:
        console.log('[YouTubeVoiceControl] Unknown command:', command);
        return false;
    }

    return true;
  } catch (error) {
    console.error('[YouTubeVoiceControl] Error executing command:', error);
    return false;
  }
}

/**
 * Get current playback status from YouTube WebView player
 */
export async function getYouTubeWebViewStatus(): Promise<{
  currentTime: number;
  duration: number;
  state: string;
} | null> {
  const controls = getYouTubeWebViewControls();
  
  if (!controls) {
    return null;
  }

  try {
    const [currentTime, duration, state] = await Promise.all([
      controls.getCurrentTime(),
      controls.getDuration(),
      controls.getPlayerState(),
    ]);

    return { currentTime, duration, state };
  } catch (error) {
    console.error('[YouTubeVoiceControl] Error getting status:', error);
    return null;
  }
}

/**
 * Example: How to use in VoiceControlProvider
 * 
 * Add this to the voice command handler in VoiceControlProvider.tsx:
 * 
 * ```typescript
 * import { executeYouTubeWebViewCommand, isYouTubeWebViewReady } from '@/utils/youtubeVoiceControl';
 * 
 * // In the command execution logic:
 * const executeCommand = useCallback(async (command: VoiceCommand) => {
 *   // First check if YouTube WebView player is active
 *   if (isYouTubeWebViewReady()) {
 *     const executed = executeYouTubeWebViewCommand(command.intent, command.slot);
 *     if (executed) {
 *       console.log('Command executed on YouTube WebView player');
 *       return;
 *     }
 *   }
 *   
 *   // Otherwise, use existing logic for native player
 *   const event = new CustomEvent('voiceCommand', {
 *     detail: {
 *       intent: command.intent,
 *       action: command.action,
 *       slot: command.slot,
 *     },
 *   });
 *   window.dispatchEvent(event);
 * }, []);
 * ```
 */
