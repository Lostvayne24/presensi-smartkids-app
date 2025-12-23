// services/firebaseAuth.js
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updatePassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  // updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  // deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { auth, db } from '../firebase';

// Default admin credentials
const DEFAULT_ADMIN = {
  email: 'admin@smartkids-global.com',
  password: '@SmartKids123',
  name: 'Administrator',
  role: 'admin'
};

// Initialize default admin user
export const initializeDefaultAdmin = async () => {
  try {
    console.log('🔧 Initializing default admin user...');

    // Check if admin user already exists in Firestore
    const adminQuery = query(
      collection(db, 'users'), 
      where('email', '==', DEFAULT_ADMIN.email)
    );
    const adminSnapshot = await getDocs(adminQuery);
    
    if (!adminSnapshot.empty) {
      console.log('✅ Admin user exists in Firestore');
      
      // Check each admin user document
      adminSnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log('📋 Admin user data:', userData);
        
        // Pastikan role adalah 'admin'
        if (userData.role !== 'admin') {
          console.warn('⚠️ Admin user has wrong role, updating to "admin"');
          updateDoc(doc.ref, { role: 'admin' });
        }
      });
      
      return;
    }
    
    console.log('👤 Admin user not found in Firestore, creating...');
    
    // Try to create admin user in Firebase Auth
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        DEFAULT_ADMIN.email, 
        DEFAULT_ADMIN.password
      );
      
      // Create user document in Firestore dengan role yang benar
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: DEFAULT_ADMIN.email,
        name: DEFAULT_ADMIN.name,
        role: 'admin',
        createdAt: new Date().toISOString(),
        disabled: false
      });
      
      console.log('✅ Admin user created successfully with role: admin');
      
      // Sign out after creation
      await signOut(auth);
      
    } catch (authError) {
      if (authError.code === 'auth/email-already-in-use') {
        console.log('ℹ️ Admin email already in use in Firebase Auth');
        
        // Try to sign in to get the UID
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth, 
            DEFAULT_ADMIN.email, 
            DEFAULT_ADMIN.password
          );
          
          // Create or update user document in Firestore
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: DEFAULT_ADMIN.email,
            name: DEFAULT_ADMIN.name,
            role: 'admin',
            createdAt: new Date().toISOString(),
            disabled: false
          }, { merge: true });
          
          console.log('✅ Admin user document created/updated with role: admin');
          
          await signOut(auth);
        } catch (loginError) {
          console.error('❌ Error during admin login:', loginError);
        }
      } else {
        console.error('❌ Error creating admin user:', authError);
      }
    }
    
  } catch (error) {
    console.error('❌ Error initializing admin user:', error);
  }
};

// Login function with comprehensive error handling
export const login = async (email, password) => {
  try {
    console.log('🔐 Attempting login with:', email);
    
    // Validate input
    if (!email || !password) {
      return { success: false, error: 'Email dan password harus diisi' };
    }
    
    if (!email.includes('@')) {
      return { success: false, error: 'Format email tidak valid' };
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Firebase Auth success, UID:', user.uid);
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ User data found in Firestore:', userData);
      
      // Check if user is disabled
      if (userData.disabled === true) {
        console.log('❌ Login attempt for disabled user:', email);
        await signOut(auth);
        return { 
          success: false, 
          error: 'Akun ini telah dinonaktifkan. Hubungi administrator.' 
        };
      }
      
      // PASTIKAN ROLE ADA DAN VALID
      const userInfo = {
        id: user.uid,
        email: userData.email || user.email,
        name: userData.name || user.email.split('@')[0],
        role: userData.role || 'user'
      };
      
      // Validasi role
      if (!userInfo.role) {
        console.warn('⚠️ User role is missing, setting default to "user"');
        userInfo.role = 'user';
      }
      
      console.log('🎭 Final user info with role:', userInfo);
      
      // Store in localStorage for persistence
      localStorage.setItem('currentUser', JSON.stringify(userInfo));
      
      console.log('🎉 Login successful for:', userInfo.name, 'with role:', userInfo.role);
      return { success: true, user: userInfo };
      
    } else {
      console.log('❌ User document not found in Firestore');
      
      // Create user document if it doesn't exist
      const newUserData = {
        email: user.email,
        name: user.email.split('@')[0],
        role: 'user',
        createdAt: new Date().toISOString(),
        disabled: false
      };
      
      await setDoc(doc(db, 'users', user.uid), newUserData);
      console.log('📝 Created new user document in Firestore with role:', newUserData.role);
      
      const userInfo = {
        id: user.uid,
        ...newUserData
      };
      
      localStorage.setItem('currentUser', JSON.stringify(userInfo));
      return { success: true, user: userInfo };
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    let errorMessage = 'Terjadi kesalahan saat login';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'Email tidak terdaftar';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Password salah';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Format email tidak valid';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Akun ini dinonaktifkan';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Terlalu banyak percobaan login. Coba lagi nanti';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Koneksi internet bermasalah';
        break;
      case 'auth/invalid-credential':
        errorMessage = 'Email atau password salah';
        break;
      default:
        errorMessage = `Terjadi kesalahan: ${error.message}`;
    }
    
    return { success: false, error: errorMessage };
  }
};

// Logout function
export const logout = async () => {
  try {
    const currentUser = getCurrentUser();
    console.log('👋 Logging out user:', currentUser?.email);
    
    await signOut(auth);
    
    // Clear all stored data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userToken');
    sessionStorage.clear();
    
    console.log('✅ Logout successful');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    
    // Force clear localStorage even if logout fails
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userToken');
    
    return { 
      success: false, 
      error: 'Gagal logout: ' + error.message 
    };
  }
};

// Get current user from localStorage
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    
    // Validate user object
    if (user && user.id && user.email && user.name && user.role) {
      return user;
    }
    
    console.warn('⚠️ Invalid user data in localStorage');
    return null;
    
  } catch (error) {
    console.error('❌ Error parsing current user:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const user = getCurrentUser();
  return !!user;
};

// Check if user is admin
export const isAdmin = () => {
  const user = getCurrentUser();
  return user && user.role === 'admin';
};

// Auth state listener with error handling
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, 
    async (user) => {
      try {
        if (user) {
          console.log('🔄 Auth state changed - User signed in:', user.email);
          
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userInfo = {
              id: user.uid,
              email: userData.email,
              name: userData.name,
              role: userData.role
            };
            
            // Update localStorage
            localStorage.setItem('currentUser', JSON.stringify(userInfo));
            callback(userInfo);
            
          } else {
            console.log('❌ User document not found during auth state change');
            callback(null);
          }
        } else {
          console.log('🔄 Auth state changed - User signed out');
          callback(null);
        }
      } catch (error) {
        console.error('❌ Error in auth state change:', error);
        callback(null);
      }
    },
    (error) => {
      console.error('❌ Auth state listener error:', error);
      callback(null);
    }
  );
};

// User management functions
export const getAllUsers = async () => {
  try {
    console.log('📋 Fetching all users...');
    
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      // Exclude admin from list if needed, or include all
      users.push({
        id: doc.id,
        ...userData
      });
    });
    
    console.log(`✅ Found ${users.length} users`);
    return users;
    
  } catch (error) {
    console.error('❌ Error getting users:', error);
    return [];
  }
};

export const addUser = async (userData) => {
  try {
    console.log('👤 Adding new user:', userData.email);
    
    // Validate input
    if (!userData.email || !userData.password || !userData.name) {
      return { 
        success: false, 
        error: 'Email, password, dan nama harus diisi' 
      };
    }
    
    if (!userData.email.includes('@')) {
      return { 
        success: false, 
        error: 'Format email tidak valid' 
      };
    }
    
    if (userData.password.length < 6) {
      return { 
        success: false, 
        error: 'Password minimal 6 karakter' 
      };
    }

    // Check if email already exists
    const emailQuery = query(
      collection(db, 'users'), 
      where('email', '==', userData.email)
    );
    const emailSnapshot = await getDocs(emailQuery);
    
    if (!emailSnapshot.empty) {
      return { 
        success: false, 
        error: 'Email sudah digunakan' 
      };
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );

    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: userData.email,
      name: userData.name,
      role: 'user',
      createdAt: new Date().toISOString(),
      disabled: false
    });

    console.log('✅ User added successfully:', userData.email);
    
    return { 
      success: true, 
      user: { 
        id: userCredential.user.uid, 
        ...userData 
      } 
    };
    
  } catch (error) {
    console.error('❌ Error adding user:', error);
    
    let errorMessage = 'Gagal menambah user';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Email sudah digunakan';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password terlalu lemah';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Format email tidak valid';
        break;
      default:
        errorMessage = `Gagal menambah user: ${error.message}`;
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
};

export const updateUser = async (userId, updates) => {
  try {
    console.log('✏️ Updating user:', userId);
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { 
        success: false, 
        error: 'User tidak ditemukan' 
      };
    }
    
    // Remove password from updates (handled separately)
    const { password, ...userUpdates } = updates;
    
    // Update user data in Firestore
    if (Object.keys(userUpdates).length > 0) {
      await updateDoc(userRef, userUpdates);
    }
    
    console.log('✅ User updated successfully in Firestore');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error updating user:', error);
    return { 
      success: false, 
      error: 'Gagal mengupdate user: ' + error.message 
    };
  }
};

export const updateUserPassword = async (userId, currentPassword, newPassword) => {
  try {
    console.log('🔐 Updating password for user:', userId);
    
    // Get current user from auth
    const currentAuthUser = auth.currentUser;
    
    if (!currentAuthUser) {
      return { 
        success: false, 
        error: 'Anda harus login terlebih dahulu' 
      };
    }
    
    // Check if user is updating their own password
    if (currentAuthUser.uid === userId) {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentAuthUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(currentAuthUser, credential);
      
      // Update password
      await updatePassword(currentAuthUser, newPassword);
      
      console.log('✅ Password updated successfully');
      return { 
        success: true, 
        message: 'Password berhasil diubah' 
      };
    } else {
      // For admin updating other user's password, send reset email
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return { 
          success: false, 
          error: 'User tidak ditemukan' 
        };
      }
      
      const userData = userDoc.data();
      await sendPasswordResetEmail(auth, userData.email);
      
      console.log('✅ Password reset email sent to:', userData.email);
      return { 
        success: true, 
        message: 'Email reset password telah dikirim ke user' 
      };
    }
    
  } catch (error) {
    console.error('❌ Error updating password:', error);
    
    let errorMessage = 'Gagal mengupdate password';
    
    switch (error.code) {
      case 'auth/wrong-password':
        errorMessage = 'Password saat ini salah';
        break;
      case 'auth/requires-recent-login':
        errorMessage = 'Untuk keamanan, silakan login ulang';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password terlalu lemah';
        break;
      default:
        errorMessage = `Gagal mengupdate password: ${error.message}`;
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
};

export const deleteUser = async (userId) => {
  try {
    console.log('🗑️ Deleting/disabling user:', userId);
    
    // Prevent deleting own account
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      return { 
        success: false, 
        error: 'Tidak dapat menghapus akun sendiri' 
      };
    }
    
    // Instead of deleting, disable the user account
    await updateDoc(doc(db, 'users', userId), {
      disabled: true,
      disabledAt: new Date().toISOString(),
      disabledBy: currentUser?.id || 'system'
    });
    
    console.log('✅ User disabled successfully');
    return { 
      success: true,
      message: 'User telah dinonaktifkan' 
    };
    
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    return { 
      success: false, 
      error: 'Gagal menghapus user: ' + error.message 
    };
  }
};

export const enableUser = async (userId) => {
  try {
    console.log('✅ Enabling user:', userId);
    
    await updateDoc(doc(db, 'users', userId), {
      disabled: false,
      enabledAt: new Date().toISOString(),
      enabledBy: getCurrentUser()?.id || 'system'
    });
    
    console.log('✅ User enabled successfully');
    return { 
      success: true,
      message: 'User telah diaktifkan kembali' 
    };
    
  } catch (error) {
    console.error('❌ Error enabling user:', error);
    return { 
      success: false, 
      error: 'Gagal mengaktifkan user: ' + error.message 
    };
  }
};

export const checkEmailExists = async (email) => {
  try {
    const emailQuery = query(
      collection(db, 'users'), 
      where('email', '==', email)
    );
    const emailSnapshot = await getDocs(emailQuery);
    return !emailSnapshot.empty;
  } catch (error) {
    console.error('❌ Error checking email:', error);
    return false;
  }
};

// Reset password function
export const resetPassword = async (email) => {
  try {
    if (!email) {
      return { 
        success: false, 
        error: 'Email harus diisi' 
      };
    }
    
    await sendPasswordResetEmail(auth, email);
    
    console.log('✅ Password reset email sent to:', email);
    return { 
      success: true, 
      message: 'Email reset password telah dikirim' 
    };
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    
    let errorMessage = 'Gagal mengirim email reset password';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'Email tidak terdaftar';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Format email tidak valid';
        break;
      default:
        errorMessage = 'Gagal mengirim email reset password';
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting user by ID:', error);
    return null;
  }
};

// Force clear all auth data (for debugging)
export const forceClearAuth = () => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('userToken');
  sessionStorage.clear();
  console.log('🧹 All auth data cleared');
};

// Change current user's password
export const changeCurrentUserPassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return { 
        success: false, 
        error: 'Anda harus login terlebih dahulu' 
      };
    }
    
    // Re-authenticate user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update password
    await updatePassword(user, newPassword);
    
    console.log('✅ Password changed successfully');
    return { 
      success: true, 
      message: 'Password berhasil diubah' 
    };
    
  } catch (error) {
    console.error('❌ Error changing password:', error);
    
    let errorMessage = 'Gagal mengubah password';
    
    switch (error.code) {
      case 'auth/wrong-password':
        errorMessage = 'Password saat ini salah';
        break;
      case 'auth/requires-recent-login':
        errorMessage = 'Untuk keamanan, silakan login ulang terlebih dahulu';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password terlalu lemah';
        break;
      default:
        errorMessage = `Gagal mengubah password: ${error.message}`;
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
};