import apiFetch from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export const useSubjectAccess = () => {
  const { user, isAdmin } = useAuth();
  const [purchasedSubjects, setPurchasedSubjects] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const TEST_PURCHASES_KEY = "test_purchased_subjects";

  const getLocalTestPurchases = () => {
    try {
      const raw = localStorage.getItem(TEST_PURCHASES_KEY);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      return new Set(
        parsed.filter((item) => typeof item === "string" && item.length > 0),
      );
    } catch {
      return new Set<string>();
    }
  };

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
    try {
      const res = await apiFetch("/purchases");
      const body = await res.json();
      const purchases = body?.data || [];

      // purchases may include lecture or subject info; normalize to subject ids
      const subjectIds = new Set<string>();
      for (const p of purchases) {
        if (p.subjectId) subjectIds.add(p.subjectId);
        else if (p.subjects && p.subjects.id) subjectIds.add(p.subjects.id);
        else if (p.lecture && p.lecture.subjectId)
          subjectIds.add(p.lecture.subjectId);
      }

      const localTestPurchases = getLocalTestPurchases();
      for (const subjectId of localTestPurchases) {
        subjectIds.add(subjectId);
      }

      setPurchasedSubjects(subjectIds);
    } catch (e) {
      console.error("Failed to fetch purchases", e);
      setPurchasedSubjects(getLocalTestPurchases());
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
