'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';

interface AuthContextType {
  userId: string | null; // ユーザーID を Context で管理
  isAdmin: boolean;
  login: (userId: string, passwordPlain: string) => Promise<boolean>; // ログイン関数
  register: (userId: string, passwordPlain: string) => Promise<boolean>; // 登録関数
  logout: () => Promise<void>; // ログアウト関数
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null); // ユーザーID を Context で管理
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // 管理者フラグ (ここでは簡易的に false で固定)


  // ログイン処理
  const login = useCallback(async (userId: string, passwordPlain: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password: passwordPlain }),
      });

      if (!response.ok) {
        console.error('Login failed:', response.statusText);
        return false; // ログイン失敗
      }
      const data = await response.json();
      setUserId(data.userId); // ログイン成功時にユーザーIDを Context に保存
      return true; // ログイン成功

    } catch (error) {
      console.error('Login error:', error);
      return false; // ログイン失敗
    }
  }, []);


  // ユーザー登録処理 (開発環境のみ)
  const register = useCallback(async (userId: string, passwordPlain: string): Promise<boolean> => {
    if (process.env.NODE_ENV === 'production') {
      return false; // 本番環境では登録 API を呼ばない
    }
    try {
      const response = await fetch('/api/auth/register', { // PUT リクエストを使用
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password: passwordPlain }),
      });

      if (!response.ok) {
        console.error('Registration failed:', response.statusText);
        return false; // 登録失敗
      }
      const data = await response.json();
      setUserId(data.userId); // 登録後、ログイン状態にする場合はユーザーIDを Context に保存 (ここでは登録のみ)
      return true; // 登録成功

    } catch (error) {
      console.error('Registration error:', error);
      return false; // 登録失敗
    }
  }, []);


  // ログアウト処理
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'DELETE', // DELETE リクエストを使用
      });
      setUserId(null); // ログアウト時にユーザーIDを Context からクリア
      setIsAdmin(false); // 管理者フラグもリセット

    } catch (error) {
      console.error('Logout error:', error);
      // ログアウト失敗時のエラーハンドリング (必要に応じて)
    }
  }, []);


  // 初期ロード時に Cookie を確認してログイン状態を復元 (自動ログイン)
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)copyspace_token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
      if (token) {
        // Cookie にトークンが存在する場合は、トークン検証 API (例: /api/auth/verify-token) を呼び出してユーザー情報を取得し、Context に保存する (今回は簡易化のため省略)
        // ここでは簡易的に Cookie が存在すればログイン状態とみなす
        //  setUserId('loggedInUser'); // 例: ユーザーID を Context にセット (実際には API から取得)
      }
    };
    checkAuthStatus();
  }, []);


  const value: AuthContextType = {
    userId: userId,
    isAdmin: isAdmin,
    login: login,
    register: register,
    logout: logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};