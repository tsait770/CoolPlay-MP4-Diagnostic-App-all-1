const fs = require('fs').promises;
const path = require('path');

const translations = {
  en: {
    // Legal Pages
    privacy_policy: "Privacy Policy",
    terms_of_service: "Terms of Service",
    third_party_services: "Third-Party Services",
    last_updated: "Last Updated",
    
    // Privacy Policy
    introduction: "Introduction",
    privacy_policy_intro: "This Privacy Policy describes how we collect, use, and protect your information when you use our app.",
    information_we_collect: "Information We Collect",
    information_we_collect_desc: "We collect information to provide better services to our users:",
    account_information: "Account information (email, profile)",
    usage_data: "Usage data and preferences",
    device_information: "Device information and identifiers",
    how_we_use_information: "How We Use Your Information",
    how_we_use_information_desc: "We use the information we collect to:",
    provide_services: "Provide and improve our services",
    improve_app: "Analyze and improve app performance",
    communicate_with_you: "Communicate with you about updates",
    third_party_services_desc: "Our app uses third-party services that may collect information used to identify you:",
    youtube_api_notice: "This app uses YouTube API Services. By using this app, you agree to be bound by YouTube's Terms of Service. Your use of YouTube features is also subject to Google's Privacy Policy.",
    data_storage: "Data Storage and Security",
    data_storage_desc: "We implement industry-standard security measures to protect your data. Your data is stored securely and encrypted both in transit and at rest.",
    your_rights: "Your Rights",
    your_rights_desc: "You have the right to:",
    access_your_data: "Access and download your data",
    delete_your_data: "Request deletion of your data",
    opt_out: "Opt out of data collection",
    privacy_contact: "For privacy-related inquiries, please contact us at:",
    
    // Terms of Service
    acceptance_of_terms: "Acceptance of Terms",
    acceptance_of_terms_desc: "By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.",
    use_of_service: "Use of Service",
    use_of_service_desc: "You agree to use the service only for lawful purposes and in accordance with these Terms.",
    youtube_content: "YouTube Content",
    youtube_compliance_notice: "This app uses YouTube API Services to provide video streaming functionality. By using YouTube features in this app, you agree to be bound by YouTube's Terms of Service.",
    youtube_embed_only: "We only use official YouTube embed players and APIs",
    youtube_no_download: "We do not provide functionality to download YouTube videos",
    youtube_respect_restrictions: "We respect all YouTube content restrictions and policies",
    youtube_ads_intact: "YouTube branding, logos, and advertisements are preserved",
    youtube_tos_binding: "YouTube's Terms of Service apply: https://www.youtube.com/t/terms",
    user_content: "User Content",
    user_content_desc: "You retain all rights to content you submit, post, or display through the service. By submitting content, you grant us permission to use, modify, and display such content as necessary to provide the service.",
    prohibited_activities: "Prohibited Activities",
    prohibited_activities_desc: "You agree not to engage in any of the following:",
    no_illegal_content: "Upload or share illegal or harmful content",
    no_copyright_violation: "Violate intellectual property rights",
    no_abuse: "Harass, abuse, or harm other users",
    no_circumvent: "Attempt to circumvent security measures",
    intellectual_property: "Intellectual Property",
    intellectual_property_desc: "All intellectual property rights in the app and its content belong to us or our licensors. Third-party content, such as YouTube videos, remains the property of their respective owners.",
    disclaimer: "Disclaimer",
    disclaimer_desc: "The service is provided \"as is\" without warranties of any kind. We do not guarantee that the service will be uninterrupted or error-free.",
    limitation_of_liability: "Limitation of Liability",
    limitation_of_liability_desc: "To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with the use of the service.",
    changes_to_terms: "Changes to Terms",
    changes_to_terms_desc: "We reserve the right to modify these terms at any time. We will notify users of any material changes via the app or email.",
    terms_contact: "For questions about these Terms, please contact us at:",
    
    // Third-Party Services
    third_party_intro: "Our app integrates with various third-party services to provide enhanced functionality. Below are the services we use and how they handle your data:",
    video_platform: "Video Platform",
    youtube_service_desc: "We use YouTube's official embed player and API services to display video content. YouTube may collect viewing data and use cookies to enhance your experience.",
    compliance_measures: "Compliance Measures",
    youtube_official_embed: "Uses official YouTube embed player",
    youtube_api_compliant: "Compliant with YouTube API Services Terms",
    youtube_branding_preserved: "Preserves YouTube branding and attribution",
    youtube_no_ad_removal: "Does not remove or bypass advertisements",
    youtube_user_initiated: "Video playback is user-initiated",
    data_usage: "Data Usage",
    youtube_data_usage: "When you watch YouTube videos through our app, YouTube may collect: viewing history, watch time, interactions with videos, device information, and IP address. This data is subject to Google's Privacy Policy.",
    vimeo_service_desc: "We use Vimeo's embed player to display video content from Vimeo. Vimeo may collect viewing data according to their privacy policy.",
    important_notice: "Important Notice",
    third_party_notice: "We do not control and are not responsible for the privacy practices of third-party services. We encourage you to review their privacy policies directly.",
    
    // App Information
    app_description: "A powerful media player with voice control capabilities, supporting multiple video platforms including YouTube, Vimeo, and more.",
    app_information: "App Information",
    build_number: "Build Number",
    platform: "Platform",
    expo_version: "Expo SDK Version",
    connect_with_us: "Connect With Us",
    website: "Website",
    email_support: "Email Support",
    legal: "Legal",
    open_source_licenses: "Open Source Licenses",
    all_rights_reserved: "All rights reserved",
    version: "Version",
  },
  "zh-TW": {
    // Legal Pages
    privacy_policy: "隱私政策",
    terms_of_service: "服務條款",
    third_party_services: "第三方服務",
    last_updated: "最後更新",
    
    // Privacy Policy
    introduction: "簡介",
    privacy_policy_intro: "本隱私政策說明我們在您使用應用程式時如何收集、使用和保護您的資訊。",
    information_we_collect: "我們收集的資訊",
    information_we_collect_desc: "我們收集資訊以為用戶提供更好的服務：",
    account_information: "帳戶資訊（電子郵件、個人資料）",
    usage_data: "使用數據和偏好設定",
    device_information: "設備資訊和識別碼",
    how_we_use_information: "我們如何使用您的資訊",
    how_we_use_information_desc: "我們使用收集的資訊來：",
    provide_services: "提供和改進我們的服務",
    improve_app: "分析和改進應用程式效能",
    communicate_with_you: "與您溝通更新資訊",
    third_party_services_desc: "我們的應用程式使用可能會收集用於識別您的資訊的第三方服務：",
    youtube_api_notice: "本應用程式使用 YouTube API 服務。使用本應用程式即表示您同意遵守 YouTube 服務條款。您對 YouTube 功能的使用也受 Google 隱私政策的約束。",
    data_storage: "資料儲存和安全",
    data_storage_desc: "我們實施業界標準的安全措施來保護您的資料。您的資料安全儲存，在傳輸和靜態時都經過加密。",
    your_rights: "您的權利",
    your_rights_desc: "您有權：",
    access_your_data: "存取和下載您的資料",
    delete_your_data: "請求刪除您的資料",
    opt_out: "選擇退出資料收集",
    privacy_contact: "如有隱私相關問題，請聯絡我們：",
    
    // Terms of Service
    acceptance_of_terms: "接受條款",
    acceptance_of_terms_desc: "透過存取和使用本應用程式，您接受並同意受本協議條款和規定的約束。",
    use_of_service: "服務使用",
    use_of_service_desc: "您同意僅將服務用於合法目的，並遵守這些條款。",
    youtube_content: "YouTube 內容",
    youtube_compliance_notice: "本應用程式使用 YouTube API 服務提供影片串流功能。透過在本應用程式中使用 YouTube 功能，您同意遵守 YouTube 服務條款。",
    youtube_embed_only: "我們僅使用官方 YouTube 嵌入播放器和 API",
    youtube_no_download: "我們不提供下載 YouTube 影片的功能",
    youtube_respect_restrictions: "我們尊重所有 YouTube 內容限制和政策",
    youtube_ads_intact: "保留 YouTube 品牌、標誌和廣告",
    youtube_tos_binding: "YouTube 服務條款適用：https://www.youtube.com/t/terms",
    user_content: "用戶內容",
    user_content_desc: "您保留透過服務提交、發布或顯示的內容的所有權利。透過提交內容，您授予我們必要時使用、修改和顯示該內容以提供服務的權限。",
    prohibited_activities: "禁止活動",
    prohibited_activities_desc: "您同意不從事以下任何活動：",
    no_illegal_content: "上傳或分享非法或有害內容",
    no_copyright_violation: "侵犯智慧財產權",
    no_abuse: "騷擾、濫用或傷害其他用戶",
    no_circumvent: "嘗試繞過安全措施",
    intellectual_property: "智慧財產",
    intellectual_property_desc: "應用程式及其內容的所有智慧財產權屬於我們或我們的授權方。第三方內容（如 YouTube 影片）仍屬於其各自所有者。",
    disclaimer: "免責聲明",
    disclaimer_desc: "服務按「現狀」提供，不提供任何形式的保證。我們不保證服務將不間斷或無錯誤。",
    limitation_of_liability: "責任限制",
    limitation_of_liability_desc: "在法律允許的最大範圍內，我們不對因使用或無法使用服務而產生的任何間接、附帶、特殊或後果性損害負責。",
    changes_to_terms: "條款變更",
    changes_to_terms_desc: "我們保留隨時修改這些條款的權利。我們將透過應用程式或電子郵件通知用戶任何重大變更。",
    terms_contact: "如有關於這些條款的問題，請聯絡我們：",
    
    // Third-Party Services
    third_party_intro: "我們的應用程式整合了各種第三方服務以提供增強功能。以下是我們使用的服務及其如何處理您的資料：",
    video_platform: "影片平台",
    youtube_service_desc: "我們使用 YouTube 官方嵌入播放器和 API 服務來顯示影片內容。YouTube 可能會收集觀看數據並使用 cookie 來增強您的體驗。",
    compliance_measures: "合規措施",
    youtube_official_embed: "使用官方 YouTube 嵌入播放器",
    youtube_api_compliant: "符合 YouTube API 服務條款",
    youtube_branding_preserved: "保留 YouTube 品牌和歸屬",
    youtube_no_ad_removal: "不移除或繞過廣告",
    youtube_user_initiated: "影片播放由用戶啟動",
    data_usage: "資料使用",
    youtube_data_usage: "當您透過我們的應用程式觀看 YouTube 影片時，YouTube 可能會收集：觀看歷史、觀看時間、與影片的互動、設備資訊和 IP 地址。這些資料受 Google 隱私政策的約束。",
    vimeo_service_desc: "我們使用 Vimeo 嵌入播放器來顯示 Vimeo 的影片內容。Vimeo 可能會根據其隱私政策收集觀看數據。",
    important_notice: "重要通知",
    third_party_notice: "我們不控制且不對第三方服務的隱私做法負責。我們鼓勵您直接查看他們的隱私政策。",
    
    // App Information
    app_description: "具有語音控制功能的強大媒體播放器，支援包括 YouTube、Vimeo 等多個影片平台。",
    app_information: "應用程式資訊",
    build_number: "建置編號",
    platform: "平台",
    expo_version: "Expo SDK 版本",
    connect_with_us: "聯絡我們",
    website: "網站",
    email_support: "電子郵件支援",
    legal: "法律",
    open_source_licenses: "開源授權",
    all_rights_reserved: "版權所有",
    version: "版本",
  }
};

async function addTranslations() {
  const l10nDir = path.join(__dirname, '..', 'l10n');
  
  for (const [lang, keys] of Object.entries(translations)) {
    const filePath = path.join(l10nDir, `${lang}.json`);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const json = JSON.parse(content);
      
      Object.entries(keys).forEach(([key, value]) => {
        if (!json[key]) {
          json[key] = value;
          console.log(`✓ Added "${key}" to ${lang}.json`);
        } else {
          console.log(`- "${key}" already exists in ${lang}.json`);
        }
      });
      
      await fs.writeFile(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
      console.log(`✓ Updated ${lang}.json\n`);
      
    } catch (error) {
      console.error(`✗ Error updating ${lang}.json:`, error.message);
    }
  }
  
  console.log('✓ Translation update complete!');
}

addTranslations();
