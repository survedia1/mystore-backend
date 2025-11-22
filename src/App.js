import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";
import AppForm from "./AppForm";
import "./App.css"; // ملف التنسيق (الكود بالأسفل)

function App() {
  const [apps, setApps] = useState([]);
  const [view, setView] = useState("list"); // list | form
  const [editingApp, setEditingApp] = useState(null);

  useEffect(() => {
    // جلب البيانات لحظياً من Firebase
    const unsubscribe = onSnapshot(collection(db, "apps"), (snapshot) => {
      const appsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setApps(appsData);
    });
    return () => unsubscribe();
  }, []);

  const handleEdit = (app) => {
    setEditingApp(app);
    setView("form");
  };

  const handleAddNew = () => {
    setEditingApp(null);
    setView("form");
  };

  const handleSuccess = () => {
    setView("list");
    setEditingApp(null);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>لوحة تحكم المتجر</h1>
      </header>

      {view === "list" ? (
        <div className="dashboard">
          <div className="actions">
            <button className="btn-add" onClick={handleAddNew}>
              + إضافة تطبيق جديد
            </button>
          </div>

          <table className="apps-table">
            <thead>
              <tr>
                <th>الأيقونة</th>
                <th>الاسم</th>
                <th>الإصدار</th>
                <th>Package ID</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr key={app.id}>
                  <td>
                    <img src={app.iconUrl} alt={app.name} className="app-icon" />
                  </td>
                  <td>{app.name}</td>
                  <td>{app.version}</td>
                  <td>{app.packageName}</td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(app)}>
                      تحديث / تعديل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <AppForm 
          currentApp={editingApp} 
          onCancel={() => setView("list")}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

export default App;