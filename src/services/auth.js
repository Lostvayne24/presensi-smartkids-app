// Simulasi database user dengan auto-reset feature
const DEFAULT_USERS = [
  {
    id: 1,
    username: process.env.REACT_APP_ADMIN_USERNAME,
    password: process.env.REACT_APP_ADMIN_PASSWORD,
    name: 'Administrator',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    username: process.env.REACT_APP_USER_USERNAME,
    password: process.env.REACT_APP_USER_PASSWORD,
    name: 'Tutor A',
    role: 'user',
    createdAt: new Date().toISOString()
  }
];

// Initialize atau reset users
const initializeUsers = () => {
  console.log('Initializing users with default credentials...');
  localStorage.setItem('bimbel_users', JSON.stringify(DEFAULT_USERS));
  localStorage.setItem('nextUserId', (DEFAULT_USERS.length + 1).toString());
  return DEFAULT_USERS;
};

// Check if users need to be reset (jika struktur berubah atau admin credentials berbeda)
const shouldResetUsers = (storedUsers) => {
  if (!storedUsers || !Array.isArray(storedUsers) || storedUsers.length === 0) {
    console.log('Reset needed: No stored users found');
    return true;
  }

  // Check jika admin user tidak ada
  const storedAdmin = storedUsers.find(u => u.role === 'admin');
  const defaultAdmin = DEFAULT_USERS.find(u => u.role === 'admin');

  if (!storedAdmin) {
    console.log('Reset needed: No admin user found in storage');
    return true;
  }

  // Check jika credentials admin berbeda
  if (storedAdmin.username !== defaultAdmin.username || storedAdmin.password !== defaultAdmin.password) {
    console.log('Reset needed: Admin credentials changed', {
      stored: { username: storedAdmin.username, password: '***' },
      default: { username: defaultAdmin.username, password: '***' }
    });
    return true;
  }

  // Check jika jumlah user default tidak match
  if (storedUsers.length < DEFAULT_USERS.length) {
    console.log('Reset needed: Missing default users');
    return true;
  }

  return false;
};

// Initialize users data
let users = [];
let nextUserId = DEFAULT_USERS.length + 1;

try {
  const storedUsers = JSON.parse(localStorage.getItem('bimbel_users'));
  const storedNextId = localStorage.getItem('nextUserId');

  if (shouldResetUsers(storedUsers)) {
    console.log('Performing auto-reset of user data...');
    users = initializeUsers();
  } else {
    users = storedUsers;
    nextUserId = parseInt(storedNextId) || DEFAULT_USERS.length + 1;
    console.log('Loaded existing user data from storage');
  }
} catch (error) {
  console.error('Error loading users from localStorage, resetting to default:', error);
  users = initializeUsers();
}

// Fungsi untuk manual reset (bisa dipanggil dari console browser)
export const resetToDefaultUsers = () => {
  console.log('Manual reset triggered');
  users = initializeUsers();
  localStorage.removeItem('currentUser'); // Force logout
  return users;
};

// Fungsi untuk mendapatkan info tentang system state (debug purposes)
export const getSystemInfo = () => {
  const storedUsers = JSON.parse(localStorage.getItem('bimbel_users')) || [];
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  return {
    defaultAdmin: {
      username: DEFAULT_USERS[0].username,
      passwordLength: DEFAULT_USERS[0].password.length
    },
    storedUsersCount: storedUsers.length,
    storedAdmin: storedUsers.find(u => u.role === 'admin') || null,
    currentUser: currentUser,
    nextUserId: nextUserId
  };
};

export const login = (username, password) => {
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    console.log('Login successful for user:', user.username);
    return user;
  }
  console.log('Login failed for username:', username);
  return null;
};

export const logout = () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  console.log('Logout:', currentUser?.username);
  localStorage.removeItem('currentUser');
};

export const checkAuth = () => {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
};

// User management functions
export const getAllUsers = () => {
  return users.filter(user => user.role !== 'admin'); // Jangan tampilkan admin
};

export const addUser = (userData) => {
  try {
    // Validasi username unik
    if (users.some(user => user.username === userData.username)) {
      return { success: false, error: 'Username sudah digunakan' };
    }

    const newUser = {
      id: nextUserId++,
      username: userData.username,
      password: userData.password,
      name: userData.name,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('bimbel_users', JSON.stringify(users));
    localStorage.setItem('nextUserId', nextUserId.toString());

    console.log('User added:', newUser.username);
    return { success: true, user: newUser };
  } catch (error) {
    console.error('Error adding user:', error);
    return { success: false, error: 'Gagal menambah user' };
  }
};

export const updateUser = (userId, updates) => {
  try {
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      return { success: false, error: 'User tidak ditemukan' };
    }

    // Jangan izinkan update role ke admin
    if (updates.role && updates.role === 'admin') {
      return { success: false, error: 'Tidak dapat mengubah role menjadi admin' };
    }

    // Validasi username unik (kecuali untuk user yang sama)
    if (updates.username && users.some(user => user.username === updates.username && user.id !== userId)) {
      return { success: false, error: 'Username sudah digunakan' };
    }

    users[userIndex] = { ...users[userIndex], ...updates };
    localStorage.setItem('bimbel_users', JSON.stringify(users));

    // Update current user jika yang diupdate adalah user yang sedang login
    const currentUser = checkAuth();
    if (currentUser && currentUser.id === userId) {
      localStorage.setItem('currentUser', JSON.stringify(users[userIndex]));
    }

    console.log('User updated:', users[userIndex].username);
    return { success: true, user: users[userIndex] };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: 'Gagal mengupdate user' };
  }
};

export const deleteUser = (userId) => {
  try {
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      return { success: false, error: 'User tidak ditemukan' };
    }

    const userToDelete = users[userIndex];

    // Jangan izinkan menghapus admin
    if (userToDelete.role === 'admin') {
      return { success: false, error: 'Tidak dapat menghapus admin' };
    }

    users.splice(userIndex, 1);
    localStorage.setItem('bimbel_users', JSON.stringify(users));

    // Logout user jika yang dihapus sedang login
    const currentUser = checkAuth();
    if (currentUser && currentUser.id === userId) {
      localStorage.removeItem('currentUser');
    }

    console.log('User deleted:', userToDelete.username);
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Gagal menghapus user' };
  }
};

export const checkUsernameExists = (username) => {
  return users.some(user => user.username === username);
};

// Fungsi untuk update admin credentials
export const updateAdminCredentials = (currentUsername, currentPassword, newUsername, newPassword) => {
  try {
    // Cari admin user
    const adminIndex = users.findIndex(u => u.role === 'admin');
    if (adminIndex === -1) {
      return { success: false, error: 'Admin user tidak ditemukan' };
    }

    const adminUser = users[adminIndex];

    // Verifikasi credentials saat ini
    if (adminUser.username !== currentUsername || adminUser.password !== currentPassword) {
      return { success: false, error: 'Username atau password saat ini salah' };
    }

    // Validasi new username (jika diubah)
    if (newUsername && newUsername !== currentUsername) {
      const usernameExists = users.some(u => u.username === newUsername && u.id !== adminUser.id);
      if (usernameExists) {
        return { success: false, error: 'Username baru sudah digunakan' };
      }
      adminUser.username = newUsername;
    }

    // Update password (jika diisi)
    if (newPassword) {
      adminUser.password = newPassword;
    }

    // Update DEFAULT_USERS untuk consistency (dalam memory saja)
    DEFAULT_USERS[0].username = adminUser.username;
    DEFAULT_USERS[0].password = adminUser.password;

    // Simpan perubahan
    users[adminIndex] = adminUser;
    localStorage.setItem('bimbel_users', JSON.stringify(users));

    // Update current user jika admin sedang login
    const currentUser = checkAuth();
    if (currentUser && currentUser.id === adminUser.id) {
      localStorage.setItem('currentUser', JSON.stringify(adminUser));
    }

    console.log('Admin credentials updated:', adminUser.username);
    return {
      success: true,
      message: 'Credentials admin berhasil diupdate',
      user: adminUser
    };
  } catch (error) {
    console.error('Error updating admin credentials:', error);
    return { success: false, error: 'Gagal mengupdate credentials admin' };
  }
};

// Fungsi untuk mendapatkan info admin (tanpa password)
export const getAdminInfo = () => {
  const adminUser = users.find(u => u.role === 'admin');
  if (!adminUser) return null;

  // Return tanpa password untuk keamanan
  return {
    id: adminUser.id,
    username: adminUser.username,
    name: adminUser.name,
    role: adminUser.role,
    createdAt: adminUser.createdAt
  };
};

// Export DEFAULT_USERS untuk keperluan testing/debug
export { DEFAULT_USERS };
