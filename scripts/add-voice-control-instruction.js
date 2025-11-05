const fs = require('fs');
const path = require('path');

const translations = {
  'en': 'Use voice commands to control video',
  'zh-TW': '使用語音指令控制影片',
  'zh-CN': '使用语音指令控制影片',
  'ja': '音声コマンドで動画を制御',
  'ko': '음성 명령으로 동영상을 제어합니다',
  'es': 'Use comandos de voz para controlar el video',
  'fr': 'Utilisez des commandes vocales pour contrôler la vidéo',
  'de': 'Verwenden Sie Sprachbefehle zur Videosteuerung',
  'pt': 'Use comandos de voz para controlar o vídeo',
  'pt-BR': 'Use comandos de voz para controlar o vídeo',
  'ru': 'Используйте голосовые команды для управления видео',
  'ar': 'استخدم الأوامر الصوتية للتحكم في الفيديو'
};

const l10nDir = path.join(__dirname, '..', 'l10n');

Object.keys(translations).forEach(lang => {
  const filePath = path.join(l10nDir, `${lang}.json`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Add the new key
    data.voice_control_instruction = translations[lang];
    
    // Write back to file with proper formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    
    console.log(`✅ Updated ${lang}.json`);
  } catch (error) {
    console.error(`❌ Error updating ${lang}.json:`, error.message);
  }
});

console.log('\n✨ Translation update complete!');
