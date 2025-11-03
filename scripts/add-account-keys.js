const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');

const __filename = fileURLToPath(import.meta.url || __filename);
const __dirname = path.dirname(__filename);

const l10nDir = path.join(__dirname, '..', 'l10n');

const keysToAdd = {
  "account_info": {
    "en": "Account Information",
    "zh-TW": "帳戶資訊",
    "zh-CN": "账户信息",
    "es": "Información de cuenta",
    "pt-BR": "Informações da conta",
    "pt": "Informações da conta",
    "de": "Kontoinformationen",
    "fr": "Informations du compte",
    "ru": "Информация об аккаунте",
    "ar": "معلومات الحساب",
    "ja": "アカウント情報",
    "ko": "계정 정보"
  },
  "subscription_plan": {
    "en": "Subscription Plan",
    "zh-TW": "訂閱方案",
    "zh-CN": "订阅方案",
    "es": "Plan de suscripción",
    "pt-BR": "Plano de assinatura",
    "pt": "Plano de assinatura",
    "de": "Abonnementplan",
    "fr": "Plan d'abonnement",
    "ru": "План подписки",
    "ar": "خطة الاشتراك",
    "ja": "サブスクリプションプラン",
    "ko": "구독 플랜"
  },
  "enter_referral_code": {
    "en": "Enter Referral Code",
    "zh-TW": "輸入推薦碼",
    "zh-CN": "输入推荐码",
    "es": "Ingrese código de referencia",
    "pt-BR": "Digite o código de indicação",
    "pt": "Introduza o código de referência",
    "de": "Empfehlungscode eingeben",
    "fr": "Entrez le code de parrainage",
    "ru": "Введите реферальный код",
    "ar": "أدخل رمز الإحالة",
    "ja": "紹介コードを入力",
    "ko": "추천 코드 입력"
  },
  "device_management": {
    "en": "Device Management",
    "zh-TW": "裝置管理",
    "zh-CN": "设备管理",
    "es": "Gestión de dispositivos",
    "pt-BR": "Gerenciamento de dispositivos",
    "pt": "Gestão de dispositivos",
    "de": "Geräteverwaltung",
    "fr": "Gestion des appareils",
    "ru": "Управление устройствами",
    "ar": "إدارة الأجهزة",
    "ja": "デバイス管理",
    "ko": "기기 관리"
  },
  "forgot_password": {
    "en": "Forgot Password",
    "zh-TW": "忘記密碼",
    "zh-CN": "忘记密码",
    "es": "Olvidé mi contraseña",
    "pt-BR": "Esqueceu a senha",
    "pt": "Esqueceu a palavra-passe",
    "de": "Passwort vergessen",
    "fr": "Mot de passe oublié",
    "ru": "Забыли пароль",
    "ar": "نسيت كلمة المرور",
    "ja": "パスワードを忘れた",
    "ko": "비밀번호 찾기"
  }
};

const languages = ['en', 'zh-TW', 'zh-CN', 'es', 'pt-BR', 'pt', 'de', 'fr', 'ru', 'ar', 'ja', 'ko'];

languages.forEach(lang => {
  const filePath = path.join(l10nDir, `${lang}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠ Skipping ${lang}.json - file not found`);
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const translations = JSON.parse(content);
    
    let updated = false;
    Object.keys(keysToAdd).forEach(key => {
      if (!translations[key]) {
        translations[key] = keysToAdd[key][lang];
        updated = true;
        console.log(`✓ Added "${key}" to ${lang}.json`);
      }
    });

    if (updated) {
      fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf8');
      console.log(`✅ Updated ${lang}.json`);
    } else {
      console.log(`✓ ${lang}.json already has all keys`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${lang}.json:`, error.message);
  }
});

console.log('\n✅ All translation files have been updated!');
