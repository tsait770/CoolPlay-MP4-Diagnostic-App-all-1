const fs = require('fs');
const path = require('path');

const l10nDir = path.join(__dirname, '..', 'l10n');

const missingKeys = {
  "tap_to_speak": {
    "en": "Tap to Speak",
    "zh-TW": "點擊說話",
    "zh-CN": "点击说话",
    "ja": "タップして話す",
    "ko": "탭하여 말하기",
    "es": "Toca para hablar",
    "fr": "Appuyez pour parler",
    "de": "Tippen zum Sprechen",
    "pt": "Toque para falar",
    "pt-BR": "Toque para falar",
    "ru": "Нажмите, чтобы говорить",
    "ar": "اضغط للتحدث"
  },
  "continuous_listening": {
    "en": "Continuous Listening",
    "zh-TW": "持續聆聽",
    "zh-CN": "持续聆听",
    "ja": "継続リスニング",
    "ko": "지속 청취",
    "es": "Escucha continua",
    "fr": "Écoute continue",
    "de": "Kontinuierliches Zuhören",
    "pt": "Escuta contínua",
    "pt-BR": "Escuta contínua",
    "ru": "Непрерывное прослушивание",
    "ar": "الاستماع المستمر"
  },
  "load_from_url": {
    "en": "Load from URL",
    "zh-TW": "從網址載入",
    "zh-CN": "从网址载入",
    "ja": "URLから読み込む",
    "ko": "URL에서 로드",
    "es": "Cargar desde URL",
    "fr": "Charger depuis l'URL",
    "de": "Von URL laden",
    "pt": "Carregar do URL",
    "pt-BR": "Carregar do URL",
    "ru": "Загрузить из URL",
    "ar": "تحميل من الرابط"
  },
  "enter_video_url": {
    "en": "Enter Video URL",
    "zh-TW": "輸入影片網址",
    "zh-CN": "输入影片网址",
    "ja": "動画URLを入力",
    "ko": "비디오 URL 입력",
    "es": "Ingrese URL del video",
    "fr": "Entrez l'URL de la vidéo",
    "de": "Video-URL eingeben",
    "pt": "Digite o URL do vídeo",
    "pt-BR": "Digite o URL do vídeo",
    "ru": "Введите URL видео",
    "ar": "أدخل رابط الفيديو"
  },
  "video_url": {
    "en": "Video URL",
    "zh-TW": "影片網址",
    "zh-CN": "影片网址",
    "ja": "動画URL",
    "ko": "비디오 URL",
    "es": "URL del video",
    "fr": "URL de la vidéo",
    "de": "Video-URL",
    "pt": "URL do vídeo",
    "pt-BR": "URL do vídeo",
    "ru": "URL видео",
    "ar": "رابط الفيديو"
  },
  "video_url_placeholder": {
    "en": "https://example.com/video.mp4",
    "zh-TW": "https://example.com/video.mp4",
    "zh-CN": "https://example.com/video.mp4",
    "ja": "https://example.com/video.mp4",
    "ko": "https://example.com/video.mp4",
    "es": "https://example.com/video.mp4",
    "fr": "https://example.com/video.mp4",
    "de": "https://example.com/video.mp4",
    "pt": "https://example.com/video.mp4",
    "pt-BR": "https://example.com/video.mp4",
    "ru": "https://example.com/video.mp4",
    "ar": "https://example.com/video.mp4"
  },
  "video_url_input_hint": {
    "en": "Enter the URL of the video you want to play",
    "zh-TW": "輸入您想要播放的視頻網址",
    "zh-CN": "输入您想要播放的视频网址",
    "ja": "再生したい動画のURLを入力してください",
    "ko": "재생하려는 동영상의 URL을 입력하세요",
    "es": "Ingrese la URL del video que desea reproducir",
    "fr": "Entrez l'URL de la vidéo que vous souhaitez lire",
    "de": "Geben Sie die URL des Videos ein, das Sie abspielen möchten",
    "pt": "Digite o URL do vídeo que deseja reproduzir",
    "pt-BR": "Digite o URL do vídeo que deseja reproduzir",
    "ru": "Введите URL видео, которое вы хотите воспроизвести",
    "ar": "أدخل رابط الفيديو الذي تريد تشغيله"
  },
  "supported_video_sources": {
    "en": "Supported Video Sources",
    "zh-TW": "支援的影片來源",
    "zh-CN": "支持的影片来源",
    "ja": "サポートされている動画ソース",
    "ko": "지원되는 비디오 소스",
    "es": "Fuentes de video admitidas",
    "fr": "Sources vidéo prises en charge",
    "de": "Unterstützte Videoquellen",
    "pt": "Fontes de vídeo suportadas",
    "pt-BR": "Fontes de vídeo suportadas",
    "ru": "Поддерживаемые источники видео",
    "ar": "مصادر الفيديو المدعومة"
  },
  "direct_video_files": {
    "en": "Direct video files (MP4, etc.)",
    "zh-TW": "直接視頻文件（MP4等）",
    "zh-CN": "直接视频文件（MP4等）",
    "ja": "ダイレクト動画ファイル（MP4など）",
    "ko": "직접 비디오 파일 (MP4 등)",
    "es": "Archivos de video directos (MP4, etc.)",
    "fr": "Fichiers vidéo directs (MP4, etc.)",
    "de": "Direkte Videodateien (MP4, etc.)",
    "pt": "Arquivos de vídeo diretos (MP4, etc.)",
    "pt-BR": "Arquivos de vídeo diretos (MP4, etc.)",
    "ru": "Прямые видеофайлы (MP4 и т.д.)",
    "ar": "ملفات الفيديو المباشرة (MP4، إلخ.)"
  },
  "video_platforms": {
    "en": "Video platforms (YouTube, Vimeo)",
    "zh-TW": "視頻平台（YouTube、Vimeo）",
    "zh-CN": "视频平台（YouTube、Vimeo）",
    "ja": "動画プラットフォーム（YouTube、Vimeo）",
    "ko": "비디오 플랫폼 (YouTube, Vimeo)",
    "es": "Plataformas de video (YouTube, Vimeo)",
    "fr": "Plateformes vidéo (YouTube, Vimeo)",
    "de": "Videoplattformen (YouTube, Vimeo)",
    "pt": "Plataformas de vídeo (YouTube, Vimeo)",
    "pt-BR": "Plataformas de vídeo (YouTube, Vimeo)",
    "ru": "Видеоплатформы (YouTube, Vimeo)",
    "ar": "منصات الفيديو (YouTube، Vimeo)"
  },
  "social_media_videos": {
    "en": "Social media videos",
    "zh-TW": "社交媒體視頻",
    "zh-CN": "社交媒体视频",
    "ja": "ソーシャルメディア動画",
    "ko": "소셜 미디어 동영상",
    "es": "Videos de redes sociales",
    "fr": "Vidéos des réseaux sociaux",
    "de": "Social Media-Videos",
    "pt": "Vídeos de redes sociais",
    "pt-BR": "Vídeos de redes sociais",
    "ru": "Видео из социальных сетей",
    "ar": "مقاطع فيديو وسائل التواصل الاجتماعي"
  },
  "adult_sites_18plus": {
    "en": "Adult sites (18+)",
    "zh-TW": "成人網站（18+）",
    "zh-CN": "成人网站（18+）",
    "ja": "アダルトサイト（18+）",
    "ko": "성인 사이트 (18+)",
    "es": "Sitios para adultos (18+)",
    "fr": "Sites pour adultes (18+)",
    "de": "Erwachsenenseiten (18+)",
    "pt": "Sites adultos (18+)",
    "pt-BR": "Sites adultos (18+)",
    "ru": "Сайты для взрослых (18+)",
    "ar": "مواقع البالغين (18+)"
  },
  "cloud_videos": {
    "en": "Cloud storage videos",
    "zh-TW": "雲端儲存視頻",
    "zh-CN": "云端存储视频",
    "ja": "クラウドストレージ動画",
    "ko": "클라우드 스토리지 동영상",
    "es": "Videos de almacenamiento en la nube",
    "fr": "Vidéos de stockage cloud",
    "de": "Cloud-Speicher-Videos",
    "pt": "Vídeos de armazenamento em nuvem",
    "pt-BR": "Vídeos de armazenamento em nuvem",
    "ru": "Видео из облачного хранилища",
    "ar": "مقاطع فيديو التخزين السحابي"
  },
  "local_videos": {
    "en": "Local video files",
    "zh-TW": "本地視頻文件",
    "zh-CN": "本地视频文件",
    "ja": "ローカル動画ファイル",
    "ko": "로컬 비디오 파일",
    "es": "Archivos de video locales",
    "fr": "Fichiers vidéo locaux",
    "de": "Lokale Videodateien",
    "pt": "Arquivos de vídeo locais",
    "pt-BR": "Arquivos de vídeo locais",
    "ru": "Локальные видеофайлы",
    "ar": "ملفات الفيديو المحلية"
  },
  "direct_url_streams": {
    "en": "Direct URL streams",
    "zh-TW": "直接URL串流",
    "zh-CN": "直接URL流",
    "ja": "ダイレクトURLストリーム",
    "ko": "직접 URL 스트림",
    "es": "Transmisiones de URL directas",
    "fr": "Flux d'URL directs",
    "de": "Direkte URL-Streams",
    "pt": "Streams de URL diretos",
    "pt-BR": "Streams de URL diretos",
    "ru": "Прямые URL-потоки",
    "ar": "البث المباشر عبر الرابط"
  },
  "adult_content_age_verification": {
    "en": "Adult content requires age verification",
    "zh-TW": "成人內容需要年齡驗證",
    "zh-CN": "成人内容需要年龄验证",
    "ja": "アダルトコンテンツには年齢確認が必要です",
    "ko": "성인 콘텐츠는 연령 확인이 필요합니다",
    "es": "El contenido para adultos requiere verificación de edad",
    "fr": "Le contenu pour adultes nécessite une vérification de l'âge",
    "de": "Erwachseneninhalte erfordern Altersverifikation",
    "pt": "O conteúdo adulto requer verificação de idade",
    "pt-BR": "O conteúdo adulto requer verificação de idade",
    "ru": "Контент для взрослых требует подтверждения возраста",
    "ar": "المحتوى الخاص بالبالغين يتطلب التحقق من العمر"
  },
  "supported_video_formats": {
    "en": "Supported Video Formats",
    "zh-TW": "支援的視頻格式",
    "zh-CN": "支持的视频格式",
    "ja": "サポートされている動画形式",
    "ko": "지원되는 비디오 형식",
    "es": "Formatos de video admitidos",
    "fr": "Formats vidéo pris en charge",
    "de": "Unterstützte Videoformate",
    "pt": "Formatos de vídeo suportados",
    "pt-BR": "Formatos de vídeo suportados",
    "ru": "Поддерживаемые форматы видео",
    "ar": "تنسيقات الفيديو المدعومة"
  },
  "container_formats": {
    "en": "Container Formats",
    "zh-TW": "容器格式",
    "zh-CN": "容器格式",
    "ja": "コンテナ形式",
    "ko": "컨테이너 형식",
    "es": "Formatos de contenedor",
    "fr": "Formats de conteneur",
    "de": "Containerformate",
    "pt": "Formatos de contêiner",
    "pt-BR": "Formatos de contêiner",
    "ru": "Форматы контейнеров",
    "ar": "صيغ الحاوية"
  },
  "streaming_protocols": {
    "en": "Streaming Protocols",
    "zh-TW": "串流協議",
    "zh-CN": "流协议",
    "ja": "ストリーミングプロトコル",
    "ko": "스트리밍 프로토콜",
    "es": "Protocolos de transmisión",
    "fr": "Protocoles de streaming",
    "de": "Streaming-Protokolle",
    "pt": "Protocolos de streaming",
    "pt-BR": "Protocolos de streaming",
    "ru": "Протоколы потоковой передачи",
    "ar": "بروتوكولات البث"
  },
  "video_codecs": {
    "en": "Video Codecs",
    "zh-TW": "視頻編解碼器",
    "zh-CN": "视频编解码器",
    "ja": "ビデオコーデック",
    "ko": "비디오 코덱",
    "es": "Códecs de video",
    "fr": "Codecs vidéo",
    "de": "Video-Codecs",
    "pt": "Codecs de vídeo",
    "pt-BR": "Codecs de vídeo",
    "ru": "Видеокодеки",
    "ar": "ترميز الفيديو"
  },
  "audio_codecs": {
    "en": "Audio Codecs",
    "zh-TW": "音頻編解碼器",
    "zh-CN": "音频编解码器",
    "ja": "オーディオコーデック",
    "ko": "오디오 코덱",
    "es": "Códecs de audio",
    "fr": "Codecs audio",
    "de": "Audio-Codecs",
    "pt": "Codecs de áudio",
    "pt-BR": "Codecs de áudio",
    "ru": "Аудиокодеки",
    "ar": "ترميز الصوت"
  },
  "usage_notes": {
    "en": "Usage Notes",
    "zh-TW": "使用注意事項",
    "zh-CN": "使用注意事项",
    "ja": "使用上の注意",
    "ko": "사용 참고사항",
    "es": "Notas de uso",
    "fr": "Notes d'utilisation",
    "de": "Nutzungshinweise",
    "pt": "Notas de uso",
    "pt-BR": "Notas de uso",
    "ru": "Примечания по использованию",
    "ar": "ملاحظات الاستخدام"
  },
  "adult_content_age_restriction": {
    "en": "Adult content is restricted to users 18 years and older",
    "zh-TW": "成人內容僅限18歲及以上用戶",
    "zh-CN": "成人内容仅限18岁及以上用户",
    "ja": "アダルトコンテンツは18歳以上のユーザーに制限されています",
    "ko": "성인 콘텐츠는 18세 이상 사용자로 제한됩니다",
    "es": "El contenido para adultos está restringido a usuarios mayores de 18 años",
    "fr": "Le contenu pour adultes est réservé aux utilisateurs de 18 ans et plus",
    "de": "Erwachseneninhalte sind auf Benutzer ab 18 Jahren beschränkt",
    "pt": "O conteúdo adulto é restrito a usuários com 18 anos ou mais",
    "pt-BR": "O conteúdo adulto é restrito a usuários com 18 anos ou mais",
    "ru": "Контент для взрослых ограничен для пользователей от 18 лет и старше",
    "ar": "المحتوى الخاص بالبالغين مقيد للمستخدمين الذين تبلغ أعمارهم 18 عامًا فما فوق"
  },
  "no_illegal_content": {
    "en": "Do not use for illegal or pirated content",
    "zh-TW": "請勿用於非法或盜版內容",
    "zh-CN": "请勿用于非法或盗版内容",
    "ja": "違法または海賊版コンテンツには使用しないでください",
    "ko": "불법 또는 불법 복제 콘텐츠에 사용하지 마십시오",
    "es": "No usar para contenido ilegal o pirateado",
    "fr": "Ne pas utiliser pour du contenu illégal ou piraté",
    "de": "Nicht für illegale oder raubkopierte Inhalte verwenden",
    "pt": "Não use para conteúdo ilegal ou pirata",
    "pt-BR": "Não use para conteúdo ilegal ou pirata",
    "ru": "Не используйте для незаконного или пиратского контента",
    "ar": "لا تستخدم للمحتوى غير القانوني أو المقرصن"
  },
  "follow_local_laws": {
    "en": "Follow your local laws and regulations",
    "zh-TW": "遵守您當地的法律法規",
    "zh-CN": "遵守您当地的法律法规",
    "ja": "お住まいの地域の法律や規制に従ってください",
    "ko": "현지 법률 및 규정을 따르십시오",
    "es": "Siga las leyes y regulaciones locales",
    "fr": "Respectez les lois et règlements locaux",
    "de": "Befolgen Sie die örtlichen Gesetze und Vorschriften",
    "pt": "Siga as leis e regulamentos locais",
    "pt-BR": "Siga as leis e regulamentos locais",
    "ru": "Соблюдайте местные законы и правила",
    "ar": "اتبع القوانين واللوائح المحلية"
  },
  "no_browsing_history_saved": {
    "en": "No browsing history is saved",
    "zh-TW": "不會保存瀏覽歷史記錄",
    "zh-CN": "不会保存浏览历史记录",
    "ja": "閲覧履歴は保存されません",
    "ko": "검색 기록이 저장되지 않습니다",
    "es": "No se guarda el historial de navegación",
    "fr": "Aucun historique de navigation n'est enregistré",
    "de": "Keine Browsing-Historie wird gespeichert",
    "pt": "Nenhum histórico de navegação é salvo",
    "pt-BR": "Nenhum histórico de navegação é salvo",
    "ru": "История просмотра не сохраняется",
    "ar": "لا يتم حفظ سجل التصفح"
  },
  "membership_tiers": {
    "en": "Membership Tiers",
    "zh-TW": "會員等級",
    "zh-CN": "会员等级",
    "ja": "メンバーシップレベル",
    "ko": "회원 등급",
    "es": "Niveles de membresía",
    "fr": "Niveaux d'adhésion",
    "de": "Mitgliedschaftsstufen",
    "pt": "Níveis de associação",
    "pt-BR": "Níveis de assinatura",
    "ru": "Уровни членства",
    "ar": "مستويات العضوية"
  },
  "free_trial": {
    "en": "Free Trial",
    "zh-TW": "免費試用",
    "zh-CN": "免费试用",
    "ja": "無料トライアル",
    "ko": "무료 체험",
    "es": "Prueba gratuita",
    "fr": "Essai gratuit",
    "de": "Kostenlose Testversion",
    "pt": "Teste grátis",
    "pt-BR": "Teste grátis",
    "ru": "Бесплатная пробная версия",
    "ar": "تجربة مجانية"
  },
  "trial_uses_2000": {
    "en": "2000 uses during trial",
    "zh-TW": "試用期間2000次使用",
    "zh-CN": "试用期间2000次使用",
    "ja": "トライアル期間中2000回使用",
    "ko": "체험 기간 중 2000회 사용",
    "es": "2000 usos durante el período de prueba",
    "fr": "2000 utilisations pendant l'essai",
    "de": "2000 Nutzungen während der Testphase",
    "pt": "2000 usos durante o teste",
    "pt-BR": "2000 usos durante o teste",
    "ru": "2000 использований во время пробного периода",
    "ar": "2000 استخدام خلال الفترة التجريبية"
  },
  "all_formats_trial": {
    "en": "All formats available",
    "zh-TW": "所有格式可用",
    "zh-CN": "所有格式可用",
    "ja": "すべての形式が利用可能",
    "ko": "모든 형식 사용 가능",
    "es": "Todos los formatos disponibles",
    "fr": "Tous les formats disponibles",
    "de": "Alle Formate verfügbar",
    "pt": "Todos os formatos disponíveis",
    "pt-BR": "Todos os formatos disponíveis",
    "ru": "Доступны все форматы",
    "ar": "جميع التنسيقات متاحة"
  },
  "trial_description": {
    "en": "Perfect for trying out all features",
    "zh-TW": "非常適合試用所有功能",
    "zh-CN": "非常适合试用所有功能",
    "ja": "すべての機能を試すのに最適",
    "ko": "모든 기능을 시험해 보기에 완벽",
    "es": "Perfecto para probar todas las funciones",
    "fr": "Parfait pour essayer toutes les fonctionnalités",
    "de": "Perfekt zum Ausprobieren aller Funktionen",
    "pt": "Perfeito para experimentar todos os recursos",
    "pt-BR": "Perfeito para experimentar todos os recursos",
    "ru": "Идеально для тестирования всех функций",
    "ar": "مثالي لتجربة جميع الميزات"
  },
  "free_member": {
    "en": "Free Member",
    "zh-TW": "免費會員",
    "zh-CN": "免费会员",
    "ja": "無料会員",
    "ko": "무료 회원",
    "es": "Miembro gratuito",
    "fr": "Membre gratuit",
    "de": "Kostenloses Mitglied",
    "pt": "Membro gratuito",
    "pt-BR": "Membro gratuito",
    "ru": "Бесплатный участник",
    "ar": "عضو مجاني"
  },
  "daily_30_uses": {
    "en": "30 uses per day",
    "zh-TW": "每天30次使用",
    "zh-CN": "每天30次使用",
    "ja": "1日30回使用",
    "ko": "일일 30회 사용",
    "es": "30 usos por día",
    "fr": "30 utilisations par jour",
    "de": "30 Nutzungen pro Tag",
    "pt": "30 usos por dia",
    "pt-BR": "30 usos por dia",
    "ru": "30 использований в день",
    "ar": "30 استخدامًا في اليوم"
  },
  "basic_formats_only": {
    "en": "Basic formats only",
    "zh-TW": "僅基本格式",
    "zh-CN": "仅基本格式",
    "ja": "基本形式のみ",
    "ko": "기본 형식만",
    "es": "Solo formatos básicos",
    "fr": "Formats de base uniquement",
    "de": "Nur grundlegende Formate",
    "pt": "Apenas formatos básicos",
    "pt-BR": "Apenas formatos básicos",
    "ru": "Только базовые форматы",
    "ar": "التنسيقات الأساسية فقط"
  },
  "free_member_description": {
    "en": "Great for casual use",
    "zh-TW": "非常適合休閒使用",
    "zh-CN": "非常适合休闲使用",
    "ja": "カジュアルな使用に最適",
    "ko": "일상적인 사용에 적합",
    "es": "Ideal para uso ocasional",
    "fr": "Idéal pour un usage occasionnel",
    "de": "Ideal für gelegentliche Nutzung",
    "pt": "Ótimo para uso casual",
    "pt-BR": "Ótimo para uso casual",
    "ru": "Отлично подходит для повседневного использования",
    "ar": "رائع للاستخدام العرضي"
  },
  "basic_member": {
    "en": "Basic Member",
    "zh-TW": "基礎會員",
    "zh-CN": "基础会员",
    "ja": "ベーシック会員",
    "ko": "기본 회원",
    "es": "Miembro básico",
    "fr": "Membre de base",
    "de": "Basis-Mitglied",
    "pt": "Membro básico",
    "pt-BR": "Membro básico",
    "ru": "Базовый участник",
    "ar": "عضو أساسي"
  },
  "monthly_1500_plus_daily_40": {
    "en": "1500 monthly + 40 daily",
    "zh-TW": "每月1500次 + 每天40次",
    "zh-CN": "每月1500次 + 每天40次",
    "ja": "月1500回 + 毎日40回",
    "ko": "월 1500회 + 일 40회",
    "es": "1500 mensuales + 40 diarios",
    "fr": "1500 mensuels + 40 quotidiens",
    "de": "1500 monatlich + 40 täglich",
    "pt": "1500 mensais + 40 diários",
    "pt-BR": "1500 mensais + 40 diários",
    "ru": "1500 в месяц + 40 в день",
    "ar": "1500 شهريًا + 40 يوميًا"
  },
  "all_formats_including_adult": {
    "en": "All formats including adult content",
    "zh-TW": "所有格式包括成人內容",
    "zh-CN": "所有格式包括成人内容",
    "ja": "アダルトコンテンツを含むすべての形式",
    "ko": "성인 콘텐츠를 포함한 모든 형식",
    "es": "Todos los formatos incluyendo contenido para adultos",
    "fr": "Tous les formats y compris le contenu pour adultes",
    "de": "Alle Formate einschließlich Inhalte für Erwachsene",
    "pt": "Todos os formatos incluindo conteúdo adulto",
    "pt-BR": "Todos os formatos incluindo conteúdo adulto",
    "ru": "Все форматы, включая контент для взрослых",
    "ar": "جميع التنسيقات بما في ذلك المحتوى الخاص بالبالغين"
  },
  "basic_member_description": {
    "en": "Best value for regular users",
    "zh-TW": "定期用戶的最佳價值",
    "zh-CN": "定期用户的最佳价值",
    "ja": "通常ユーザーに最適な価値",
    "ko": "정기 사용자에게 최고의 가치",
    "es": "Mejor valor para usuarios regulares",
    "fr": "Meilleur rapport qualité-prix pour les utilisateurs réguliers",
    "de": "Bester Wert für regelmäßige Benutzer",
    "pt": "Melhor valor para usuários regulares",
    "pt-BR": "Melhor valor para usuários regulares",
    "ru": "Лучшая ценность для постоянных пользователей",
    "ar": "أفضل قيمة للمستخدمين العاديين"
  },
  "premium_member": {
    "en": "Premium Member",
    "zh-TW": "高級會員",
    "zh-CN": "高级会员",
    "ja": "プレミアム会員",
    "ko": "프리미엄 회원",
    "es": "Miembro premium",
    "fr": "Membre premium",
    "de": "Premium-Mitglied",
    "pt": "Membro premium",
    "pt-BR": "Membro premium",
    "ru": "Премиум участник",
    "ar": "عضو مميز"
  },
  "unlimited_uses": {
    "en": "Unlimited uses",
    "zh-TW": "無限使用",
    "zh-CN": "无限使用",
    "ja": "無制限の使用",
    "ko": "무제한 사용",
    "es": "Usos ilimitados",
    "fr": "Utilisations illimitées",
    "de": "Unbegrenzte Nutzung",
    "pt": "Usos ilimitados",
    "pt-BR": "Usos ilimitados",
    "ru": "Неограниченное использование",
    "ar": "استخدامات غير محدودة"
  },
  "premium_member_description": {
    "en": "For power users and professionals",
    "zh-TW": "為高級用戶和專業人士",
    "zh-CN": "为高级用户和专业人士",
    "ja": "パワーユーザーおよびプロフェッショナル向け",
    "ko": "파워 사용자 및 전문가용",
    "es": "Para usuarios avanzados y profesionales",
    "fr": "Pour les utilisateurs avancés et les professionnels",
    "de": "Für Power-User und Profis",
    "pt": "Para usuários avançados e profissionais",
    "pt-BR": "Para usuários avançados e profissionais",
    "ru": "Для опытных пользователей и профессионалов",
    "ar": "للمستخدمين المتقدمين والمحترفين"
  },
  "upgrade_unlock_features": {
    "en": "Upgrade to unlock more features",
    "zh-TW": "升級以解鎖更多功能",
    "zh-CN": "升级以解锁更多功能",
    "ja": "アップグレードしてさらなる機能を解除",
    "ko": "업그레이드하여 더 많은 기능 잠금 해제",
    "es": "Actualice para desbloquear más funciones",
    "fr": "Mettez à niveau pour débloquer plus de fonctionnalités",
    "de": "Upgraden Sie, um weitere Funktionen freizuschalten",
    "pt": "Atualize para desbloquear mais recursos",
    "pt-BR": "Atualize para desbloquear mais recursos",
    "ru": "Обновитесь, чтобы разблокировать больше функций",
    "ar": "قم بالترقية لفتح المزيد من الميزات"
  },
  "example_formats": {
    "en": "Example Formats",
    "zh-TW": "範例格式",
    "zh-CN": "示例格式",
    "ja": "サンプル形式",
    "ko": "예제 형식",
    "es": "Formatos de ejemplo",
    "fr": "Formats d'exemple",
    "de": "Beispielformate",
    "pt": "Formatos de exemplo",
    "pt-BR": "Formatos de exemplo",
    "ru": "Примеры форматов",
    "ar": "تنسيقات الأمثلة"
  }
};

// Get all language files
const languageFiles = fs.readdirSync(l10nDir).filter(file => file.endsWith('.json'));

languageFiles.forEach(file => {
  const filePath = path.join(l10nDir, file);
  const langCode = file.replace('.json', '');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const translations = JSON.parse(content);
    
    let updated = false;
    
    // Add missing keys
    Object.keys(missingKeys).forEach(key => {
      if (!translations[key] && missingKeys[key][langCode]) {
        translations[key] = missingKeys[key][langCode];
        updated = true;
        console.log(`✅ Added "${key}" to ${langCode}`);
      }
    });
    
    if (updated) {
      // Write back with proper formatting
      fs.writeFileSync(filePath, JSON.stringify(translations, null, 2) + '\n', 'utf8');
      console.log(`✅ Updated ${file}`);
    } else {
      console.log(`ℹ️  No updates needed for ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log('\n✅ Translation sync completed!');
