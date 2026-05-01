import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';

export default function NotFoundPage() {
  const { user, loading } = useAuth();
  const navigate          = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) navigate('/dashboard', { replace: true });
    else      navigate('/',          { replace: true });
  }, [user, loading, navigate]);

  return null;
}