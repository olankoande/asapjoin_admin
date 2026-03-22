import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '../api/types';
import { authApi } from '../api/endpoints';
import { clearStoredSession, getStoredAccessToken, getStoredRefreshToken, storeSessionTokens } from '../api/httpClient';

interface AuthCtx {
  user: User | null;
  permissions: string[];
  roleCodes: string[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isReady: boolean;
  can: (permissionCode: string) => boolean;
  canAny: (...permissionCodes: string[]) => boolean;
  hasRole: (roleCode: string) => boolean;
  refreshAuthorization: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(AuthContext);

const USER_KEY = 'user';
const PERMISSIONS_KEY = 'permissions';
const ROLES_KEY = 'roles';

function readJsonArray(key: string) {
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

function getStoredUser() {
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function persistAuthorization(user: User, permissions: string[], roleCodes: string[]) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
  localStorage.setItem(ROLES_KEY, JSON.stringify(roleCodes));
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [permissions, setPermissions] = useState<string[]>(() => readJsonArray(PERMISSIONS_KEY));
  const [roleCodes, setRoleCodes] = useState<string[]>(() => readJsonArray(ROLES_KEY));
  const [isReady, setIsReady] = useState(false);

  const applyAuthorization = useCallback((nextUser: User, nextPermissions: string[], nextRoleCodes: string[]) => {
    persistAuthorization(nextUser, nextPermissions, nextRoleCodes);
    setUser(nextUser);
    setPermissions(nextPermissions);
    setRoleCodes(nextRoleCodes);
  }, []);

  const refreshAuthorization = useCallback(async () => {
    const [{ data: meData }, { data: permissionsData }, { data: rolesData }] = await Promise.all([
      authApi.me(),
      authApi.mePermissions(),
      authApi.meRoles(),
    ]);

    if (meData.user.role !== 'admin' && meData.user.role !== 'support') {
      clearStoredSession();
      throw new Error('Acces reserve aux administrateurs');
    }

    applyAuthorization(meData.user, permissionsData.permissions, rolesData.roles);
  }, [applyAuthorization]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    if (data.user.role !== 'admin' && data.user.role !== 'support') {
      clearStoredSession();
      throw new Error('Acces reserve aux administrateurs');
    }

    storeSessionTokens(data.accessToken, data.refreshToken);
    await refreshAuthorization();
  }, [refreshAuthorization]);

  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
    setPermissions([]);
    setRoleCodes([]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrateSession = async () => {
      const accessToken = getStoredAccessToken();
      const refreshToken = getStoredRefreshToken();

      if (!accessToken && !refreshToken) {
        if (!cancelled) {
          setUser(null);
          setPermissions([]);
          setRoleCodes([]);
          setIsReady(true);
        }
        return;
      }

      try {
        await refreshAuthorization();
      } catch {
        clearStoredSession();
        if (!cancelled) {
          setUser(null);
          setPermissions([]);
          setRoleCodes([]);
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    };

    void hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [refreshAuthorization]);

  const can = useCallback((permissionCode: string) => permissions.includes(permissionCode), [permissions]);
  const canAny = useCallback((...permissionCodes: string[]) => permissionCodes.some((permissionCode) => permissions.includes(permissionCode)), [permissions]);
  const hasRole = useCallback((roleCode: string) => roleCodes.includes(roleCode), [roleCodes]);

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        roleCodes,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        isReady,
        can,
        canAny,
        hasRole,
        refreshAuthorization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
