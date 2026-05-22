import apiFetch from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export const useSubjectAccess = () => {
  const { user, isAdmin } = useAuth();
  const [purchasedSubjects, setPurchasedSubjects] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPurchasedSubjects(new Set());
    setLoading(true);

    if (user) {
      fetchPurchases(user.id);
    } else {
      setPurchasedSubjects(new Set());
      setLoading(false);
    }
  }, [user?.id]);

  const fetchPurchases = async (userId: string) => {
    try {
      const res = await apiFetch("/purchases");
      const body = await res.json();
      const purchases = body?.data || [];

      // Purchases may include lecture or subject info; only approved entries unlock content.
      const subjectIds = new Set<string>();
      for (const p of purchases) {
        if (p.userId && p.userId !== userId) continue;
        const status = String(p.status || "").toUpperCase();
        const isApproved = status === "APPROVED" || status === "COMPLETED";
        if (!isApproved) continue;

        if (p.subjectId) subjectIds.add(p.subjectId);
        else if (p.subject && p.subject.id) subjectIds.add(p.subject.id);
        else if (p.lecture && p.lecture.subjectId)
          subjectIds.add(p.lecture.subjectId);
      }

      setPurchasedSubjects(subjectIds);
    } catch (e) {
      console.error("Failed to fetch purchases", e);
      setPurchasedSubjects(new Set());
    }
    setLoading(false);
  };

  const hasAccess = (
    subjectId: string | null,
    isFreePreview: boolean = false,
  ): boolean => {
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
    if (user) {
      fetchPurchases(user.id);
    }
  };

  return {
    purchasedSubjects,
    loading,
    hasAccess,
    hasPurchased,
    refreshPurchases,
  };
};
