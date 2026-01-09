import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSubjectAccess = () => {
  const { user, isAdmin } = useAuth();
  const [purchasedSubjects, setPurchasedSubjects] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPurchases();
    } else {
      setPurchasedSubjects(new Set());
      setLoading(false);
    }
  }, [user]);

  const fetchPurchases = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_subject_purchases')
      .select('subject_id')
      .eq('user_id', user.id)
      .eq('payment_status', 'completed');
    
    if (data) {
      setPurchasedSubjects(new Set(data.map(p => p.subject_id)));
    }
    setLoading(false);
  };

  const hasAccess = (subjectId: string | null, isFreePreview: boolean = false): boolean => {
    // Admins have access to everything
    if (isAdmin) return true;
    
    // No subject = free access (backward compatibility)
    if (!subjectId) return true;
    
    // Free preview lectures are accessible
    if (isFreePreview) return true;
    
    // Check if user has purchased the subject
    return purchasedSubjects.has(subjectId);
  };

  const hasPurchased = (subjectId: string): boolean => {
    return purchasedSubjects.has(subjectId);
  };

  const refreshPurchases = () => {
    fetchPurchases();
  };

  return {
    purchasedSubjects,
    loading,
    hasAccess,
    hasPurchased,
    refreshPurchases,
  };
};
