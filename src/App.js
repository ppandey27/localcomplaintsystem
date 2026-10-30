import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [user, setUser] = useState(null); 
  const [authView, setAuthView] = useState('login'); 
  const [loginRole, setLoginRole] = useState('user'); 
  
  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('user');

  // Portal States
  const [complaints, setComplaints] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [activeTab, setActiveTab] = useState('view');

  // Modal State for viewing multiple images & Zooming
  const [modalImages, setModalImages] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);

  // Complaint Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Roads & Infrastructure',
    district: 'Raipur',
    citizenName: '',
    phone: '',
    email: '',
    description: '',
    images: []
  });

  // Load data from db.json via backend server on start
  useEffect(() => {
    fetch('http://localhost:5000/api/data')
      .then(res => res.json())
      .then(data => {
        if (data.users) setUsersList(data.users);
        if (data.complaints) {
          const formatted = data.complaints.map(c => {
            if (!c.images && c.image) return { ...c, images: [c.image] };
            if (!c.images) return { ...c, images: [] };
            return c;
          });
          setComplaints(formatted);
        }
      })
      .catch(err => console.error('Error connecting to backend server:', err));

    const savedSession = localStorage.getItem('cg_current_session');
    if (savedSession) {
      const parsedUser = JSON.parse(savedSession);
      setUser(parsedUser);
      if (parsedUser.role === 'user') {
        setFormData(prev => ({ 
          ...prev, 
          citizenName: parsedUser.name, 
          phone: parsedUser.phone || '', 
          email: parsedUser.email 
        }));
      }
    }
  }, []);

  // Save complaints to db.json via backend
  const saveComplaintsToStorage = (updatedList) => {
    setComplaints(updatedList);
    fetch('http://localhost:5000/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaints: updatedList })
    }).catch(err => console.error('Error saving complaints:', err));
  };

  // Save users to db.json via backend
  const saveUsersToStorage = (updatedUsers) => {
    setUsersList(updatedUsers);
    fetch('http://localhost:5000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: updatedUsers })
    }).catch(err => console.error('Error saving users:', err));
  };

  // Handle Registration
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regPhone) {
      alert('⚠️ Please fill in all registration fields!');
      return;
    }

    const existing = usersList.find(u => u.email === regEmail);
    if (existing) {
      alert('❌ This email is already registered! Please login.');
      return;
    }

    const newUser = {
      name: regName,
      email: regEmail,
      password: regPassword,
      phone: regPhone,
      role: regRole
    };

    const updatedUsers = [...usersList, newUser];
    saveUsersToStorage(updatedUsers);

    alert('✅ Registration successful! You can now log in.');
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegPhone('');
    setAuthView('login');
  };

  // Handle Login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      alert('⚠️ Please enter both Email and Password!');
      return;
    }

    const foundUser = usersList.find(u => u.email === loginEmail && u.password === loginPassword && u.role === loginRole);
    if (!foundUser) {
      alert('❌ Incorrect Email, Password, or Role selected!');
      return;
    }

    setUser(foundUser);
    localStorage.setItem('cg_current_session', JSON.stringify(foundUser));

    if (foundUser.role === 'user') {
      setFormData(prev => ({
        ...prev,
        citizenName: foundUser.name,
        phone: foundUser.phone,
        email: foundUser.email
      }));
    }

    alert(`🎉 Welcome, ${foundUser.name}! (${foundUser.role.toUpperCase()})`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('cg_current_session');
    setLoginEmail('');
    setLoginPassword('');
  };

  // Handle Multiple Image Upload to Base64
  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      let loadedImages = [];
      let processedCount = 0;

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          loadedImages.push(reader.result);
          processedCount++;
          if (processedCount === files.length) {
            setFormData(prev => ({ ...prev, images: [...prev.images, ...loadedImages] }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Submit Complaint
  const handleComplaintSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.citizenName || !formData.phone || !formData.description) {
      alert('⚠️ Please fill in all required fields!');
      return;
    }

    const newComplaint = {
      id: `CG-2026-${String(complaints.length + 1).padStart(3, '0')}`,
      ...formData,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      userEmail: user.email
    };

    const updated = [newComplaint, ...complaints];
    saveComplaintsToStorage(updated);

    setFormData({
      title: '',
      category: 'Roads & Infrastructure',
      district: 'Raipur',
      citizenName: user.name,
      phone: user.phone || '',
      email: user.email,
      description: '',
      images: []
    });
    setActiveTab('view');
    alert('✅ Your complaint has been successfully registered! ID: ' + newComplaint.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('⚠️ Are you sure you want to delete this complaint?')) {
      const updated = complaints.filter(c => c.id !== id);
      saveComplaintsToStorage(updated);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    const updated = complaints.map(c => c.id === id ? { ...c, status: newStatus } : c);
    saveComplaintsToStorage(updated);
  };

  // 1. AUTHENTICATION SCREEN (Login & Register)
  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ background: '#fff', padding: '35px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img 
              src={require('./assets/cg_logo.jpg')} 
              alt="CG Logo" 
              style={{ width: '55px', height: '55px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px auto', display: 'block', border: '2px solid #003366' }} 
              onError={(e)=>{ e.target.onerror = null; e.target.src="https://via.placeholder.com/55?text=CG"; }} 
            />
            <h2>Chhattisgarh Portal</h2>
            <p style={{ color: '#666', fontSize: '13px' }}>Jan Shikayat & Verification System</p>
          </div>

          {authView === 'login' ? (
            <form onSubmit={handleLoginSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>SELECT ROLE</label>
                <select value={loginRole} onChange={(e) => setLoginRole(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}>
                  <option value="user">Citizen (User)</option>
                  <option value="admin">Admin (Officer)</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>EMAIL ADDRESS</label>
                <input type="email" placeholder="name@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} required />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>PASSWORD</label>
                <input type="password" placeholder="********" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} required />
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#003366', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                Login
              </button>

              <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
                Don't have an account? <span style={{ color: '#003366', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setAuthView('register')}>Register here</span>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>REGISTER AS ROLE</label>
                <select value={regRole} onChange={(e) => setRegRole(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '5px', border: '1px solid #ccc' }}>
                  <option value="user">Citizen (User)</option>
                  <option value="admin">Admin (Officer)</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>FULL NAME</label>
                <input type="text" placeholder="Your full name" value={regName} onChange={(e) => setRegName(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '5px', border: '1px solid #ccc' }} required />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>EMAIL ADDRESS</label>
                <input type="email" placeholder="name@example.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '5px', border: '1px solid #ccc' }} required />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>PHONE NUMBER</label>
                <input type="tel" placeholder="10-digit mobile number" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '5px', border: '1px solid #ccc' }} required />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>PASSWORD</label>
                <input type="password" placeholder="********" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '5px', border: '1px solid #ccc' }} required />
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                Register Now
              </button>

              <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
                Already have an account? <span style={{ color: '#003366', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setAuthView('login')}>Login here</span>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  // 2. MAIN DASHBOARD FOR ADMIN & USER
  const displayedComplaints = user.role === 'admin' 
    ? complaints 
    : complaints.filter(c => c.userEmail === user.email || c.citizenName === user.name);

  const filteredComplaints = displayedComplaints.filter(c => {
    const matchesSearch = c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.citizenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.phone.includes(searchTerm);
    const matchesCategory = filterCategory === 'All' || c.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="app-container">
      {/* Zoomed Fullscreen Image Modal */}
      {zoomImage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex',
          justifyContent: 'center', alignItems: 'center'
        }} onClick={() => setZoomImage(null)}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={(e) => e.stopPropagation()}>
            <img src={zoomImage} alt="Zoomed Proof" style={{ width: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', border: '2px solid #fff' }} />
            <button onClick={() => setZoomImage(null)} style={{
              position: 'absolute', top: '-45px', right: '0', background: '#fff', color: '#000',
              border: 'none', borderRadius: '50%', width: '38px', height: '38px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
            }}>✕</button>
          </div>
        </div>
      )}

      {/* Modal Popup to view all attached photos */}
      {modalImages && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex',
          justifyContent: 'center', alignItems: 'center'
        }} onClick={() => setModalImages(null)}>
          <div style={{
            background: '#fff', padding: '25px', borderRadius: '10px', maxWidth: '650px',
            width: '90%', maxHeight: '80vh', overflowY: 'auto', position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '15px', color: '#003366' }}>Attached Proof Photos ({modalImages.length}) - Click to Zoom</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
              {modalImages.map((imgSrc, idx) => (
                <div key={idx} onClick={() => setZoomImage(imgSrc)} style={{ cursor: 'pointer', position: 'relative' }} title="Click to Zoom Image">
                  <img src={imgSrc} alt={`Proof ${idx + 1}`} style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ccc', transition: 'transform 0.2s' }} />
                  <div style={{ position: 'absolute', bottom: '5px', right: '5px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>🔍 Zoom</div>
                </div>
              ))}
            </div>
            <button onClick={() => setModalImages(null)} style={{
              marginTop: '20px', padding: '10px 16px', background: '#003366', color: '#fff',
              border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'block', width: '100%', fontWeight: 'bold'
            }}>Close Gallery</button>
          </div>
        </div>
      )}

      <header className="header">
        <div className="header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src={require('./assets/cg_logo.jpg')} 
              alt="CG Logo" 
              style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }} 
              onError={(e)=>{ e.target.onerror = null; e.target.src="https://via.placeholder.com/50?text=CG"; }} 
            />
            <div className="header-title">
              <h1>Chhattisgarh Jan Shikayat Portal</h1>
              <p>Welcome, {user.name} ({user.role.toUpperCase()})</p>
            </div>
          </div>

          {/* RIGHT SIDE: Leaders Circular Photos & Chhattisgarh Govt Logo (.jpg format) */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '20px',
            marginLeft: 'auto',
            flexWrap: 'wrap'
          }}>
            {/* Narendra Modi Ji */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img 
                src={require('./assets/modi.jpg')} 
                alt="Narendra Modi" 
                style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '50%', 
                  objectFit: 'cover', 
                  border: '2px solid #fff',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)' 
                }}
                onError={(e)=>{ e.target.onerror = null; e.target.src="https://via.placeholder.com/38?text=Modi"; }} 
              />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', lineHeight: '1.2' }}>Shri Narendra Modi</div>
                <div style={{ fontSize: '9px', color: '#e0e0e0', lineHeight: '1.1' }}>Hon'ble Prime Minister</div>
              </div>
            </div>

            {/* Vishnu Deo Sai Ji */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img 
                src={require('./assets/sai.jpg')} 
                alt="Vishnu Deo Sai" 
                style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '50%', 
                  objectFit: 'cover', 
                  border: '2px solid #fff',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)' 
                }}
                onError={(e)=>{ e.target.onerror = null; e.target.src="https://via.placeholder.com/38?text=Sai"; }} 
              />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', lineHeight: '1.2' }}>Shri Vishnu Deo Sai</div>
                <div style={{ fontSize: '9px', color: '#e0e0e0', lineHeight: '1.1' }}>Hon'ble Chief Minister, CG</div>
              </div>
            </div>

            {/* Chhattisgarh Govt Logo (.jpg format) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '15px' }}>
              <img 
                src={require('./assets/cg_logo.jpg')} 
                alt="Govt of Chhattisgarh" 
                style={{ 
                  width: '38px', 
                  height: '38px', 
                  objectFit: 'cover', 
                  background: '#fff',
                  borderRadius: '50%',
                  border: '2px solid #fff',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)' 
                }}
                onError={(e)=>{ e.target.onerror = null; e.target.src="https://via.placeholder.com/38?text=CG"; }} 
              />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', lineHeight: '1.2' }}>Govt. of Chhattisgarh</div>
                <div style={{ fontSize: '9px', color: '#e0e0e0', lineHeight: '1.1' }}>Official Portal</div>
              </div>
            </div>
          </div>

        </div>

        {/* NAVIGATION BUTTONS */}
        <div className="nav-buttons" style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '12px' }}>
          <button 
            onClick={() => setActiveTab('view')}
            className={`nav-btn ${activeTab === 'view' ? 'active' : ''}`}
          >
            {user.role === 'admin' ? `Admin Panel (${complaints.length})` : `My Complaints (${displayedComplaints.length})`}
          </button>
          {user.role === 'user' && (
            <button 
              onClick={() => setActiveTab('add')}
              className={`nav-btn ${activeTab === 'add' ? 'active' : ''}`}
            >
              + Add Complaint
            </button>
          )}
          <button 
            onClick={handleLogout}
            className="nav-btn"
            style={{ backgroundColor: '#d9534f', color: '#fff', border: 'none' }}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        {activeTab === 'view' && (
          <div>
            <div className="filters-bar">
              <div className="filter-group">
                <label>SEARCH COMPLAINT</label>
                <input 
                  type="text" 
                  placeholder="ID, Title, Name, Phone, District..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>FILTER BY CATEGORY</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="All">All Categories</option>
                  <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                  <option value="Water Supply">Water Supply</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Sanitation">Sanitation & Cleanliness</option>
                  <option value="Health">Health Services</option>
                </select>
              </div>
              <div className="filter-group">
                <label>FILTER BY STATUS</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* TABLE VIEW FOR BOTH ADMIN & USER */}
            <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
              <h2 style={{ marginBottom: '15px', color: '#003366' }}>
                {user.role === 'admin' ? 'Admin Dashboard - All Complaints Table' : 'Your Registered Complaints '}
              </h2>
              {filteredComplaints.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No complaints found.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#003366', color: '#fff' }}>
                      <th style={{ padding: '12px' }}>ID & Date</th>
                      <th style={{ padding: '12px' }}>Citizen & Contact</th>
                      <th style={{ padding: '12px' }}>Title & Description</th>
                      <th style={{ padding: '12px' }}>District & Category</th>
                      <th style={{ padding: '12px' }}>Proof Image</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      {user.role === 'admin' && <th style={{ padding: '12px' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map((c, index) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #eee', background: index % 2 === 0 ? '#fafafa' : '#fff' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 'bold' }}>{c.id}</div>
                          <div style={{ fontSize: '11px', color: '#666' }}>📅 {c.date}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div>👤 {c.citizenName}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>📞 {c.phone}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>✉️ {c.email}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 'bold' }}>{c.title}</div>
                          <div style={{ fontSize: '12px', color: '#555', maxWidth: '250px' }}>{c.description}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div>📍 {c.district}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>🏷️ {c.category}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          {c.images && c.images.length > 0 ? (
                            <div 
                              onClick={() => setModalImages(c.images)} 
                              style={{ cursor: 'pointer', display: 'inline-block', position: 'relative' }}
                              title="Click to view all attached photos"
                            >
                              <img src={c.images[0]} alt="Proof" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc' }} />
                              {c.images.length > 1 && (
                                <span style={{
                                  position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.75)',
                                  color: '#fff', fontSize: '10px', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold'
                                }}>
                                  +{c.images.length - 1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#999' }}>No Image</span>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {user.role === 'admin' ? (
                            <select 
                              value={c.status}
                              onChange={(e) => handleStatusChange(c.id, e.target.value)}
                              style={{ padding: '6px', borderRadius: '4px', fontWeight: 'bold', background: c.status === 'Resolved' ? '#d4edda' : c.status === 'In Progress' ? '#fff3cd' : '#f8d7da' }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                          ) : (
                            <span style={{ padding: '5px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', background: c.status === 'Resolved' ? '#d4edda' : c.status === 'In Progress' ? '#fff3cd' : '#f8d7da', color: c.status === 'Resolved' ? '#155724' : c.status === 'In Progress' ? '#856404' : '#721c24' }}>
                              {c.status}
                            </span>
                          )}
                        </td>
                        {user.role === 'admin' && (
                          <td style={{ padding: '12px' }}>
                            <button onClick={() => handleDelete(c.id)} style={{ padding: '6px 12px', background: '#d9534f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ADD COMPLAINT TAB FOR USER */}
        {activeTab === 'add' && user.role === 'user' && (
          <div className="form-container">
            <h2>Register New Complaint</h2>
            <p>Please fill out the form accurately with valid details and proof for verification.</p>
            <form onSubmit={handleComplaintSubmit}>
              <div className="form-group">
                <label>COMPLAINT TITLE *</label>
                <input 
                  type="text" 
                  placeholder="e.g., Street light is broken on main road"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>CATEGORY *</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                    <option value="Water Supply">Water Supply</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Sanitation">Sanitation & Cleanliness</option>
                    <option value="Health">Health Services</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>DISTRICT (LOCATION) *</label>
                  <select 
                    value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                  >
                    <option value="Raipur">Raipur</option>
                    <option value="Bilaspur">Bilaspur</option>
                    <option value="Durg">Durg</option>
                    <option value="Korba">Korba</option>
                    <option value="Bastar">Bastar</option>
                    <option value="Rajnandgaon">Rajnandgaon</option>
                    <option value="Raigarh">Raigarh</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>CITIZEN NAME *</label>
                  <input 
                    type="text" 
                    placeholder="Your full name"
                    value={formData.citizenName}
                    onChange={(e) => setFormData({...formData, citizenName: e.target.value})}
                    required
                  />
                </div>
                <div className="con-group form-group">
                  <label>PHONE NUMBER (Verification) *</label>
                  <input 
                    type="tel" 
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ width: '100%' }}>
                  <label>EMAIL ADDRESS (Verification) *</label>
                  <input 
                    type="email" 
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>DETAILED DESCRIPTION *</label>
                <textarea 
                  rows="4"
                  placeholder="Provide a detailed description of your issue here..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label>UPLOAD PROOF IMAGES (Multiple allowed, Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
                />
                {formData.images.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <p style={{ fontSize: '12px', color: 'green', marginBottom: '5px' }}>{formData.images.length} image(s) selected successfully!</p>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {formData.images.map((img, i) => (
                        <img key={i} src={img} alt={`Preview ${i}`} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc' }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setActiveTab('view')} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Submit Complaint
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>© 2026 Chhattisgarh e-Governance Initiative. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default App;
