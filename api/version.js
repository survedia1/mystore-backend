import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. جلب البيانات من Vercel KV
    const versionData = await kv.get('latest_version');

    if (!versionData) {
      return response.status(404).json({ error: 'بيانات الإصدار غير موجودة' });
    }

    // 2. إرسال البيانات كتنسيق JSON
    return response.status(200).json(versionData);
    
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'خطأ في الخادم' });
  }
}