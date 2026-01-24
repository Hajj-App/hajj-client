/**
 * Hajj Ritual Detail Page
 * 
 * Uses the shared RitualDetailScreen component for consistency
 * and reduced code duplication.
 */

import React from "react";
import { useLocalSearchParams } from "expo-router";
import RitualDetailScreen from "@/components/shared/RitualDetailScreen";

const HajjRitualDetail = () => {
  const { id } = useLocalSearchParams();

  return (
    <RitualDetailScreen
      ritualId={id as string}
      ritualType="hajj"
      legacyCollection="hajj_uploads"
    />
  );
};

export default HajjRitualDetail;
