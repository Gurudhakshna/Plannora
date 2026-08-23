import { useState, useCallback, useEffect } from "react";
import type { StudyPlan } from "../types/task";
import { loadStudyPlan, saveStudyPlan as savePlanToStorage, hasStudyPlan } from "../utils/storage";

export function useStudyPlan(userId?: string | null) {
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(() => (userId ? loadStudyPlan(userId) : null));

  useEffect(() => {
    if (userId) {
      setStudyPlan(loadStudyPlan(userId));
    } else {
      setStudyPlan(null);
    }
  }, [userId]);

  const savePlan = useCallback(
    (plan: StudyPlan) => {
      savePlanToStorage(plan);
      setStudyPlan(plan);
    },
    []
  );

  const planExists = userId ? hasStudyPlan(userId) : false;

  return {
    studyPlan,
    savePlan,
    planExists,
  };
}
