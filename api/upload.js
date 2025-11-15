import { put } from '@vercel/blob';
import { kv } from '@vercel/kv';
import { formidable } from 'formidable';

// تعطيل bodyParser المدمج في Vercel لـ API
// لكي تتمكن formidable من قراءة الـ stream
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const form = formidable({});
    
    // 1. تحليل الـ Form Data
    const [fields, files] = await form.parse(request);

    // 2. التحقق من كلمة المرور (الأمان)
    // اذهب إلى Vercel > Settings > Environment Variables
    // وأضف متغير باسم ADMIN_SECRET وقيمته (كلمة مرورك)
    const { secret, versionCode, versionName } = fields;
    if (secret?.[0] !== process.env.ADMIN_SECRET) {
      return response.status(401).json({ error: 'كلمة مرور غير صحيحة' });
    }

    // 3. التحقق من وجود الملف
    const apkFile = files.apkFile?.[0];
    if (!apkFile) {
      return response.status(400).json({ error: 'لم يتم العثور على ملف' });
    }

    // 4. رفع الملف إلى Vercel Blob
    const { url: downloadUrl } = await put(
      `releases/app-v${versionCode[0]}.apk`,
      apkFile.filepath, // المسار المؤقت للملف
      { access: 'public', contentType: 'application/vnd.android.package-archive' }
    );

    // 5. حفظ بيانات الإصدار في Vercel KV
    const versionData = {
      version_code: parseInt(versionCode[0]),
      version_name: versionName[0],
      download_url: downloadUrl,
    };
    
    await kv.set('latest_version', versionData);

    // 6. إرسال رد ناجح
    return response.status(200).json(versionData);

  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'خطأ في الخادم: ' + error.message });
  }
}