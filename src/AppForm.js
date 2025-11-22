import React, { useState, useEffect } from "react";
import { db } from "./firebase"; // نستخدم فايربيس فقط لقاعدة البيانات
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";

// ⬇️⬇️ استبدل هذه ببياناتك من Cloudinary ⬇️⬇️
const CLOUD_NAME = "dc35epopt"; 
const UPLOAD_PRESET = "e2b3b28b-ad04-4079-8841-fa39e3a930ee"; 
// ⬆️⬆️ ------------------------------- ⬆️⬆️

const AppForm = ({ currentApp, onCancel, onSuccess }) => {
  const [name, setName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [version, setVersion] = useState("");
  const [developerName, setDeveloperName] = useState("");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState("");
  
  const [iconFile, setIconFile] = useState(null);
  const [apkFile, setApkFile] = useState(null);
  const [currentIconUrl, setCurrentIconUrl] = useState("");
  const [currentApkUrl, setCurrentApkUrl] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (currentApp) {
      setName(currentApp.name);
      setPackageName(currentApp.packageName);
      setVersion(currentApp.version);
      setDeveloperName(currentApp.developerName);
      setDescription(currentApp.description);
      setSize(currentApp.size);
      setCurrentIconUrl(currentApp.iconUrl);
      setCurrentApkUrl(currentApp.downloadUrl);
    }
  }, [currentApp]);

  // دالة الرفع إلى Cloudinary
  const uploadToCloudinary = async (file, resourceType) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    // resource_type: 'image' للصور، و 'raw' لملفات APK
    const type = resourceType === 'apk' ? 'raw' : 'image'; 

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error("فشل الرفع: " + (data.error?.message || "خطأ غير معروف"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let finalIconUrl = currentIconUrl;
      let finalApkUrl = currentApkUrl;

      // 1. رفع الأيقونة
      if (iconFile) {
        setStatusMessage("جاري رفع الأيقونة إلى Cloudinary...");
        finalIconUrl = await uploadToCloudinary(iconFile, "image");
      }

      // 2. رفع APK
      if (apkFile) {
        setStatusMessage("جاري رفع ملف التطبيق (APK)...");
        // حساب الحجم
        const sizeInMB = (apkFile.size / (1024 * 1024)).toFixed(1) + " MB";
        setSize(sizeInMB);
        // الرفع كملف raw
        finalApkUrl = await uploadToCloudinary(apkFile, "apk");
      }

      // 3. حفظ الروابط في Firebase Database
      setStatusMessage("جاري حفظ البيانات...");
      const appData = {
        name,
        packageName,
        version,
        developerName,
        description,
        size: apkFile ? ((apkFile.size / (1024 * 1024)).toFixed(1) + " MB") : size,
        iconUrl: finalIconUrl,
        downloadUrl: finalApkUrl,
        rating: 4.5,
      };

      if (currentApp) {
        await updateDoc(doc(db, "apps", currentApp.id), appData);
      } else {
        await addDoc(collection(db, "apps"), appData);
      }

      onSuccess();
    } catch (error) {
      console.error("Error:", error);
      alert("حدث خطأ: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (isUploading) {
    return (
      <div className="upload-screen">
        <h3>{statusMessage}</h3>
        <div className="spinner"></div> {/* يمكنك إضافة spinner CSS بسيط */}
        <p>الرجاء الانتظار...</p>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2>{currentApp ? "تعديل التطبيق" : "إضافة تطبيق جديد"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>اسم التطبيق</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        
        <div className="form-group">
          <label>Package Name (مثال: com.my.app)</label>
          <input type="text" value={packageName} onChange={(e) => setPackageName(e.target.value)} required />
        </div>

        <div className="row">
          <div className="form-group">
            <label>الإصدار (Version)</label>
            <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>اسم المطور</label>
            <input type="text" value={developerName} onChange={(e) => setDeveloperName(e.target.value)} required />
          </div>
        </div>

        <div className="form-group">
          <label>الوصف</label>
          <textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>

        <div className="form-group file-input">
          <label>صورة الأيقونة</label>
          <input type="file" accept="image/*" onChange={(e) => setIconFile(e.target.files[0])} />
          {currentIconUrl && <img src={currentIconUrl} alt="icon" width="50" />}
        </div>

        <div className="form-group file-input">
          <label>ملف التطبيق (APK)</label>
          <input type="file" accept=".apk" onChange={(e) => setApkFile(e.target.files[0])} />
          {currentApkUrl && <span className="badge">يوجد ملف حالياً</span>}
        </div>

        <div className="buttons">
          <button type="submit" className="btn-save">حفظ ونشر</button>
          <button type="button" onClick={onCancel} className="btn-cancel">إلغاء</button>
        </div>
      </form>
    </div>
  );
};

export default AppForm;