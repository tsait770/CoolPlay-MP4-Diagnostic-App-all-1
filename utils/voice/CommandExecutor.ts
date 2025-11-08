import { UniversalPlayerController } from '../player/UniversalPlayerController';
import { EnhancedCommandMapper, VoiceCommand, VoiceCommandType } from './EnhancedCommandMapper';

export interface CommandExecutionResult {
  success: boolean;
  command: VoiceCommand;
  message: string;
  error?: string;
}

export class CommandExecutor {
  private controller: UniversalPlayerController | null = null;
  private commandMapper: EnhancedCommandMapper;
  private onUrlOpenRequest?: (url: string) => void;

  constructor() {
    this.commandMapper = EnhancedCommandMapper.getInstance();
    console.log('[CommandExecutor] Initialized');
  }

  setController(controller: UniversalPlayerController): void {
    this.controller = controller;
    console.log('[CommandExecutor] Controller set');
  }

  setOnUrlOpenRequest(callback: (url: string) => void): void {
    this.onUrlOpenRequest = callback;
    console.log('[CommandExecutor] URL open callback set');
  }

  async executeText(text: string): Promise<CommandExecutionResult> {
    console.log('[CommandExecutor] Executing text command:', text);
    
    const command = this.commandMapper.mapFromText(text);
    
    if (command.type === VoiceCommandType.UNKNOWN) {
      return {
        success: false,
        command,
        message: `無法識別指令：${text}`,
        error: 'UNKNOWN_COMMAND',
      };
    }

    return await this.executeCommand(command);
  }

  async executeCommand(command: VoiceCommand): Promise<CommandExecutionResult> {
    console.log('[CommandExecutor] Executing command:', command);

    if (!this.controller && command.type !== VoiceCommandType.OPEN_URL) {
      return {
        success: false,
        command,
        message: '播放器未初始化',
        error: 'CONTROLLER_NOT_SET',
      };
    }

    try {
      switch (command.type) {
        case VoiceCommandType.PLAY:
          await this.controller!.play();
          return { success: true, command, message: '開始播放' };

        case VoiceCommandType.PAUSE:
          await this.controller!.pause();
          return { success: true, command, message: '暫停播放' };

        case VoiceCommandType.STOP:
          await this.controller!.stop();
          return { success: true, command, message: '停止播放' };

        case VoiceCommandType.VOLUME_MAX:
          await this.controller!.setVolume(1.0);
          return { success: true, command, message: '音量已調至最大' };

        case VoiceCommandType.VOLUME_HALF:
          await this.controller!.setVolume(0.5);
          return { success: true, command, message: '音量已調至一半' };

        case VoiceCommandType.VOLUME_ZERO:
          await this.controller!.setVolume(0);
          return { success: true, command, message: '音量已歸零' };

        case VoiceCommandType.VOLUME_UP:
          {
            const currentVolume = this.controller!.getState().volume;
            const newVolume = Math.min(1.0, currentVolume + 0.1);
            await this.controller!.setVolume(newVolume);
            return { success: true, command, message: `音量已調高至 ${Math.round(newVolume * 100)}%` };
          }

        case VoiceCommandType.VOLUME_DOWN:
          {
            const currentVolume = this.controller!.getState().volume;
            const newVolume = Math.max(0, currentVolume - 0.1);
            await this.controller!.setVolume(newVolume);
            return { success: true, command, message: `音量已調低至 ${Math.round(newVolume * 100)}%` };
          }

        case VoiceCommandType.VOLUME_SET:
          if (command.params?.volume !== undefined) {
            await this.controller!.setVolume(command.params.volume);
            return { success: true, command, message: `音量已設定為 ${Math.round(command.params.volume * 100)}%` };
          }
          break;

        case VoiceCommandType.MUTE:
          await this.controller!.setMuted(true);
          return { success: true, command, message: '已靜音' };

        case VoiceCommandType.UNMUTE:
          await this.controller!.setMuted(false);
          return { success: true, command, message: '已取消靜音' };

        case VoiceCommandType.SEEK_FORWARD_10:
          await this.controller!.skipForward(10);
          return { success: true, command, message: '已快轉 10 秒' };

        case VoiceCommandType.SEEK_FORWARD_30:
          await this.controller!.skipForward(30);
          return { success: true, command, message: '已快轉 30 秒' };

        case VoiceCommandType.SEEK_BACKWARD_10:
          await this.controller!.skipBackward(10);
          return { success: true, command, message: '已倒轉 10 秒' };

        case VoiceCommandType.SEEK_BACKWARD_30:
          await this.controller!.skipBackward(30);
          return { success: true, command, message: '已倒轉 30 秒' };

        case VoiceCommandType.SEEK_TO:
          if (command.params?.seekTime !== undefined) {
            const seekTime = command.params.seekTime;
            if (seekTime > 0) {
              await this.controller!.skipForward(seekTime);
              return { success: true, command, message: `已快轉 ${seekTime} 秒` };
            } else {
              await this.controller!.skipBackward(Math.abs(seekTime));
              return { success: true, command, message: `已倒轉 ${Math.abs(seekTime)} 秒` };
            }
          }
          break;

        case VoiceCommandType.SPEED_NORMAL:
          await this.controller!.setPlaybackRate(1.0);
          return { success: true, command, message: '播放速度已設為正常' };

        case VoiceCommandType.SPEED_FAST:
          await this.controller!.setPlaybackRate(2.0);
          return { success: true, command, message: '播放速度已設為 2 倍' };

        case VoiceCommandType.SPEED_SLOW:
          await this.controller!.setPlaybackRate(0.5);
          return { success: true, command, message: '播放速度已設為 0.5 倍' };

        case VoiceCommandType.SPEED_SET:
          if (command.params?.speed !== undefined) {
            await this.controller!.setPlaybackRate(command.params.speed);
            return { success: true, command, message: `播放速度已設為 ${command.params.speed} 倍` };
          }
          break;

        case VoiceCommandType.QUALITY_AUTO:
          await this.controller!.setQuality('auto');
          return { success: true, command, message: '畫質已設為自動' };

        case VoiceCommandType.QUALITY_4K:
          await this.controller!.setQuality('4K');
          return { success: true, command, message: '畫質已設為 4K' };

        case VoiceCommandType.QUALITY_1080P:
          await this.controller!.setQuality('1080p');
          return { success: true, command, message: '畫質已設為 1080p' };

        case VoiceCommandType.QUALITY_720P:
          await this.controller!.setQuality('720p');
          return { success: true, command, message: '畫質已設為 720p' };

        case VoiceCommandType.QUALITY_480P:
          await this.controller!.setQuality('480p');
          return { success: true, command, message: '畫質已設為 480p' };

        case VoiceCommandType.OPEN_URL:
          if (command.params?.url && this.onUrlOpenRequest) {
            this.onUrlOpenRequest(command.params.url);
            return { success: true, command, message: `正在開啟：${command.params.url}` };
          }
          return {
            success: false,
            command,
            message: '無法開啟 URL',
            error: 'NO_URL_CALLBACK',
          };

        default:
          return {
            success: false,
            command,
            message: `不支援的指令類型：${command.type}`,
            error: 'UNSUPPORTED_COMMAND',
          };
      }

      return {
        success: false,
        command,
        message: '執行失敗：缺少必要參數',
        error: 'MISSING_PARAMS',
      };
    } catch (error) {
      console.error('[CommandExecutor] Execution error:', error);
      return {
        success: false,
        command,
        message: `執行失敗：${error}`,
        error: String(error),
      };
    }
  }
}
