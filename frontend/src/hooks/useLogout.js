import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * Signing out clears the session and returns the user to the home page — the
 * platform hub, where sign-in lives.
 */
export function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return () => {
    logout();
    navigate('/', { replace: true });
  };
}
