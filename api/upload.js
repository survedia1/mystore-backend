import { handleUpload } from '@vercel/blob/api';
import { kv } from '@vercel/kv';

export default handleUpload({
  // هذه الدالة تعمل "قبل" بدء الرفع
  async beforeUpload(request) {
    // جلب البيانات (secret, versionCode...) من الطلب
    const body = await request.json();

    // 1. التحقق من كلمة المرور
    if (body.secret !== process.env.ADMIN_SECRET) {
      throw new Error('كلمة مرور غير صحيحة');
    }

    // يمكنك إرجاع بيانات لاستخدامها لاحقاً
    return { 
      versionCode: body.versionCode,
      versionName: body.versionName
    };
  },

  // هذه الدالة تعمل "بعد" اكتمال الرفع
  async afterUpload(blob, { metadata }) {
    // 'blob' يحتوي على رابط التحميل
    // 'metadata' يحتوي على ما أرجعناه من 'beforeUpload'
    
    try {
      // 2. حفظ بيانات الإصدار في Vercel KV
      const versionData = {
        version_code: parseInt(metadata.versionCode),
        version_name: metadata.versionName,
        download_url: blob.url,
      };
      
      await kv.set('latest_version', versionData);

      console.log('Update published:', versionData);

    } catch (error) {
      // إذا فشل الحفظ في KV، احذف الملف من Blob
      await fetch(blob.url, { method: 'DELETE' });
      throw new Error('فشل حفظ البيانات في KV');
    }
  },
});

// هذا يخبر Vercel أن الـ API لا يحتاج لتحليل الجسم (body)
export const config = {
  api: {
    bodyParser: false,
  },
};